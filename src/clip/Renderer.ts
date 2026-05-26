import puppeteer from "puppeteer";
import type { Page, ElementHandle } from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { execSync } from "node:child_process";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-web-security",
  "--allow-running-insecure-content",
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
];

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
      args: LAUNCH_ARGS,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      page.on("console", (msg) => console.error(`[browser] ${msg.type()}: ${msg.text()}`));
      page.on("pageerror", (err) => console.error("[browser] uncaught:", err));

      await page.goto("https://www.haxball.com/replay", {
        waitUntil: "networkidle0",
        timeout: 90000,
      });

      const fileInput = await this.waitFileInput(page);
      await fileInput.uploadFile(hbr2File);

      const closeBtn = await page.waitForSelector('.settings-view [data-hook="close"]', { timeout: 20000 });
      if (closeBtn) await closeBtn.click();
      else console.warn("settings close button not found, continuing");

      await page.waitForSelector("canvas", { timeout: 20000 });
      await sleep(1000);

      await this.configureReplay(page);

      const totalDuration = await page.evaluate(() => (window as any).HaxReplay.getDuration());
      const seekTime = Math.max(0, totalDuration - duration);

      await page.evaluate((t: number) => (window as any).HaxReplay.goToTime(t), seekTime);
      await sleep(200);

      const fps = 30;
      const totalFrames = Math.round(duration * fps);
      const frameDelaySec = 1 / fps;

      for (let i = 0; i < totalFrames; i++) {
        const fp = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
        await page.screenshot({ path: fp, type: "png" });
        const t = seekTime + (i + 1) * frameDelaySec;
        if (t <= totalDuration) {
          await page.evaluate((time: number) => (window as any).HaxReplay.goToTime(time), t);
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
      args: LAUNCH_ARGS,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 720 });

      page.on("console", (msg) => console.error(`[browser] ${msg.type()}: ${msg.text()}`));
      page.on("pageerror", (err) => console.error("[browser] uncaught:", err));

      await page.goto("https://www.haxball.com/replay", {
        waitUntil: "networkidle0",
        timeout: 90000,
      });

      const fileInput = await this.waitFileInput(page);
      await fileInput.uploadFile(hbr2Path);

      const closeBtn = await page.waitForSelector('.settings-view [data-hook="close"]', { timeout: 20000 });
      if (closeBtn) await closeBtn.click();

      await page.waitForSelector("canvas", { timeout: 20000 });
      await sleep(1000);

      await this.configureReplay(page);

      const totalDuration = await page.evaluate(() => (window as any).HaxReplay.getDuration());
      const seekTime = Math.max(0, totalDuration - duration);

      await page.evaluate((t: number) => (window as any).HaxReplay.goToTime(t), seekTime);
      await sleep(200);

      const fps = 30;
      const totalFrames = Math.round(duration * fps);
      const frameDelaySec = 1 / fps;

      for (let i = 0; i < totalFrames; i++) {
        const fp = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
        await page.screenshot({ path: fp, type: "png" });
        const t = seekTime + (i + 1) * frameDelaySec;
        if (t <= totalDuration) {
          await page.evaluate((time: number) => (window as any).HaxReplay.goToTime(time), t);
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

  private async waitFileInput(page: Page): Promise<ElementHandle<HTMLInputElement>> {
    const selectors = ["#replayerfile", 'input[data-hook="file"]', 'input[type="file"]'];
    for (const sel of selectors) {
      try {
        const el = await page.waitForSelector(sel, { timeout: 15000 });
        if (el) return el as ElementHandle<HTMLInputElement>;
      } catch {}
    }
    const html = await page.evaluate(() => document.body.innerHTML.substring(0, 3000));
    const title = await page.title();
    const url = page.url();
    throw new Error(
      `File input not found. title="${title}" url="${url}" html(3k)=${html}`
    );
  }

  private async configureReplay(page: Page): Promise<void> {
    const hasHaxReplay = await page.evaluate(() => typeof (window as any).HaxReplay !== "undefined");
    if (!hasHaxReplay) {
      await page.waitForFunction(() => typeof (window as any).HaxReplay !== "undefined", { timeout: 15000 });
    }

    await page.evaluate(() => {
      const sel = document.querySelector('[data-hook="viewmode"]') as HTMLSelectElement;
      if (sel) {
        sel.value = "Full 1x Zoom";
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    await page.evaluate(() => {
      const hr = (window as any).HaxReplay;
      if (hr) hr.setCamera(1);
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
