import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";
import FutsalX3 from "../../../maps/Futsal X3 by Bazinga.json";
import FutsalX4 from "../../../maps/Futsal X4 by Bazinga.json";
import LVK from "../../../maps/LVK.json";
import RealSoccerRevolution from "../../../maps/Real Soccer Revolution.json";
import Penaltis from "../../../maps/Penaltis.json";

export let currentStadiumName = "Classic";

class StadiumCommand {
  constructor(private room: Room, private stadium: object | string, private name: string) {}

  execute(execInfo: CommandExecInfo): void {
    if (execInfo.arguments.length > 0) {
      execInfo.player.reply({ message: `[PV] ❌ Utilize apenas ${execInfo.message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
      return;
    }
    if (this.room.isGameInProgress()) {
      execInfo.player.reply({ message: "[PV] ⛔ Não pode alterar mapa durante partida.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    this.room.setStadium(this.stadium as any);
    currentStadiumName = this.name;
    this.room.send({ message: `✅ Mapa alterado para ${this.name} por ${execInfo.player.name}.`, color: Colors.Orange, style: ChatStyle.SmallBold, sound: ChatSounds.Notification });
  }
}

@Module
export class StadiumModule {
  private commands: StadiumCommand[];

  constructor(private room: Room) {
    this.commands = [
      new StadiumCommand(room, FutsalX3, "Futsal X3"),
      new StadiumCommand(room, FutsalX4, "Futsal X4"),
      new StadiumCommand(room, LVK, "X1 LVK"),
      new StadiumCommand(room, RealSoccerRevolution, "Real Soccer Revolution"),
      new StadiumCommand(room, Penaltis, "Pênaltis"),
    ];
    this.room.onStadiumChange = (name) => { currentStadiumName = name; };
  }

  @ModuleCommand({ aliases: ["bazingax3", "x3bazinga", "futsalx3"], desc: "Carrega Futsal X3 by Bazinga.", usage: "x3", roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public x3(execInfo: CommandExecInfo) { this.commands[0].execute(execInfo); }

  @ModuleCommand({ aliases: ["bazingax4", "x4bazinga", "futsalx4"], desc: "Carrega Futsal X4 by Bazinga.", usage: "x4", roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public x4(execInfo: CommandExecInfo) { this.commands[1].execute(execInfo); }

  @ModuleCommand({ aliases: ["x1", "x1lvk"], desc: "Carrega LVK.", usage: "lvk", roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public lvk(execInfo: CommandExecInfo) { this.commands[2].execute(execInfo); }

  @ModuleCommand({ aliases: ["rsr", "realsoccer", "rs"], desc: "Carrega Real Soccer Revolution.", usage: "rs", roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public rs(execInfo: CommandExecInfo) { this.commands[3].execute(execInfo); }

  @ModuleCommand({ aliases: ["penalti", "penaltis", "penal"], desc: "Carrega Pênaltis.", usage: "penal", roles: ["admin", "👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador"], deleteMessage: true })
  public penal(execInfo: CommandExecInfo) { this.commands[4].execute(execInfo); }
}
