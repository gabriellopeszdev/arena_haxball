import puppeteer from "puppeteer";
import type { Page, Frame, ElementHandle } from "puppeteer";
import path from "node:path";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-web-security",
  "--allow-running-insecure-content",
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
];
const GIF_FPS = 12;
const GIF_WIDTH = 640;

export class ClipRenderer {
  async render(duration: number, endTime?: number, replayFile?: string): Promise<string> {
    const clipsDir = path.resolve(__dirname, "../../clips");
    if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

    const hbr2File = replayFile ?? this.findHbr2(clipsDir);
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

      const replayerPage = await this.waitLoadedReplayFrame(page);
      await this.closeSettingsIfOpen(replayerPage);
      await this.pauseReplay(replayerPage);
      await this.setViewMode(replayerPage, "2");

      const totalDuration = await this.getTotalDuration(replayerPage);
      const clipEnd = Math.max(0, Math.min(endTime ?? totalDuration, totalDuration));
      const captureDuration = Math.min(duration, clipEnd);
      const seekTime = Math.max(0, clipEnd - captureDuration);

      await this.seekReplay(replayerPage, seekTime, totalDuration);

      const fps = GIF_FPS;
      const totalFrames = Math.max(1, Math.round(captureDuration * fps));
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
        if (t <= clipEnd) await this.seekReplay(replayerPage, t, totalDuration);
      }

      this.buildGif(framesDir, fps, outputPath);

      console.log(`GIF: ${outputPath}`);
      return outputPath;
    } finally {
      fs.rmSync(framesDir, { recursive: true, force: true });
      await browser.close();
    }
  }

  private async waitReplayerFrame(page: Page): Promise<Frame> {
    for (let attempt = 0; attempt < 30; attempt++) {
      const frame = page.frames().find((f) => f.url().includes("/replayer/3/") || f.name() === "gameframe");
      if (frame && frame.url() !== "about:blank") return frame;
      await sleep(500);
    }
    const urls = page.frames().map((f) => `${f.name()}: ${f.url()}`);
    throw new Error(`replayer frame not found. Frames: ${urls.join(" | ")}`);
  }

  private async waitLoadedReplayFrame(page: Page): Promise<Frame> {
    const frame = await this.waitReplayerFrame(page);
    await frame.waitForSelector("canvas", { timeout: 20000 });
    await frame.waitForSelector('[data-hook="timebar"]', { timeout: 20000 });
    await frame.waitForSelector('[data-hook="time"]', { timeout: 20000 });
    await sleep(500);
    return frame;
  }

  private async waitFrameSelector(frame: Frame, selector: string, timeout: number): Promise<ElementHandle> {
    const el = await frame.waitForSelector(selector, { timeout });
    if (!el) throw new Error(`Selector "${selector}" not found in frame ${frame.url()}`);
    return el;
  }

  private async closeSettingsIfOpen(frame: Frame): Promise<void> {
    await frame.evaluate(() => {
      const close = document.querySelector('.settings-view [data-hook="close"]') as HTMLButtonElement | null;
      close?.click();
    });
  }

  private async pauseReplay(frame: Frame): Promise<void> {
    await frame.evaluate(() => {
      const playIcon = document.querySelector('[data-hook="playicon"]');
      const playButton = document.querySelector('[data-hook="play"]') as HTMLButtonElement | null;
      if (playIcon?.classList.contains("icon-pause")) playButton?.click();
    });
    await sleep(150);
  }

  private async setViewMode(frame: Frame, key: "1" | "2" | "3" | "4"): Promise<void> {
    await frame.evaluate((viewKey) => {
      const target = document.querySelector(".game-view") as HTMLElement | null;
      target?.focus();
      window.dispatchEvent(new KeyboardEvent("keydown", { key: viewKey, code: `Digit${viewKey}`, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: viewKey, code: `Digit${viewKey}`, bubbles: true }));
    }, key);
    await sleep(150);
  }

  private async getTotalDuration(frame: Frame): Promise<number> {
    await this.seekReplay(frame, Number.POSITIVE_INFINITY, 1);
    await sleep(250);
    const duration = await frame.evaluate(() => {
      return (document.querySelector('[data-hook="time"]')?.textContent || "").trim();
    });
    const seconds = parseClock(duration);
    if (seconds <= 0) throw new Error(`Could not read replay duration from "${duration}"`);
    return seconds;
  }

  private async seekReplay(frame: Frame, timeSeconds: number, totalSeconds: number): Promise<void> {
    const percent = Number.isFinite(timeSeconds) && totalSeconds > 0
      ? Math.max(0, Math.min(0.999, timeSeconds / totalSeconds))
      : 0.999;

    await frame.evaluate((p) => {
      const timebar = document.querySelector('[data-hook="timebar"]') as HTMLElement | null;
      if (!timebar) throw new Error("Replay timebar not found");

      const rect = timebar.getBoundingClientRect();
      const x = rect.left + rect.width * p;
      const y = rect.top + rect.height / 2;
      const options = { bubbles: true, cancelable: true, clientX: x, clientY: y };

      timebar.dispatchEvent(new MouseEvent("mousedown", options));
      timebar.dispatchEvent(new MouseEvent("mouseup", options));
      timebar.dispatchEvent(new MouseEvent("click", options));
    }, percent);
    await sleep(35);
  }

  private findHbr2(dir: string): string {
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".hbr2")).sort();
    if (files.length === 0) throw new Error("Nenhum .hbr2 encontrado em clips/");
    return path.join(dir, files[files.length - 1]);
  }

  private buildGif(framesDir: string, fps: number, outputPath: string): void {
    const inputPattern = path.join(framesDir, "frame-%05d.png");
    const palettePath = path.join(framesDir, "palette.png");

    execFileSync("ffmpeg", [
      "-y",
      "-framerate", String(fps),
      "-i", inputPattern,
      "-vf", `fps=${fps},scale=${GIF_WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff`,
      palettePath,
    ], { timeout: 120000, stdio: "pipe" });
    execFileSync("ffmpeg", [
      "-y",
      "-framerate", String(fps),
      "-i", inputPattern,
      "-i", palettePath,
      "-lavfi", `fps=${fps},scale=${GIF_WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer`,
      outputPath,
    ], { timeout: 120000, stdio: "pipe" });
  }
}

function parseClock(value: string): number {
  const parts = value.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
