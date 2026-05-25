import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("mensagemprivada")
  .setDescription("Envia PV para um jogador.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addNumberOption((o) => o.setName("player").setDescription("ID do jogador").setRequired(true))
  .addStringOption((o) => o.setName("mensagem").setDescription("Texto").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  const playerId = interaction.options.getNumber("player", true);
  const msg = interaction.options.getString("mensagem", true);
  const target = room.players[playerId];
  if (!target) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Jogador não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  target.reply({ message: `📩 [DISCORD PV]: ${msg}`, color: 0xFFB6C1 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ PV enviado para [${target.id}] ${target.name}.`, user)] });
}
