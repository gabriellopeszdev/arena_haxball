import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

export function swapCommand(room: Room): void {
  room.command({
    name: "swap",
    aliases: ["trocar", "inverter"],
    desc: "Inverte os times red e blue.",
    usage: "swap",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      for (const p of Array.from(room.players.values())) {
        if (p.team === Teams.Red) p.team = Teams.Blue;
        else if (p.team === Teams.Blue) p.team = Teams.Red;
      }
      room.send({ message: `🔄 Times invertidos por ${$.player.name}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    },
  });
}
