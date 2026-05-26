import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";

const afkPlayers = new Map<number, { startTime: number; wasAdmin: boolean }>();
const afkPlayerIds = new Set<number>();

export function afkCommand(room: Room): void {
  room.command({
    name: "afk",
    aliases: ["away", "ausente"],
    desc: "Alterna status AFK.",
    usage: "afk",
    roles: [],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      const player = $.player;
      if ($.arguments.length > 0) {
        player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      if (afkPlayers.has(player.id)) {
        const data = afkPlayers.get(player.id)!;
        afkPlayers.delete(player.id);
        afkPlayerIds.delete(player.id);
        if (player.team === Teams.Spectators) player.team = Teams.Red;
        player.admin = data.wasAdmin;
        room.send({ message: `💤 ${player.name} não está mais AFK.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      } else {
        afkPlayers.set(player.id, { startTime: Date.now(), wasAdmin: player.admin });
        afkPlayerIds.add(player.id);
        player.admin = false;
        if (player.team !== Teams.Spectators) player.team = Teams.Spectators;
        room.send({ message: `💤 ${player.name} agora está AFK.`, color: Colors.CadetBlue, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      }
    },
  });

  room.command({
    name: "afks",
    desc: "Lista jogadores AFK.",
    usage: "afks",
    roles: [],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if (afkPlayers.size === 0) {
        $.player.reply({ message: "[PV] ❌ Não há jogadores AFK.", color: Colors.Red, style: ChatStyle.SmallItalic, sound: ChatSounds.Notification });
        return;
      }
      const list = Array.from(afkPlayers.entries()).map(([id, data]) => {
        const p = room.players[id];
        const elapsed = Math.floor((Date.now() - data.startTime) / 1000);
        const m = Math.floor(elapsed / 60);
        const s = elapsed % 60;
        return `🆔 ID: ${id} | 👤 ${p ? p.name : "desconhecido"} | ⏳ ${m}m${s}s`;
      }).join("\n");
      $.player.reply({ message: `🔹 Jogadores AFK:\n${list}`, color: Colors.CadetBlue, style: ChatStyle.SmallItalic, sound: ChatSounds.Notification });
    },
  });
}

export { afkPlayers, afkPlayerIds };
