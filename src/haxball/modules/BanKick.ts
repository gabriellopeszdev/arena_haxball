import { ChatSounds, ChatStyle, Colors, Event, Module, type Player, type Room } from "haxball-extended-room";
import { request } from "undici";

const roleRank: Record<string, number> = {
  "👮‍♂️ capitão": 4,
  "💂 sub-capitão": 3,
  "⚽ jogador": 2,
  "👨‍💼 administrador": 1,
};

@Module
export class BanKickModule {
  constructor(private room: Room) {
    setInterval(() => { try { this.room.unbanAll(); } catch {} }, 30 * 60 * 1000);
  }

  private teamEmoji(p: Player): string {
    return p.team === 1 ? "🔴" : p.team === 2 ? "🔵" : "🟢";
  }

  private canPunish(actor: Player | undefined, target: Player): boolean {
    if (!actor) return true;
    const targetRank = roleRank[target.settings.role] ?? 0;
    if (targetRank <= 0) return true;
    const actorRank = roleRank[actor.settings.role] ?? 0;
    return actorRank > targetRank;
  }

  @Event
  onPlayerKicked(kickedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const tag = `${this.teamEmoji(kickedPlayer)} [${kickedPlayer.id}]`;
    if (!this.canPunish(byPlayer, kickedPlayer)) {
      byPlayer?.reply({
        message: "[PV] ❌ Você não tem permissão para kickar este jogador.",
        color: Colors.Red,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
      if (byPlayer) byPlayer.admin = false;
      this.notify(`KICK BLOQUEADO — \`[${byPlayer?.id}]\` **${byPlayer?.name}** tentou kickar \`${kickedPlayer.name}\` ${tag} sem permissão`);
      return;
    }

    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    this.notify(`Jogador \`${kickedPlayer.name}\` ${tag} foi kickado ${by}${reason ? ` (motivo: ${reason})` : ""}`);
  }

  @Event
  onPlayerBanned(bannedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const tag = `${this.teamEmoji(bannedPlayer)} [${bannedPlayer.id}]`;
    if (!this.canPunish(byPlayer, bannedPlayer)) {
      try { this.room.unbanAll(); } catch {}
      byPlayer?.reply({
        message: "[PV] ❌ Você não tem permissão para banir este jogador.",
        color: Colors.Red,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
      if (byPlayer) byPlayer.admin = false;
      this.notify(`BAN BLOQUEADO — \`[${byPlayer?.id}]\` **${byPlayer?.name}** tentou banir \`${bannedPlayer.name}\` ${tag} sem permissão`);
      return;
    }

    const by = byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema";
    this.notify(`Jogador \`${bannedPlayer.name}\` ${tag} foi banido ${by}${reason ? ` (motivo: ${reason})` : ""}`);
  }

  private notify(msg: string): void {
    const url = process.env.ADMIN_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] [:warning: **SISTEMA**]: ${msg}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}
