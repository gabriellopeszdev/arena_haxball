import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room } from "haxball-extended-room";

export function ballCommands(room: Room): void {
  room.command({
    name: "puxarbola",
    aliases: ["pb", "puxarbola"],
    desc: "Puxa a bola para o centro.",
    usage: "puxarbola",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      room.send({ message: `⚽ Bola puxada para o centro por ${$.player.name}.`, color: Colors.White, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });

  room.command({
    name: "pararbola",
    aliases: ["stopball", "sb"],
    desc: "Para a bola.",
    usage: "pararbola",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      room.send({ message: `⏹️ Bola parada por ${$.player.name}.`, color: Colors.White, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });

  room.command({
    name: "tp",
    desc: "Teleporta a bola para uma posição.",
    usage: "tp <x> <y>",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length < 2) {
        $.player.reply({ message: "[PV] ⚠️ Use: tp <x> <y>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const x = parseFloat($.arguments[0].toString());
      const y = parseFloat($.arguments[1].toString());
      if (isNaN(x) || isNaN(y)) {
        $.player.reply({ message: "[PV] ⚠️ Coordenadas inválidas.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      room.send({ message: `📍 Bola teleportada para (${x}, ${y}) por ${$.player.name}.`, color: Colors.White, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
