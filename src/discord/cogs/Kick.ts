import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("kickar")
  .setDescription("Kicka um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("ID do jogador").setRequired(true))
  .addStringOption((o) => o.setName("motivo").setDescription("Motivo").setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const playerId = interaction.options.getNumber("player", true);
  const reason = interaction.options.getString("motivo") || "Kickado pelo Discord";
  const player = room.players[playerId];
  if (!player) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  player.kick(reason);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`👢 \`[${player.id}] **${player.name}**\` foi kickingado${reason ? ` (\`${reason}\`)` : ""}.`, user)] });
}
