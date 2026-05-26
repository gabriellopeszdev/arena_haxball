import { ChatSounds, ChatStyle, Colors, Event, Module, type Player, type Room } from "haxball-extended-room";

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

  private canPunish(actor: Player | undefined, target: Player): boolean {
    if (!actor) return true;
    const targetRank = roleRank[target.settings?.role] ?? 0;
    if (targetRank <= 0) return true;
    const actorRank = roleRank[actor.settings?.role] ?? 0;
    return actorRank > targetRank;
  }

  private punishBadActor(actor: Player | undefined): void {
    if (!actor) return;
    actor.reply({
      message: "[PV] ❌ Você não tem permissão para punir este jogador.",
      color: Colors.Red,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });
    actor.kick("Bad actor");
  }

  @Event
  onPlayerKicked(kickedPlayer: Player, _reason?: string, byPlayer?: Player): void {
    if (!this.canPunish(byPlayer, kickedPlayer)) this.punishBadActor(byPlayer);
  }

  @Event
  onPlayerBanned(bannedPlayer: Player, _reason?: string, byPlayer?: Player): void {
    if (this.canPunish(byPlayer, bannedPlayer)) return;
    try { this.room.unban(bannedPlayer.id); } catch {}
    this.punishBadActor(byPlayer);
  }
}
