import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("mensagemtime")
  .setDescription("Envia mensagem para um time específico.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addStringOption((o) => o.setName("time").setDescription("Time alvo").setRequired(true).addChoices({ name: "Red", value: "red" }, { name: "Blue", value: "blue" }, { name: "Spectators", value: "spec" }))
  .addStringOption((o) => o.setName("mensagem").setDescription("Texto").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  const teamStr = interaction.options.getString("time", true);
  const msg = interaction.options.getString("mensagem", true);
  const team = teamStr === "red" ? 1 : teamStr === "blue" ? 2 : 0;
  const icon = teamStr === "red" ? "🔴" : teamStr === "blue" ? "🔵" : "🟢";
  let sent = 0;
  for (const p of Array.from(room.players.values())) {
    if (p.team === team) { p.reply({ message: `[${icon} DISCORD]: ${msg}`, color: 0xFFFFFF } as any); sent++; }
  }
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Mensagem enviada para ${sent} jogadores do time ${icon}.`, user)] });
}
