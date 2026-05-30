import { request } from "undici";

type JsonPayload = Record<string, unknown>;

export function sanitizeDiscordContent(value: string): string {
  return value
    .replace(/\*\*\s*@everyone\s*\*\*/gi, "`@everyone`")
    .replace(/\*\*\s*@here\s*\*\*/gi, "`@here`")
    .replace(/(?<!`)@everyone(?!`)/gi, "`@everyone`")
    .replace(/(?<!`)@here(?!`)/gi, "`@here`");
}

export function webhookJsonPayload(payload: JsonPayload): JsonPayload {
  const safePayload = { ...payload };
  if (typeof safePayload.content === "string") {
    safePayload.content = sanitizeDiscordContent(safePayload.content);
  }
  return {
    ...safePayload,
    allowed_mentions: { parse: [] },
  };
}

export function sendWebhookJson(url: string, payload: JsonPayload): void {
  request(url, {
    method: "POST",
    body: JSON.stringify(webhookJsonPayload(payload)),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});
}
