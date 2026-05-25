import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

const uniforms: Record<string, { angle: number; textColor: number; colors: number[] }> = {
  fnc1: { angle: 45, textColor: 0xFFFFFF, colors: [0xFF8C00, 0x000000] },
  fnc2: { angle: 135, textColor: 0x000000, colors: [0xFF8C00, 0xFFFFFF] },
  br1: { angle: 0, textColor: 0xFFFFFF, colors: [0x009739, 0xFFDF00, 0x002776] },
  arg: { angle: 90, textColor: 0x4A90D9, colors: [0xFFFFFF, 0x4A90D9] },
};

export function uniformCommand(room: Room): void {
  room.command({
    name: "uniforme",
    aliases: ["uni", "uniform"],
    desc: "Aplica um uniforme pré-definido.",
    usage: "uniforme <fnc1|fnc2|br1|arg> [red|blue|all]",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      const name = $.arguments[0]?.toString().toLowerCase();
      const teamStr = $.arguments[1]?.toString().toLowerCase() || "all";
      if (!name || !uniforms[name]) {
        $.player.reply({ message: `[PV] ⚠️ Uniformes: ${Object.keys(uniforms).join(", ")}`, color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      const team = teamStr === "red" ? Teams.Red : teamStr === "blue" ? Teams.Blue : "all";
      room.setTeamColors(team, uniforms[name]);
      room.send({ message: `🎨 Uniforme ${name} aplicado ${teamStr === "all" ? "em ambos times" : `no time ${teamStr}`} por ${$.player.name}.`, color: Colors.White, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
    },
  });
}
