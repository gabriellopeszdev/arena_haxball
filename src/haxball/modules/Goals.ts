import { ChatSounds, ChatStyle, Colors, Module, type Player, type Room, Teams, Event } from "haxball-extended-room";
import FormData from "form-data";
import { request } from "undici";
import { currentStadiumName } from "./Stadium";
import { client } from "../../discord/Client";

let playersThatTouchedTheBall = new Set<number>();
let lastBallPosition: { x: number; y: number } | null = null;
let lastBallSpeed = 0;
let lastTouchByTeam: number | null = null;
let lastTouchByPlayer: number | null = null;

function pointDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function uploadReplayToTheHax(recording: Uint8Array, roomName: string, callback: (result: string | null) => void) {
  const tenant = process.env.THEHAX_TENANT;
  const apiKey = process.env.THEHAX_APIKEY;
  if (!tenant || !apiKey) return callback(null);

  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }).replace(/,/g, "").replace(/\//g, "-").replace(/ /g, "-");
  const form = new FormData();
  form.append("replay[name]", `${roomName} - ${agora}`);
  form.append("replay[private]", "false");
  form.append("replay[fileContent]", recording.toString());

  const tryUpload = (attempt: number) => {
    request("https://replay.thehax.pl/api/upload", {
      method: "POST", headers: { ...form.getHeaders(), "API-Tenant": tenant, "API-Key": apiKey }, body: form,
    })
      .then((r) => r.body.json())
      .then((result: any) => {
        if (result.success && result.url) return callback(result.url);
        if ([401, 422].includes(result.code)) return callback(null);
        if ([429, 500].includes(result.code) && attempt < 3) setTimeout(() => tryUpload(attempt + 1), attempt * 1000);
        else callback(null);
      })
      .catch(() => { if (attempt < 3) setTimeout(() => tryUpload(attempt + 1), attempt * 1000); else callback(null); });
  };
  tryUpload(1);
}

@Module
export class GoalsModule {
  private isRecording = false;
  private hasGameStarted = false;
  private goals: { time: string; scorer: string; assister: string | null; isOwnGoal: boolean; teamEmoji: string }[] = [];
  private redScore = 0;
  private blueScore = 0;
  private gameTime = "00:00";
  private scorer: Player | null = null;
  private assister: Player | null = null;

  constructor(private room: Room) {
    this.room.onTeamVictory = (scores) => this.handleTeamVictory(scores);
    this.room.onTeamGoal = (team) => this.handleTeamGoal(team);
    this.room.onPlayerBallKick = (player) => { this.trackScorer(player); };
    this.room.onGameTick = () => this.handleTick();
  }

  private trackScorer(player: Player): void {
    if (!this.scorer) { this.scorer = player; return; }
    if (this.scorer.id !== player.id && player.team === this.scorer.team) { this.assister = this.scorer; this.scorer = player; return; }
    if (this.scorer.id !== player.id) { this.scorer = player; this.assister = null; }
  }

