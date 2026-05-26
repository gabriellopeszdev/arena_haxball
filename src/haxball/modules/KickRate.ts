import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";

@Module
export class KickRateModule {
  constructor(private room: Room) {}

  @ModuleCommand({
    aliases: ["kickrate", "kr"],
    desc: "Define o limite de kicks.",
    usage: "kickrate <min> <rate> <burst>",
    roles: ["👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
  })
  public kickrate(execInfo: CommandExecInfo): void {
    if (execInfo.arguments.length < 3) {
      execInfo.player.reply({ message: "[PV] ⚠️ Use: kickrate <min> <rate> <burst>", color: Colors.Yellow, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    const min = parseInt(execInfo.arguments[0].toString());
    const rate = parseInt(execInfo.arguments[1].toString());
    const burst = parseInt(execInfo.arguments[2].toString());
    if (isNaN(min) || isNaN(rate) || isNaN(burst)) {
      execInfo.player.reply({ message: "[PV] ⚠️ Valores inválidos.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }
    this.room.setKickRateLimit(min, rate, burst);
    this.room.send({ message: `⚙️ Kick rate definido por ${execInfo.player.name}: min=${min}, rate=${rate}, burst=${burst}`, color: Colors.Cyan, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  }
}
