import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Module, ModuleCommand, type Room } from "haxball-extended-room";

@Module
export class HelpModule {
  constructor(private room: Room) {}

  @ModuleCommand({
    aliases: ["ajuda", "comandos", "commands"],
    desc: "Mostra a lista de comandos disponíveis.",
    usage: "help",
    roles: [],
    deleteMessage: true,
  })
  public help(execInfo: CommandExecInfo): void {
    const commands = this.room.commands;
    const prefix = this.room.prefix || "!";
    const lines = commands.map((cmd) => `• ${prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ""}${cmd.desc ? ` — ${cmd.desc}` : ""}`);
    const helpText = lines.join("\n");
    execInfo.player.reply({
      message: `📜 Comandos disponíveis:\n\n${helpText}`,
      color: Colors.Cyan,
      style: ChatStyle.SmallItalic,
      sound: ChatSounds.None,
    });
  }
}
