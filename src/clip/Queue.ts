import { clipsDb } from "../database/Database";
import { ClipRenderer } from "./Renderer";

export class ClipQueue {
  private processing = false;

  async add(roomName: string, playerName: string, duration: number, comment: string): Promise<void> {
    clipsDb.insert(roomName, playerName, duration, comment);
    if (!this.processing) await this.processNext();
  }

  private async processNext(): Promise<void> {
    this.processing = true;
    const clip = clipsDb.getNextPending();
    if (!clip) {
      this.processing = false;
      return;
    }

    try {
      clipsDb.updateStatus(clip.id, "processing");
      const renderer = new ClipRenderer();
      const filePath = await renderer.render(clip.duration);
      clipsDb.updateStatus(clip.id, "done", filePath);
      console.log(`✅ Clip #${clip.id} renderizado: ${filePath}`);
    } catch (err) {
      console.error(`❌ Erro ao renderizar clip #${clip.id}:`, err);
      clipsDb.updateStatus(clip.id, "failed");
    }

    await this.processNext();
  }
}

export const clipQueue = new ClipQueue();
