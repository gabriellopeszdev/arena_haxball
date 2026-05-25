import { ChatSounds, ChatStyle, Colors, Event, Module, type Player, type Room } from "haxball-extended-room";
import { request } from "undici";

@Module
export class BanKickModule {
  private banTimers: Map<number, NodeJS.Timeout> = new Map();

  constructor(private room: Room) {
    setInterval(() => this.room.unbanAll(), 30 * 60 * 1000);
  }

  @Event
  onPlayerKicked(kickedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    const msg = `👢 \`${kickedPlayer.name}\` foi kickingado ${by}${reason ? ` (${reason})` : ""}`;
    this.room.send({ message: msg, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.notify(msg);
  }

  @Event
  onPlayerBanned(bannedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    const msg = `🚫 \`${bannedPlayer.name}\` foi banido ${by}${reason ? ` (${reason})` : ""}`;
    this.room.send({ message: msg, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    this.notify(msg);
  }

  private notify(msg: string): void {
    const url = process.env.ADMIN_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] ${msg}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}
