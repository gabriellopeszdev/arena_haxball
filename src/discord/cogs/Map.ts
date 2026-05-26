import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import FutsalX3 from "../../../maps/Futsal X3 by Bazinga.json";
import FutsalX4 from "../../../maps/Futsal X4 by Bazinga.json";
import LVK from "../../../maps/LVK.json";
import RealSoccerRevolution from "../../../maps/Real Soccer Revolution.json";
import Penaltis from "../../../maps/Penaltis.json";

const stadiums: Record<string, object | string> = {
  "Futsal X3": FutsalX3,
  "Futsal X4": FutsalX4,
  "LVK": LVK,
  "Real Soccer Revolution": RealSoccerRevolution,
  "Penaltis": Penaltis,
};

export const data = new SlashCommandBuilder()
  .setName("mapa")
  .setDescription("Altera o mapa da sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addStringOption((o) => o.setName("mapa").setDescription("Nome do mapa").setRequired(true).addChoices(
    { name: "Futsal X3", value: "Futsal X3" },
    { name: "Futsal X4", value: "Futsal X4" },
    { name: "LVK", value: "LVK" },
    { name: "Real Soccer Revolution", value: "Real Soccer Revolution" },
    { name: "Penaltis", value: "Penaltis" },
  ));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const mapName = interaction.options.getString("mapa", true);
  if (room.isGameInProgress()) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Partida em andamento.", user)], flags: MessageFlags.Ephemeral }); return; }
  const stadium = stadiums[mapName];
  if (!stadium) { await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed("❌ Mapa não encontrado.", user)], flags: MessageFlags.Ephemeral }); return; }
  room.setStadium(stadium as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`🗺️ Mapa alterado para ${mapName}.`, user)] });
}
