import puppeteer from "puppeteer";
import type { Page } from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

const REPLAY_PAGE = "https://www.haxball.com/replay";

export class ClipRenderer {
  async render(duration: number): Promise<string> {
    const clipsDir = path.resolve(__dirname, "../../clips");
    if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

    const hbr2File = this.findHbr2(clipsDir);
    const framesDir = path.join(clipsDir, `frames-${Date.now()}`);
    fs.mkdirSync(framesDir, { recursive: true });

    const outputPath = path.join(clipsDir, `clip-${Date.now()}.gif`);

    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      headless: true,
      args: ["--no-sandbox", "--disable-web-security", "--allow-running-insecure-content"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      await page.goto(REPLAY_PAGE, { waitUntil: "networkidle0", timeout: 30000 });

      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 15000 });
      if (!fileInput) throw new Error("file input not found");
      await fileInput.uploadFile(hbr2File);

      await page.waitForSelector("canvas", { timeout: 15000 });

      await tryClosePopup(page);
      await sleep(200);

      await this.setViewMode(page);

      await page.waitForFunction(() => typeof (window as any).HaxReplay !== "undefined", { timeout: 10000 });

      await page.evaluate(() => {
        (window as any).HaxReplay.setCamera(1);
      });

      const totalDuration = await page.evaluate(() => {
        return (window as any).HaxReplay.getDuration();
      });

      const seekTime = Math.max(0, totalDuration - duration);

      await page.evaluate((t: number) => {
        (window as any).HaxReplay.goToTime(t);
      }, seekTime);

      await sleep(200);

      const fps = 30;
      const totalFrames = Math.round(duration * fps);
      const frameDelaySec = 1 / fps;

      for (let i = 0; i < totalFrames; i++) {
        const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
        await page.screenshot({ path: framePath, type: "png" });
        const currentTime = seekTime + (i + 1) * frameDelaySec;
        if (currentTime <= totalDuration) {
          await page.evaluate((t: number) => {
            (window as any).HaxReplay.goToTime(t);
          }, currentTime);
          await sleep(15);
        }
      }

      this.buildGif(framesDir, fps, outputPath);

      fs.rmSync(framesDir, { recursive: true, force: true });

      console.log(`✅ GIF: ${outputPath}`);
      return outputPath;
    } finally {
      await browser.close();
    }
  }

  async renderFromHbr2(hbr2Path: string, duration: number, outputPath: string): Promise<void> {
    const clipsDir = path.dirname(outputPath);
    if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

    const framesDir = path.join(clipsDir, `frames-${Date.now()}`);
    fs.mkdirSync(framesDir, { recursive: true });

    const browser = await puppeteer.launch({
      executablePath: process.env.CHROMIUM_PATH || undefined,
      headless: true,
      args: ["--no-sandbox", "--disable-web-security", "--allow-running-insecure-content"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      await page.goto(REPLAY_PAGE, { waitUntil: "networkidle0", timeout: 30000 });

      const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 15000 });
      if (!fileInput) throw new Error("file input not found");
      await fileInput.uploadFile(hbr2Path);

      await page.waitForSelector("canvas", { timeout: 15000 });

      await tryClosePopup(page);
      await sleep(200);

      await this.setViewMode(page);

      await page.waitForFunction(() => typeof (window as any).HaxReplay !== "undefined", { timeout: 10000 });

      await page.evaluate(() => {
        (window as any).HaxReplay.setCamera(1);
      });

      const totalDuration = await page.evaluate(() => {
        return (window as any).HaxReplay.getDuration();
      });

      const seekTime = Math.max(0, totalDuration - duration);

      await page.evaluate((t: number) => {
        (window as any).HaxReplay.goToTime(t);
      }, seekTime);

      await sleep(200);

      const fps = 30;
      const totalFrames = Math.round(duration * fps);
      const frameDelaySec = 1 / fps;

      for (let i = 0; i < totalFrames; i++) {
        const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
        await page.screenshot({ path: framePath, type: "png" });
        const currentTime = seekTime + (i + 1) * frameDelaySec;
        if (currentTime <= totalDuration) {
          await page.evaluate((t: number) => {
            (window as any).HaxReplay.goToTime(t);
          }, currentTime);
          await sleep(15);
        }
      }

      this.buildGif(framesDir, fps, outputPath);

      fs.rmSync(framesDir, { recursive: true, force: true });

      console.log(`✅ GIF: ${outputPath}`);
    } finally {
      await browser.close();
    }
  }

  private setViewMode(page: Page): Promise<void> {
    return page.evaluate(() => {
      const select = document.querySelector('[data-hook="viewmode"]') as HTMLSelectElement;
      if (select) {
        select.value = "Full 1x Zoom";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  }

  private findHbr2(dir: string): string {
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".hbr2")).sort();
    if (files.length === 0) throw new Error("Nenhum .hbr2 encontrado em clips/");
    return path.join(dir, files[files.length - 1]);
  }

  private buildGif(framesDir: string, fps: number, outputPath: string): void {
    const inputPattern = path.join(framesDir, "frame-%05d.png");
    const palettePath = path.join(framesDir, "palette.png");

    execSync(
      `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -vf "fps=${fps},scale=1280:-1:flags=lanczos,palettegen=stats_mode=diff" "${palettePath}"`,
      { timeout: 120000, stdio: "pipe" }
    );
    execSync(
      `ffmpeg -y -framerate ${fps} -i "${inputPattern}" -i "${palettePath}" -lavfi "fps=${fps},scale=1280:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer" "${outputPath}"`,
      { timeout: 120000, stdio: "pipe" }
    );
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function tryClosePopup(page: Page): Promise<void> {
  const closeBtn = await page.$('[data-hook="close"]');
  if (closeBtn) await closeBtn.click();
}
