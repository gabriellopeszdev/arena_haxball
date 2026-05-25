import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, type SlashCommandNumberOption, type SlashCommandBooleanOption } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import type { Player } from "haxball-extended-room";

export const data = new SlashCommandBuilder()
  .setName("admin")
  .setDescription("Altera admin de um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addNumberOption((o: SlashCommandNumberOption) => o.setName("player").setDescription("ID do jogador").setRequired(true))
  .addBooleanOption((o: SlashCommandBooleanOption) => o.setName("status").setDescription("Admin true/false").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  const playerId = interaction.options.getNumber("player", true);
  const status = interaction.options.getBoolean("status", true);
  const player: Player | undefined = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  if (player.admin === status) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ ${player.name} já ${status ? "é admin" : "é player"}.`, user)], flags: MessageFlags.Ephemeral }); return; }
  if (["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 administrador"].includes(player.settings.role)) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ ${player.name} é ${player.settings.role}.`, user)], flags: MessageFlags.Ephemeral }); return; }
  player.admin = status;
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Admin de [${player.id}] ${player.name} alterado para ${status}.`, user)] });
}
