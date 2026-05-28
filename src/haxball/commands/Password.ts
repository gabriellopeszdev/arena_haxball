import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { request } from "undici";
import { getWebhookUrl } from "../../config/env";

export function passwordCommand(room: Room): void {
  room.command({
    name: "fechar",
    aliases: ["senha", "lock", "trancar"],
    desc: "Fecha a sala com senha.",
    usage: "fechar <senha>",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      const senha = $.arguments[0]?.toString() || process.env.SENHA_PADRAO || "fncpass";
      room.setPassword(senha);
      room.send({ message: `🔒 Sala fechada com senha por ${$.player.name}.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      const url = getWebhookUrl("SENHA_WEBHOOK", (room.state as any).roomNumber);
      if (url) request(url, { method: "POST", body: JSON.stringify({ content: `[${room.name}] Sala fechada por \`${$.player.name}\`. Senha: ${senha}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
    },
  });

  room.command({
    name: "abrir",
    aliases: ["unlock", "destrancar"],
    desc: "Abre a sala (remove senha).",
    usage: "abrir",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      room.clearPassword();
      room.send({ message: `🔓 Sala aberta por ${$.player.name}.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      const url = getWebhookUrl("SENHA_WEBHOOK", (room.state as any).roomNumber);
      if (url) request(url, { method: "POST", body: JSON.stringify({ content: `[${room.name}] Sala aberta por \`${$.player.name}\`.` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
    },
  });
}
