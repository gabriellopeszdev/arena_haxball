import { Module, type Player, type Room, Event } from "haxball-extended-room";
import { request } from "undici";

@Module
export class WebhookModule {
  constructor(private room: Room) {}

  private sendSystem(content: string): void {
    const url = process.env.MENSAGEM_WEBHOOK;
    if (!url) return;
    request(url, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] [:warning: **SISTEMA**]: ${content}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});
  }

  @Event
  onGameStart(byPlayer?: Player): void {
    this.sendSystem(byPlayer ? `Partida iniciada por \`${byPlayer.name}\`` : "Partida iniciada pelo sistema");
  }

  @Event
  onGameStop(byPlayer?: Player): void {
    this.sendSystem(byPlayer ? `Partida finalizada por \`${byPlayer.name}\`` : "Partida finalizada pelo sistema");
  }

  @Event
  onStadiumChange(newStadium: string, byPlayer?: Player): void {
    this.sendSystem(`Estádio alterado para **${newStadium}** ${byPlayer ? `por \`${byPlayer.name}\`` : "pelo sistema"}`);
  }
}
