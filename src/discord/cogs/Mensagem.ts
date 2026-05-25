import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("mensagem")
  .setDescription("Envia mensagem para a sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addStringOption((o) => o.setName("mensagem").setDescription("Texto da mensagem").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  const msg = interaction.options.getString("mensagem", true);
  room.send({ message: `📢 [DISCORD] ${msg}`, color: 0xFFFFFF } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Mensagem enviada: ${msg}`, user)] });
}
