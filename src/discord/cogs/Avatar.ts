import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { sanitizeAvatar } from "../../utils/helpers";

export const data = new SlashCommandBuilder()
  .setName("avatar")
  .setDescription("Define o avatar de um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("ID do jogador").setRequired(true))
  .addStringOption((o) => o.setName("avatar").setDescription("Novo avatar (max 2 letras ou 1 emoji)").setRequired(true).setMaxLength(8));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  const playerId = interaction.options.getNumber("player", true);
  const input = interaction.options.getString("avatar", true);
  const player = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ Jogador #${playerId} não encontrado.`, user)], flags: MessageFlags.Ephemeral }); return; }
  if (input.toLowerCase() === "clear") { player.clearAvatar(); await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Avatar de [${player.id}] ${player.name} limpo.`, user)] }); return; }
  const sanitized = sanitizeAvatar(input);
  if (!sanitized) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Avatar inválido.", user)], flags: MessageFlags.Ephemeral }); return; }
  player.setAvatar(sanitized);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Avatar de [${player.id}] ${player.name} definido como ${sanitized}.`, user)] });
}
