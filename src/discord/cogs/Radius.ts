import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("radius")
  .setDescription("Altera o tamanho de um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("ID do jogador").setRequired(true))
  .addNumberOption((o) => o.setName("tamanho").setDescription("Novo raio (5-50)").setRequired(true).setMinValue(5).setMaxValue(50));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  const playerId = interaction.options.getNumber("player", true);
  const size = interaction.options.getNumber("tamanho", true);
  const target = room.players[playerId];
  if (!target) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  target.radius = size;
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`📏 Raio de [${target.id}] ${target.name} alterado para ${size}.`, user)] });
}
