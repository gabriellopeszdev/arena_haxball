import puppeteer from "puppeteer";
import type { Page, Frame, ElementHandle } from "puppeteer";
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

      page.on("pageerror", () => {});

      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (req.url().includes("cpmstar") || req.url().includes("doubleclick") || req.url().includes("googlesyndication")) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.goto("https://www.haxball.com/replay?v=3", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const replayer = await this.waitReplayerFrame(page);

      const fileInput = await this.waitFrameSelector(replayer, "#replayerfile", 20000);
      await (fileInput as ElementHandle<HTMLInputElement>).uploadFile(hbr2File);

      await sleep(3000);

      const replayerPage = await this.waitReplayerFrame(page);

      const hasSettings = await replayerPage.evaluate(() => !!document.querySelector('.settings-view [data-hook="close"]'));
      if (hasSettings) {
        await replayerPage.evaluate(() => {
          const btn = document.querySelector('.settings-view [data-hook="close"]') as HTMLButtonElement;
          if (btn) btn.click();
        });
      }

      await replayerPage.waitForSelector("canvas", { timeout: 20000 });
      await sleep(2000);

      await replayerPage.evaluate(() => {
        const sel = document.querySelector('[data-hook="viewmode"]') as HTMLSelectElement;
        if (sel) { sel.value = "Full 1x Zoom"; sel.dispatchEvent(new Event("change", { bubbles: true })); }
      });

      await replayerPage.waitForFunction(() => typeof (window as any).HaxReplay !== "undefined", { timeout: 10000 });

      await replayerPage.evaluate(() => (window as any).HaxReplay.setCamera(1));

      const totalDuration = await replayerPage.evaluate(() => (window as any).HaxReplay.getDuration());
      const seekTime = Math.max(0, totalDuration - duration);

      await replayerPage.evaluate((t: number) => (window as any).HaxReplay.goToTime(t), seekTime);
      await sleep(200);

      const fps = 30;
      const totalFrames = Math.round(duration * fps);
      const frameDelaySec = 1 / fps;
      const canvas = await replayerPage.$("canvas");

      for (let i = 0; i < totalFrames; i++) {
        const fp = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`);
        if (canvas) {
          const clip = await canvas.boundingBox();
          if (clip) {
            await page.screenshot({ path: fp, type: "png", clip });
          } else {
            await page.screenshot({ path: fp, type: "png" });
          }
        } else {
          await page.screenshot({ path: fp, type: "png" });
        }
        const t = seekTime + (i + 1) * frameDelaySec;
        if (t <= totalDuration) {
          await replayerPage.evaluate((time: number) => (window as any).HaxReplay.goToTime(time), t);
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

  private async waitReplayerFrame(page: Page): Promise<Frame> {
    for (let attempt = 0; attempt < 30; attempt++) {
      const frame = page.frames().find((f) => f.url().includes("replayer") || f.name() === "gameframe");
      if (frame && frame.url() !== "about:blank") return frame;
      await sleep(500);
    }
    const urls = page.frames().map((f) => `${f.name()}: ${f.url()}`);
    throw new Error(`replayer frame not found. Frames: ${urls.join(" | ")}`);
  }

  private async waitFrameSelector(frame: Frame, selector: string, timeout: number): Promise<ElementHandle> {
    const el = await frame.waitForSelector(selector, { timeout });
    if (!el) throw new Error(`Selector "${selector}" not found in frame ${frame.url()}`);
    return el;
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
