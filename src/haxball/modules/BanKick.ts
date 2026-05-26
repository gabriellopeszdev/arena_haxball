import { Event, Module, type Player, type Room } from "haxball-extended-room";
import { request } from "undici";
import { rolesDb } from "../../database/Database";

const displayRoleRank: Record<string, number> = {
  "👮‍♂️ capitão": 4,
  "💂 sub-capitão": 3,
  "⚽ jogador": 2,
  "👨‍💼 administrador": 1,
};

const dbRoleRank: Record<string, number> = {
  capitao: 4,
  "sub-capitao": 3,
  jogador: 2,
  administrador: 1,
};

@Module
export class BanKickModule {
  constructor(private room: Room) {
    setInterval(() => { try { this.room.unbanAll(); } catch {} }, 30 * 60 * 1000);
  }

  private teamEmoji(p: Player): string {
    return p.team === 1 ? "🔴" : p.team === 2 ? "🔵" : "🟢";
  }

  private roleRank(player: Player | undefined): number {
    if (!player) return 0;
    const liveRole = player.settings?.role;
    if (liveRole && displayRoleRank[liveRole]) return displayRoleRank[liveRole];

    const dbRole = rolesDb.findByAuth(player.auth ?? "") || rolesDb.findByIp(player.ip ?? "");
    return dbRole ? (dbRoleRank[dbRole.role] ?? 0) : 0;
  }

  private canPunish(actor: Player | undefined, target: Player): boolean {
    if (!actor) return true;
    const targetRank = this.roleRank(target);
    if (targetRank <= 0) return true;
    return this.roleRank(actor) > targetRank;
  }

  private punishBadActor(actor: Player | undefined): void {
    if (!actor) return;
    actor.kick("Bad actor");
  }

  @Event
  onPlayerKicked(kickedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const tag = `${this.teamEmoji(kickedPlayer)} \`[${kickedPlayer.id}]\``;
    const by = byPlayer ? `por \`[${byPlayer.id}]\` **${byPlayer.name}**` : "pelo sistema";

    if (!this.canPunish(byPlayer, kickedPlayer)) {
      this.logMessage(`:boom: **KICK** — \`${kickedPlayer.name}\` ${tag} foi kickingado ${by} sem permissão`);
      this.punishBadActor(byPlayer);
      return;
    }

    this.logMessage(`:boom: **KICK** — \`${kickedPlayer.name}\` ${tag} foi kickingado ${by}${reason ? ` (\`${reason}\`)` : ""}`);
  }

  @Event
  onPlayerBanned(bannedPlayer: Player, reason?: string, byPlayer?: Player): void {
    const tag = `${this.teamEmoji(bannedPlayer)} \`[${bannedPlayer.id}]\``;
    const by = byPlayer ? `por \`[${byPlayer.id}]\` **${byPlayer.name}**` : "pelo sistema";

    if (!this.canPunish(byPlayer, bannedPlayer)) {
      try { this.room.unban(bannedPlayer.id); } catch {}
      this.logMessage(`:no_entry: **BAN** — \`${bannedPlayer.name}\` ${tag} foi banido ${by} sem permissão`);
      this.punishBadActor(byPlayer);
      return;
    }

    this.logMessage(`:no_entry: **BAN** — \`${bannedPlayer.name}\` ${tag} foi banido ${by}${reason ? ` (\`${reason}\`)` : ""}`);
  }

  private logMessage(content: string): void {
    const url = process.env.MENSAGEM_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] [:warning: **SISTEMA**]: ${content}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}
