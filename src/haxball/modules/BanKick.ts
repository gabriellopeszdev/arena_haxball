import { ChatSounds, ChatStyle, Colors, Event, Module, type Player, type Room } from "haxball-extended-room";
import { request } from "undici";

@Module
export class BanKickModule {
  private banTimers: Map<number, NodeJS.Timeout> = new Map();

  constructor(private room: Room) {
    setInterval(() => this.room.unbanAll(), 30 * 60 * 1000);
  }

  private teamEmoji(p: Player): string {
    return p.team === 1 ? "🔴" : p.team === 2 ? "🔵" : "🟢";
  }

  @Event
  onPlayerKicked(kickedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    const tag = `${this.teamEmoji(kickedPlayer)} [${kickedPlayer.id}]`;
    const msg = `👢 \`${kickedPlayer.name}\` ${tag} foi kickingado ${by}${reason ? ` (${reason})` : ""}`;
    this.room.send({ message: msg, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.notify(`Jogador \`${kickedPlayer.name}\` ${tag} foi kickado ${by}${reason ? ` (motivo: ${reason})` : ""}`);
  }

  @Event
  onPlayerBanned(bannedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    const tag = `${this.teamEmoji(bannedPlayer)} [${bannedPlayer.id}]`;
    const msg = `🚫 \`${bannedPlayer.name}\` ${tag} foi banido ${by}${reason ? ` (${reason})` : ""}`;
    this.room.send({ message: msg, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.notify(`Jogador \`${bannedPlayer.name}\` ${tag} foi banido ${by}${reason ? ` (motivo: ${reason})` : ""}`);
  }

  private notify(msg: string): void {
    const url = process.env.ADMIN_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] [:warning: **SISTEMA**]: ${msg}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}
