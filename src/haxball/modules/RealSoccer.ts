import { ChatSounds, ChatStyle, Colors, Module, type Player, type Room, Teams, Event } from "haxball-extended-room";

@Module
export class RealSoccerModule {
  private active = false;
  private lastTouchTeam: number | null = null;
  private lastTouchPlayer: number | null = null;
  private goalKickTeam: number | null = null;
  private cornerTeam: number | null = null;
  private throwInTeam: number | null = null;
  private fieldDiscs: Map<number, any> = new Map();

  constructor(private room: Room) {
    this.room.customEvents.removeAllListeners("realSoccerToggle");
    this.room.customEvents.on("realSoccerToggle", (enabled: boolean) => {
      this.active = enabled;
    });
  }

  @Event
  onGameTick(): void {
    if (!this.active || !this.room.scores || !this.room.ball) return;
    this.checkThrowIn();
    this.checkCornerKick();
    this.checkGoalKick();
  }

  private checkThrowIn(): void {
    if (!this.room.ball || this.room.ball.x == null) return;
    const fieldWidth = 800;
    if (Math.abs(this.room.ball.x) > fieldWidth && this.room.scores?.time > 1) {
      if (!this.throwInTeam && this.lastTouchTeam) {
        this.throwInTeam = this.lastTouchTeam === 1 ? 2 : 1;
        this.room.send({ message: `⚽ Bola lateral para o time ${this.throwInTeam === 1 ? "🔴" : "🔵"}!`, color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Normal });
        setTimeout(() => { this.throwInTeam = null; }, 2000);
      }
    }
  }

  private checkCornerKick(): void {
    if (!this.room.ball || this.room.ball.x == null || this.room.ball.y == null) return;
    const fieldWidth = 800;
    const fieldHeight = 500;
    if ((Math.abs(this.room.ball.x) > fieldWidth + 10 || Math.abs(this.room.ball.y) > fieldHeight + 10) && this.room.scores?.time > 1) {
      if (!this.cornerTeam && this.lastTouchTeam) {
        this.cornerTeam = this.lastTouchTeam === 1 ? 2 : 1;
        this.room.send({ message: `🚩 Escanteio para o time ${this.cornerTeam === 1 ? "🔴" : "🔵"}!`, color: Colors.Cyan, style: ChatStyle.Bold, sound: ChatSounds.Normal });
        setTimeout(() => { this.cornerTeam = null; }, 2000);
      }
    }
  }

  private checkGoalKick(): void {
    if (!this.room.ball || this.room.ball.x == null) return;
    const goalLine = 810;
    if (this.room.ball.x > goalLine && this.lastTouchTeam === 1) {
      if (!this.goalKickTeam) {
        this.goalKickTeam = 2;
        this.room.send({ message: `🥅 Tiro de meta para o time 🔵!`, color: Colors.LawnGreen, style: ChatStyle.Bold, sound: ChatSounds.Normal });
        setTimeout(() => { this.goalKickTeam = null; }, 2000);
      }
    } else if (this.room.ball.x < -goalLine && this.lastTouchTeam === 2) {
      if (!this.goalKickTeam) {
        this.goalKickTeam = 1;
        this.room.send({ message: `🥅 Tiro de meta para o time 🔴!`, color: Colors.LawnGreen, style: ChatStyle.Bold, sound: ChatSounds.Normal });
        setTimeout(() => { this.goalKickTeam = null; }, 2000);
      }
    }
  }

  @Event
  onPlayerBallKick(player: Player): void {
    if (!this.active) return;
    this.lastTouchTeam = player.team;
    this.lastTouchPlayer = player.id;
  }

  @Event
  onTeamGoal(): void {
    this.lastTouchTeam = null;
    this.lastTouchPlayer = null;
    this.goalKickTeam = null;
    this.cornerTeam = null;
    this.throwInTeam = null;
  }

  @Event
  onGameStop(): void {
    this.goalKickTeam = null;
    this.cornerTeam = null;
    this.throwInTeam = null;
  }
}
