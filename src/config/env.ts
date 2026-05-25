import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export function getEnv(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Variável de ambiente ${key} não configurada!`);
  }
  return value ?? "";
}

export function getRoomConfig(roomNumber: number): {
  token: string;
  name: string;
  proxy?: string;
} {
  const token = getEnv(`ROOM${roomNumber}_TOKEN`);
  const name = getEnv(`ROOM${roomNumber}_NAME`, false) || `Arena Vincere ${roomNumber}`;
  const proxy = getEnv(`ROOM${roomNumber}_PROXY`, false) || undefined;
  return { token, name, proxy };
}

export function getActiveRoomCount(): number {
  let count = 0;
  for (let i = 1; i <= 10; i++) {
    if (process.env[`ROOM${i}_TOKEN`]) count++;
  }
  return count;
}

export const BOT_TOKEN = () => getEnv("TOKEN_BOT");
export const CLIENT_ID = () => getEnv("CLIENT_ID");
export const GUILD_ID = () => getEnv("GUILD_ID");
export const TEAM_NAME = () => getEnv("TEAM_NAME");
export const SENHA_PADRAO = () => getEnv("SENHA_PADRAO");
