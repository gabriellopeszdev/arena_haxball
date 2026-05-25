import { REST, Routes } from "discord.js";
import type { SlashCommandBuilder } from "discord.js";

export async function registerSlashCommands(
  discordToken: string,
  clientId: string,
  guildId: string,
  commands: { data: SlashCommandBuilder; execute: Function }[],
): Promise<void> {
  const rest = new REST({ version: "10" }).setToken(discordToken);
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands.map((cmd) => cmd.data.toJSON()),
    });
    const registered = (await rest.get(Routes.applicationGuildCommands(clientId, guildId))) as { name: string }[];
    console.log("📋 Comandos registrados:");
    registered.forEach((c, i) => console.log(`${i + 1}: ${c.name}`));
  } catch (error) {
    console.error("❌ Erro ao registrar comandos:", error);
  }
}