  private handleTick(): void {
    if (!this.room.scores) return;
    if (!this.isRecording && this.room.scores.time > 0) {
      this.isRecording = true;
      this.room.startRecording();
      this.room.send({ message: "🎥 A partida está sendo gravada.", color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
    }
    this.updateScores(this.room.scores);
    this.trackBall();
  }

  private isOwnGoal(goalTeam: number, scorer: Player): boolean {
    if (scorer.team === 0) return false;
    return goalTeam !== scorer.team;
  }

  private handleTeamGoal(team: number): void {
    if (!this.scorer && lastTouchByPlayer !== null) {
      const p = Array.from(this.room.players.values()).find((pl) => pl.id === lastTouchByPlayer);
      if (p) this.scorer = p;
    }
    const scorer = this.scorer;
    if (!scorer) return;

    const ownGoal = this.isOwnGoal(team, scorer);
    const teamEmoji = team === 1 ? "🔴" : "🔵";
    const validAssister = this.assister && this.assister.team === scorer.team ? this.assister.name : null;

    this.goals.push({ time: this.gameTime, scorer: scorer.name, assister: validAssister, isOwnGoal: ownGoal, teamEmoji });

    const speedText = lastBallSpeed ? ` Velocidade: ${lastBallSpeed.toFixed(2)}km/h` : "";
    let msg: string;
    if (ownGoal) msg = `[${this.gameTime}] 🤣 Gol contra de ${teamEmoji} ${scorer.name}.${speedText}`;
    else msg = `[${this.gameTime}] ⚽ Gol de ${scorer.name}!${validAssister ? ` 🅰️ (assistência de ${validAssister})` : ""}${speedText}`;

    this.room.send({ message: msg, color: team === 1 ? Colors.PaleVioletRed : Colors.LightBlue, style: ChatStyle.Bold, sound: ChatSounds.Notification });

    const msgUrl = process.env.MENSAGEM_WEBHOOK;
    if (msgUrl) request(msgUrl, { method: "POST", body: JSON.stringify({ content: `[${this.room.name}] ${msg}` }), headers: { "Content-Type": "application/json" } }).catch(() => {});

    this.scorer = null;
    this.assister = null;
    resetTouchTracking();
  }

  private handleTeamVictory(scores: { red: number; blue: number }): void {
    const winner = scores.red > scores.blue ? "red" : "blue";
    const ws = winner === "red" ? scores.red : scores.blue;
    const ls = winner === "red" ? scores.blue : scores.red;
    this.room.send({ message: `🥇 O time ${winner} venceu por ${ws}-${ls}!`, color: winner === "red" ? Colors.PaleVioletRed : Colors.LightBlue, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  }

  @Event
  onGameStart(): void {
    this.hasGameStarted = true;
    this.isRecording = false;
    this.goals = [];
    this.scorer = null;
    this.assister = null;
    resetTouchTracking();
  }

  @Event
  onGameStop(): void {
    this.hasGameStarted = false;
    if (this.isRecording) {
      const rec = this.room.stopRecording();
      if (this.goals.length > 0) {
        const webhookUrl = process.env.GRAVACAO_WEBHOOK;
        if (webhookUrl) {
          uploadReplayToTheHax(rec, this.room.name, (theHaxUrl) => {
            if (theHaxUrl) {
              this.room.send({ message: `🎥 Replay enviado: ${theHaxUrl}`, color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
            } else {
              this.room.send({ message: "🎥 A gravação foi enviada.", color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
            }
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, "0");
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const yyyy = now.getFullYear();
            const hh = String(now.getHours()).padStart(2, "0");
            const min = String(now.getMinutes()).padStart(2, "0");
            const ss = String(now.getSeconds()).padStart(2, "0");
            const fileName = `HBReplay-${dd}-${mm}-${yyyy}-${hh}h${min}m${ss}s.hbr2`;

            const theHaxEmoji = client.emojis.cache.find((e) => e.name === "TheHax");
            const theHaxPrefix = theHaxEmoji ? `${theHaxEmoji} ` : "";

            const embed = {
              title: `📝 \`SÚMULA DA PARTIDA\` - ${this.room.name}`,
              color: this.redScore > this.blueScore ? Colors.Red : this.blueScore > this.redScore ? Colors.LightBlue : Colors.LightGreen,
              fields: [
                { name: `🔴 \`RED\` (${this.redScore})`, value: Array.from(this.room.players.red().values()).map((p) => `🔴 ${p.name}`).join("\n") || "ㅤ", inline: true },
                { name: "🟢 \`SPEC\`", value: Array.from(this.room.players.spectators().values()).map((p) => `🟢 ${p.name}`).join("\n") || "ㅤ", inline: true },
                { name: `🔵 \`BLUE\` (${this.blueScore})`, value: Array.from(this.room.players.blue().values()).map((p) => `🔵 ${p.name}`).join("\n") || "ㅤ", inline: true },
                { name: "⏳ \`Tempo de Jogo\`", value: this.gameTime, inline: true },
                { name: "🗺️ \`Mapa\`", value: currentStadiumName, inline: true },
                { name: "📁 \`Nome do Replay\`", value: `\`\`\`fix\n${fileName}\`\`\``, inline: false },
                ...(this.goals.length > 0 ? [{ name: "📊 \`Estatísticas\`", value: this.goals.map((g) => `⏱️ **[${g.time}]** - ${g.teamEmoji} ${g.isOwnGoal ? `Gol contra de \`${g.scorer}\`` : `Gol de \`${g.scorer}\`${g.assister ? ` 🅰️ Assistência de \`${g.assister}\`` : ""}`}`).join("\n"), inline: false }] : []),
                ...(theHaxUrl ? [{ name: `${theHaxPrefix}\`Link do Replay\``, value: `[Clique aqui para abrir](${theHaxUrl})`, inline: false }] : []),
              ],
              footer: { text: `${new Date().getFullYear()} © ${this.room.name} - Todos os direitos reservados`, icon_url: client.user?.displayAvatarURL({ size: 256 }) },
            };
            const form = new FormData();
            form.append("payload_json", JSON.stringify({ embeds: [embed] }));
            form.append("file", Buffer.from(rec), fileName);
            request(webhookUrl, { method: "POST", headers: form.getHeaders(), body: form }).catch(() => {});
          });
        } else {
          this.room.send({ message: "🎥 A gravação foi enviada.", color: Colors.Gray, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        }
      }
    }
    this.isRecording = false;
    this.scorer = null;
    this.assister = null;
    resetTouchTracking();
  }

  private updateScores(scores: { red: number; blue: number; time: number }): void {
    this.redScore = scores.red;
    this.blueScore = scores.blue;
    const m = Math.floor(scores.time / 60).toString().padStart(2, "0");
    const s = Math.floor(scores.time % 60).toString().padStart(2, "0");
    this.gameTime = `${m}:${s}`;
  }

  private trackBall(): void {
    if (this.room.ball.x == null || this.room.ball.y == null) return;
    const pos = { x: this.room.ball.x, y: this.room.ball.y };
    if (lastBallPosition) lastBallSpeed = (pointDistance(pos, lastBallPosition) * 60 * 60 * 60) / 15000;
    lastBallPosition = pos;
    for (const p of this.room.players.values()) {
      if (!p.position) continue;
      if (!playersThatTouchedTheBall.has(p.id) && pointDistance(p.position, pos) < 25.01) {
        playersThatTouchedTheBall.add(p.id);
        lastTouchByTeam = p.team;
        lastTouchByPlayer = p.id;
      } else if (playersThatTouchedTheBall.has(p.id) && pointDistance(p.position, pos) > 29.01) {
        playersThatTouchedTheBall.delete(p.id);
      }
    }
  }
}

function resetTouchTracking() {
  playersThatTouchedTheBall.clear();
  lastTouchByTeam = null;
  lastTouchByPlayer = null;
  lastBallPosition = null;
  lastBallSpeed = 0;
}
