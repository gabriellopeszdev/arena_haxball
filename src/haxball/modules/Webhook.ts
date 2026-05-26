import { Module, type Player, type Room, Event } from "haxball-extended-room";
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
    this.sendSystem(`:speech_balloon: **COMANDO** — \`${player.name}\` [${player.id}] (${this.teamEmoji(player)}) usou **${info.message}**`);
  }

  @Event
  onPlayerChat(player: Player, message: string): void {
    const prefix = this.room.prefix || "!";
    if (message.startsWith(prefix)) return;
    const url = process.env.MENSAGEM_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] ${this.teamEmoji(player)} [${player.id}] **${player.name}**: \`${message}\`` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }
}
