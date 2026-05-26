import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { clipsDb } from "../database/Database";
import { ClipRenderer } from "./Renderer";

type PendingClip = {
  id: number;
  room_name: string;
  player_name: string;
  duration: number;
  comment: string;
};

const DISCORD_FILE_LIMIT_BYTES = 25 * 1024 * 1024;
const DISCORD_SEND_ATTEMPTS = 3;

export class ClipQueue {
  private processing = false;

  async add(roomName: string, playerName: string, duration: number, comment: string): Promise<void> {
    clipsDb.insert(roomName, playerName, duration, comment);
  }

  async processPending(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      await this.processNext();
    } finally {
      this.processing = false;
    }
  }

  private async processNext(): Promise<void> {
    const clip = clipsDb.getNextPending();
    if (!clip) return;

    try {
      clipsDb.updateStatus(clip.id, "processing");
      const renderer = new ClipRenderer();
      const filePath = await renderer.render(clip.duration);

      await this.sendToDiscord(clip, filePath);
      fs.rmSync(filePath, { force: true });

      clipsDb.updateStatus(clip.id, "done", filePath);
      console.log(`✅ Clip #${clip.id} enviado e removido: ${filePath}`);
    } catch (err) {
      console.error(`❌ Erro ao renderizar/enviar clip #${clip.id}:`, err);
      clipsDb.updateStatus(clip.id, "failed");
    }

    await this.processNext();
  }

  private async sendToDiscord(clip: PendingClip, filePath: string): Promise<void> {
    const url = this.getWebhookUrl();
    if (!url) throw new Error("GIFS_WEBHOOK não configurado.");

    const size = fs.statSync(filePath).size;
    if (size > DISCORD_FILE_LIMIT_BYTES) {
      throw new Error(`GIF muito grande para enviar no Discord (${formatBytes(size)}).`);
    }

    const fileName = path.basename(filePath);
    const description = [
      "Um novo replay acabou de sair do forno.",
      "",
      `**Solicitado por:** \`${clip.player_name}\``,
      `**Sala:** \`${clip.room_name}\``,
      `**Duração:** \`${clip.duration}s\``,
      clip.comment ? `**Comentário:** ${clip.comment}` : "",
    ].filter(Boolean).join("\n");

    let lastError: unknown;
    for (let attempt = 1; attempt <= DISCORD_SEND_ATTEMPTS; attempt++) {
      try {
        const form = new FormData();
        form.append("payload_json", JSON.stringify({
          embeds: [{
            color: 0x00FFFF,
            title: "🎬 Arena Vincere | Clip",
            description,
            image: { url: `attachment://${fileName}` },
            footer: { text: `${new Date().getFullYear()} © ${clip.room_name} - GIF automático` },
            timestamp: new Date().toISOString(),
          }],
        }));
        form.append("files[0]", new Blob([fs.readFileSync(filePath)], { type: "image/gif" }), fileName);

        const response = await fetch(withWait(url), { method: "POST", body: form });
        if (!response.ok) {
          const body = await response.text().catch(() => "");
          throw new Error(`Discord webhook retornou ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`);
        }
        return;
      } catch (err) {
        lastError = err;
        console.warn(`⚠️ Falha ao enviar clip #${clip.id} para o Discord (tentativa ${attempt}/${DISCORD_SEND_ATTEMPTS}).`, err);
        if (attempt < DISCORD_SEND_ATTEMPTS) await sleep(attempt * 2000);
      }
    }

    throw lastError;
  }

  private getWebhookUrl(): string {
    const current = process.env.GIFS_WEBHOOK?.trim();
    if (current) return current;

    const envPath = path.resolve(__dirname, "../../.env");
    const parsed = dotenv.config({ path: envPath, override: false }).parsed;
    return parsed?.GIFS_WEBHOOK?.trim() || process.env.GIFS_WEBHOOK?.trim() || "";
  }
}

export const clipQueue = new ClipQueue();

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withWait(url: string): string {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}wait=true`;
}
