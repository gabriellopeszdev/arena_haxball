import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";
import { clipQueue } from "./Queue";

export function clipCommand(room: Room): void {
  room.command({
    name: "gif",
    aliases: ["clip", "gravar", "replay"],
    desc: "Gera um GIF dos últimos N segundos.",
    usage: "gif [duração] [comentário]",
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      const args = $.arguments.map((a) => a.toString());
      const firstArg = args[0]?.toLowerCase();
      const rawDuration = firstArg?.endsWith("s") ? firstArg.slice(0, -1) : firstArg;
      const hasDurationArg = rawDuration ? /^\d+$/.test(rawDuration) : false;
      const duration = hasDurationArg ? Number.parseInt(rawDuration, 10) : 15;

      if (duration < 3 || duration > 15) {
        $.player.reply({ message: "[PV] ⚠️ Duração inválida (3-15 segundos).", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      if (!room.isGameInProgress()) {
        $.player.reply({ message: "[PV] ❌ Não há partida em andamento para gerar GIF.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }

      const comment = args.slice(hasDurationArg ? 1 : 0).join(" ");

      room.send({
        message: `🎥 GIF de ${duration}s solicitado por ${$.player.name}${comment ? ` (${comment})` : ""}. Processando após a partida...`,
        color: Colors.Cyan,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });

      await clipQueue.add(room.name, $.player.name, duration, comment);
    },
  });
}
