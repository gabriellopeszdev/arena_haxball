import dotenv from "dotenv";
import path from "node:path";
import readline from "node:readline";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let promptedToken: string | null = null;

function promptForToken(roomNumber: number): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`🎫 Token da Sala ${roomNumber} (cole aqui): `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function getOrPromptToken(roomNumber: number): Promise<string> {
  const envToken = process.env[`ROOM${roomNumber}_TOKEN`];
  if (envToken) return envToken;
  if (promptedToken) return promptedToken;
  promptedToken = await promptForToken(roomNumber);
  return promptedToken;
}

export function getEnv(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Variável de ambiente ${key} não configurada!`);
  }
  return value ?? "";
}

export async function getRoomConfig(roomNumber: number): Promise<{
  token: string;
  name: string;
  proxy?: string;
}> {
  const token = await getOrPromptToken(roomNumber);
  const name = getEnv(`ROOM${roomNumber}_NAME`, false) || `Arena ${roomNumber}`;
  const proxy = getEnv(`ROOM${roomNumber}_PROXY`, false) || undefined;
  return { token, name, proxy };
}

export function getActiveRoomCount(): number {
  let count = 0;
  for (let i = 1; i <= 10; i++) {
    if (process.env[`ROOM${i}_TOKEN`]) count++;
  }
  return count || 1;
}

export const BOT_TOKEN = () => getEnv("TOKEN_BOT");
export const CLIENT_ID = () => getEnv("CLIENT_ID");
export const GUILD_ID = () => getEnv("GUILD_ID");
export const TEAM_NAME = () => getEnv("TEAM_NAME");
export const SENHA_PADRAO = () => getEnv("SENHA_PADRAO");
