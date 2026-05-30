import fs from "node:fs";
import path from "node:path";
import { clipsDb } from "../database/Database";
import { ClipRenderer } from "./Renderer";
import { client } from "../discord/Client";
import { getBotName, getBotURL } from "../discord/EmbedFactory";
import { getWebhookUrl } from "../config/env";
import { getRoomList } from "../room/RoomManager";
import { sanitizeDiscordContent, webhookJsonPayload } from "../utils/discordWebhook";

type PendingClip = {
  id: number;
  room_name: string;
  player_name: string;
  duration: number;
  comment: string;
  requested_at: number | null;
};

const DISCORD_FILE_LIMIT_BYTES = 10 * 1024 * 1024;
const DISCORD_SEND_ATTEMPTS = 3;

export class ClipQueue {
  private processing = false;

  async add(roomName: string, playerName: string, duration: number, comment: string, requestedAt: number): Promise<void> {
    clipsDb.insert(roomName, playerName, duration, comment, requestedAt);
  }

  async processPending(replayFilePath?: string, roomName?: string): Promise<void> {
    if (this.processing) {
      setTimeout(() => void this.processPending(replayFilePath, roomName), 1000);
      return;
    }
    this.processing = true;
    let hadFailure = false;
    try {
      hadFailure = await this.processAll(replayFilePath, roomName);
    } finally {
      this.processing = false;
      if (replayFilePath && !hadFailure) {
        fs.rmSync(replayFilePath, { force: true });
      }
    }
  }

  private async processAll(replayFilePath?: string, roomName?: string): Promise<boolean> {
    let hadFailure = false;

    while (true) {
      const clip = clipsDb.getNextPending(roomName);
      if (!clip) break;

      try {
        clipsDb.updateStatus(clip.id, "processing");
        const renderer = new ClipRenderer();
        const filePath = await renderer.render(clip.duration, clip.requested_at ?? undefined, replayFilePath);

        await this.sendToDiscord(clip, filePath);
        fs.rmSync(filePath, { force: true });

        clipsDb.updateStatus(clip.id, "done", filePath);
        console.log(`✅ Clip #${clip.id} enviado e removido: ${filePath}`);
      } catch (err) {
        hadFailure = true;
        console.error(`❌ Erro ao renderizar/enviar clip #${clip.id}:`, err);
        clipsDb.updateStatus(clip.id, "failed");
      }
    }

    return hadFailure;
  }

  private async sendToDiscord(clip: PendingClip, filePath: string): Promise<void> {
    const roomNum = getRoomList().find((r) => r.name === clip.room_name)?.number;
    const url = getWebhookUrl("GIFS_WEBHOOK", roomNum);
    if (!url) throw new Error("GIFS_WEBHOOK não configurado.");

    const size = fs.statSync(filePath).size;
    if (size > DISCORD_FILE_LIMIT_BYTES) {
      throw new Error(`GIF muito grande para enviar no Discord (${formatBytes(size)}).`);
    }

    const fileName = path.basename(filePath);
    const description = [
      "Um novo replay acabou de sair do forno.",
      "",
      `🎬 **Solicitado por:** \`${clip.player_name}\``,
      `🏟️ **Sala:** \`${clip.room_name}\``,
      `⏱️ **Duração:** \`${clip.duration}s\``,
      clip.comment ? `💬 **Comentário:** ${sanitizeDiscordContent(clip.comment)}` : "",
    ].filter(Boolean).join("\n");

    let lastError: unknown;
    for (let attempt = 1; attempt <= DISCORD_SEND_ATTEMPTS; attempt++) {
      try {
        const form = new FormData();
        form.append("payload_json", JSON.stringify(webhookJsonPayload({
          embeds: [{
            color: 0x00FFFF,
            title: `🎬 ${clip.room_name.replace(/\p{Emoji}/gu, "").trim()} | CLIP`,
            description,
            image: { url: `attachment://${fileName}` },
            footer: { text: `${new Date().getFullYear()} © ${getBotName()} - Todos os direitos reservados`, icon_url: getBotURL() },
          }],
        })));
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
