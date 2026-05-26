import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { clipQueue } from "./Queue";

export function clipCommand(room: Room): void {
  room.command({
    name: "gif",
    aliases: ["clip", "gravar", "replay"],
    desc: "Gera um GIF dos últimos N segundos.",
    usage: "gif <duração> [comentário]",
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      if ($.arguments.length < 1) {
        $.player.reply({ message: "[PV] ⚠️ Use: gif <duração> [comentário]", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const duration = Number.parseInt($.arguments[0].toString());
      if (isNaN(duration) || duration < 3 || duration > 15) {
        $.player.reply({ message: "[PV] ⚠️ Duração inválida (3-15 segundos).", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const comment = $.arguments.slice(1).map((a) => a.toString()).join(" ");

      room.send({
        message: `🎥 GIF de ${duration}s solicitado por ${$.player.name}${comment ? ` (${comment})` : ""}. Processando após a partida...`,
        color: Colors.Cyan,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });

      await clipQueue.add(room.name, $.player.name, duration, comment);

      const { request } = await import("undici");
      const url = process.env.GRAVACAO_WEBHOOK;
      if (url) {
        request(url, {
          method: "POST",
          body: JSON.stringify({
            content: `[${room.name}] 🎥 GIF de ${duration}s solicitado por \`${$.player.name}\`${comment ? ` (${comment})` : ""}`,
          }),
          headers: { "Content-Type": "application/json" },
        }).catch(() => {});
      }
    },
  });
}
