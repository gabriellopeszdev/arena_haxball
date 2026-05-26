import { Event, Module, type Player, type Room } from "haxball-extended-room";
import type { Command, CommandExecInfo } from "haxball-extended-room";
import { request } from "undici";

@Module
export class WebhookModule {
  constructor(private room: Room) {}

  private teamEmoji(p: Player): string {
    return p.team === 1 ? "🔴" : p.team === 2 ? "🔵" : "🟢";
  }

  private sendSystem(content: string): void {
    const url = process.env.MENSAGEM_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] [:warning: **SISTEMA**]: ${content}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }

  @Event
  onGameStart(byPlayer?: Player): void {
    this.sendSystem(`:arrow_forward: **INÍCIO** — Partida iniciada ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }

  @Event
  onGameStop(byPlayer?: Player): void {
    this.sendSystem(`:stop_button: **FIM** — Partida finalizada ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }

  @Event
  onStadiumChange(newStadium: string, byPlayer?: Player): void {
    this.sendSystem(`:stadium: **MAPA** — ${newStadium} ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }

  @Event
  onPlayerRunCommand(player: Player, _command: Command, info: CommandExecInfo): void {
    this.sendSystem(`:speech_balloon: **COMANDO** — ${this.teamEmoji(player)} [${player.id}] **${player.name}** usou \`${this.maskCommand(info.message)}\``);
  }

  @Event
  onPlayerChat(player: Player, message: string): void {
    const prefix = this.room.prefix || "!";
    if (message.startsWith(prefix)) return;
    this.sendMsg(`${this.teamEmoji(player)} [${player.id}] **${player.name}**: \`${message}\``);
  }

  @Event
  onPlayerJoin(player: Player): void {
    this.sendSystem(`:inbox_tray: **ENTRADA** — \`[${player.id}]\` **${player.name}** entrou na sala.`);
  }

  @Event
  onPlayerLeave(player: Player): void {
    this.sendSystem(`:outbox_tray: **SAÍDA** — \`[${player.id}]\` **${player.name}** saiu da sala.`);
  }

  @Event
  onPlayerTeamChange(changedPlayer: Player, byPlayer?: Player): void {
    const teamNames: Record<number, string> = { 0: "🟢 Spectators", 1: "🔴 Red", 2: "🔵 Blue" };
    const team = teamNames[changedPlayer.team] || `Time ${changedPlayer.team}`;
    const by = byPlayer ? ` por \`[${byPlayer.id}]\` **${byPlayer.name}**` : "";
    this.sendSystem(`:arrows_counterclockwise: **TIME** — \`[${changedPlayer.id}]\` **${changedPlayer.name}** movido para ${team}${by}`);
  }

  @Event
  onPlayerAdminChange(changedPlayer: Player, byPlayer?: Player): void {
    if (changedPlayer.settings?.role) return;
    const status = changedPlayer.admin ? "recebeu admin" : "perdeu admin";
    const by = byPlayer ? ` por \`[${byPlayer.id}]\` **${byPlayer.name}**` : "";
    this.sendSystem(`:crown: **ADMIN** — \`[${changedPlayer.id}]\` **${changedPlayer.name}** ${status}${by}`);
  }

  @Event
  onGamePause(byPlayer?: Player): void {
    this.sendSystem(`:pause_button: **PAUSA** — Partida pausada${byPlayer ? ` por \`[${byPlayer.id}]\` **${byPlayer.name}**` : ""}`);
  }

  @Event
  onGameUnpause(byPlayer?: Player): void {
    this.sendSystem(`:arrow_forward: **DESPAUSAR** — Partida despausada${byPlayer ? ` por \`[${byPlayer.id}]\` **${byPlayer.name}**` : ""}`);
  }

  @Event
  onPlayerKicked(_kickedPlayer: Player, _reason?: string, _byPlayer?: Player): void {}

  @Event
  onPlayerBanned(_bannedPlayer: Player, _reason?: string, _byPlayer?: Player): void {}

  private sendMsg(content: string): void {
    const url = process.env.MENSAGEM_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] ${content}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }

  private maskCommand(message: string): string {
    const [command] = message.trim().split(/\s+/);
    if (command?.toLowerCase() === `${this.room.prefix || "!"}cargo`) return `${command} [senha ocultada]`;
    return message;
  }
}
