import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, type Room, Teams } from "haxball-extended-room";
import { request } from "undici";
import { getWebhookUrl } from "../../config/env";

export function campCommands(room: Room): void {
  room.command({
    name: "camp",
    aliases: ["campeonato", "ofi"],
    desc: "Ativa/desativa modo campeonato.",
    usage: "camp",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"],
    deleteMessage: true,
    func: ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      room.state.campMode = !room.state.campMode;
      if (room.state.campMode) {
        room.send({ message: `✅ Modo campeonato ativado por ${$.player.name}. Use !firmo para confirmar.`, color: Colors.LightGreen, style: ChatStyle.SmallItalic, sound: ChatSounds.Notification });
        for (const p of Array.from(room.players.values())) { p.team = Teams.Spectators; room.state[p.id] = { confirmed: false }; }
        room.lockTeams();
      } else {
        room.send({ message: `✅ Modo campeonato desativado por ${$.player.name}.`, color: Colors.IndianRed, style: ChatStyle.SmallItalic, sound: ChatSounds.Notification });
        for (const p of Array.from(room.players.values())) { if (room.state[p.id]) room.state[p.id].confirmed = false; }
      }
    },
  });

  room.command({
    name: "firmo",
    aliases: ["confirmar", "confirmo"],
    desc: "Confirma participação no campeonato.",
    usage: "firmo",
    roles: [],
    deleteMessage: true,
    func: async ($: CommandExecInfo) => {
      if ($.arguments.length > 0) {
        $.player.reply({ message: `[PV] ❌ Use apenas ${$.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
        return;
      }
      if (!room.state.campMode) {
        $.player.reply({ message: "[PV] ❌ Modo campeonato não está ativo.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      if (room.state[$.player.id]?.confirmed) {
        $.player.reply({ message: "[PV] ❌ Você já confirmou.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return;
      }
      room.state[$.player.id] = room.state[$.player.id] || {};
      room.state[$.player.id].confirmed = true;
      room.send({ message: `✅ ${$.player.name} confirmou.`, color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      const url = getWebhookUrl("CONFIRMACAO_WEBHOOK", (room.state as any).roomNumber);
      if (url) {
        request(url, { method: "POST", body: JSON.stringify({ content: `[${room.name}] ${$.player.name} confirmou.` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
      }
    },
  });

  room.onPlayerTeamChange = (changedPlayer, byPlayer) => {
    if (room.state.campMode && byPlayer && (!room.state[changedPlayer.id] || !room.state[changedPlayer.id].confirmed)) {
      changedPlayer.team = Teams.Spectators;
      room.send({ message: `❌ ${changedPlayer.name} precisa usar !firmo primeiro.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    }
  };
}
