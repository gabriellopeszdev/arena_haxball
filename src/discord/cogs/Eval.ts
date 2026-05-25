import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("eval")
  .setDescription("Executa código na sala (owner only).")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addStringOption((o) => o.setName("código").setDescription("Código JS").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: MessageFlags.Ephemeral }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  try {
    const code = interaction.options.getString("código", true);
    const result = eval(code);
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`✅ Resultado: ${JSON.stringify(result)}`, user)] });
  } catch (err: any) {
    await interaction.reply({ embeds: [EmbedFactory.createErrorEmbed(`❌ Erro: ${err.message}`, user)], flags: MessageFlags.Ephemeral });
  }
}
