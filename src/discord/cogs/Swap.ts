import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";

export const data = new SlashCommandBuilder()
  .setName("trocar")
  .setDescription("Inverte os times red e blue.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: interaction.user.avatarURL() || "" };
  for (const p of Array.from(room.players.values())) {
    if (p.team === 1) p.team = 2;
    else if (p.team === 2) p.team = 1;
  }
  room.send({ message: `🔄 Times invertidos por ${interaction.user.username}.`, color: 0xFFA500 } as any);
  await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("✅ Times invertidos.", user)] });
}
