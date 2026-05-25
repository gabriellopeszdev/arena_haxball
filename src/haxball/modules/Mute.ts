import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Event, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";
import { mutesDb } from "../../database/Database";

const muteHierarchy: Record<string, number> = {
  "👨‍💼 administrador": 0,
  "⚽ jogador": 1,
  "💂 sub-capitão": 2,
  "👮‍♂️ capitão": 3,
};

function canMute(actor: Player, target: Player): boolean {
  const actorRole = actor.settings.role;
  const targetRole = target.settings.role;
  if (!targetRole) return true;
  if (!actorRole) return false;
  return (muteHierarchy[actorRole] ?? -1) > (muteHierarchy[targetRole] ?? -1);
}

@Module
export class MuteModule {
  private checkInterval: NodeJS.Timeout;

  constructor(private room: Room) {
    this.checkInterval = setInterval(() => {
      mutesDb.cleanExpired();
    }, 30000);
  }

  @ModuleCommand({
    aliases: ["silenciar", "mutar"],
    desc: "Muta um jogador por tempo determinado.",
    usage: "mute <id> <minutos> [motivo]",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 administrador"],
    deleteMessage: true,
  })
  public mute(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    if (execInfo.arguments.length < 2) {
      player.reply({ message: "[PV] ⚠️ Use: mute <id> <minutos> [motivo]", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    const targetId = Number.parseInt(execInfo.arguments[0].toString().replace("#", ""), 10);
    const minutes = Number.parseInt(execInfo.arguments[1].toString());
    if (isNaN(targetId) || isNaN(minutes) || minutes <= 0) {
      player.reply({ message: "[PV] ⚠️ ID ou tempo inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    const reason = execInfo.arguments.slice(2).map((a) => a.toString()).join(" ");
    const target = this.room.players[targetId];
    if (!target) {
      player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    if (!canMute(player, target)) {
      player.reply({ message: "[PV] ❌ Você não pode mutar este jogador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    const expiresAt = Math.floor(Date.now() / 1000) + minutes * 60;
    mutesDb.insert(target.ip ?? "", target.auth ?? "", target.name ?? "", player.name ?? "", expiresAt, reason);
    this.room.send({
      message: `🔇 ${target.name} foi mutado por ${minutes} minuto(s) por ${player.name}${reason ? ` (${reason})` : ""}.`,
      color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification,
    });
  }

  @ModuleCommand({
    aliases: ["desmutar", "unmute", "dessilenciar"],
    desc: "Remove o mute de um jogador.",
    usage: "unmute <id>",
    roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 administrador"],
    deleteMessage: true,
  })
  public unmute(execInfo: CommandExecInfo): void {
    const player = execInfo.player;
    if (execInfo.arguments.length < 1) {
      player.reply({ message: "[PV] ⚠️ Use: unmute <id>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    const targetId = Number.parseInt(execInfo.arguments[0].toString().replace("#", ""), 10);
    const target = this.room.players[targetId];
    if (!target) {
      player.reply({ message: "[PV] ⚠️ Jogador não encontrado.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    if (!canMute(player, target)) {
      player.reply({ message: "[PV] ❌ Você não pode desmutar este jogador.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    mutesDb.remove(target.auth ?? "", target.ip ?? "");
    this.room.send({
      message: `🔊 ${target.name} foi desmutado por ${player.name}.`,
      color: Colors.LightGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification,
    });
  }

  @Event
  onPlayerChat(player: Player, _message: string): boolean | undefined {
    if (player.admin || player.settings.role) return;
    const activeMute = mutesDb.findActive(player.auth ?? "", player.ip ?? "");
    if (activeMute) {
      const remaining = Math.max(0, activeMute.expires_at - Math.floor(Date.now() / 1000));
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      player.reply({
        message: `🔇 Você está mutado ${activeMute.reason ? `(${activeMute.reason})` : ""} por mais ${mins}m${secs}s.`,
        color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification,
      });
      return false;
    }
  }
}
