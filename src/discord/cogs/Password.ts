import { EmbedFactory } from "../EmbedFactory";
import { type ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getRoom } from "../../room/RoomManager";
import { request } from "undici";

export const data = new SlashCommandBuilder()
  .setName("senha")
  .setDescription("Gerencia senha da sala.")
  .addStringOption((o) => o.setName("sala").setDescription("Nome da sala").setRequired(true))
  .addStringOption((o) => o.setName("ação").setDescription("Abrir ou fechar").setRequired(true).addChoices({ name: "Fechar", value: "fechar" }, { name: "Abrir", value: "abrir" }))
  .addStringOption((o) => o.setName("senha").setDescription("Senha (se fechar)").setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const sala = interaction.options.getString("sala", true);
  const room = getRoom(sala);
  if (!room) { await interaction.reply({ content: "❌ Sala não encontrada.", flags: undefined }); return; }
  const user = { name: interaction.user.username, avatarURL: (interaction.member as any)?.displayAvatarURL?.() || interaction.user.displayAvatarURL() };
  const acao = interaction.options.getString("ação", true);
  if (acao === "fechar") {
    const senha = interaction.options.getString("senha") || process.env.SENHA_PADRAO || "fncpass";
    room.setPassword(senha);
    room.send({ message: `🔒 Sala fechada por ${interaction.user.username}.`, color: 0xFF0000 } as any);
    const url = process.env.SENHA_WEBHOOK;
    if (url) request(url, { method: "POST", body: JSON.stringify({ content: `[${room.name}] Sala fechada por \`${interaction.user.username}\`. Senha: ${senha}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed(`🔒 Sala fechada. Senha: \`${senha}\``, user)] });
  } else {
    room.clearPassword();
    room.send({ message: `🔓 Sala aberta por ${interaction.user.username}.`, color: 0x90EE90 } as any);
    await interaction.reply({ embeds: [EmbedFactory.createSuccessEmbed("🔓 Sala aberta.", user)] });
  }
}
