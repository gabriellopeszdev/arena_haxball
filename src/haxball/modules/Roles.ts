import { ChatSounds, ChatStyle, Colors, type CommandExecInfo, Event, Module, ModuleCommand, type Player, type Room } from "haxball-extended-room";
import { rolesDb } from "../../database/Database";

@Module
export class RolesModule {
  constructor(private room: Room) {}

  private roleHierarchy: Record<string, number> = {
    "⚽ jogador": 1, "💂 sub-capitão": 2, "👮‍♂️ capitão": 3, "👨‍💼 ADMINISTRADOR": 4,
  };

  private passwordMap: Record<string, string> = {};

  private getPasswords(): Record<string, string> {
    return {
      [process.env.JOGADOR || ""]: "⚽ jogador",
      [process.env.CAP || ""]: "👮‍♂️ capitão",
      [process.env.SUBCAP || ""]: "💂 sub-capitão",
      [process.env.ADMIN || ""]: "👨‍💼 ADMINISTRADOR",
    };
  }

  private roleToDb(role: string): string {
    const map: Record<string, string> = { "⚽ jogador": "jogador", "👮‍♂️ capitão": "capitao", "💂 sub-capitão": "sub-capitao", "👨‍💼 ADMINISTRADOR": "administrador" };
    return map[role] || "";
  }

  @ModuleCommand({
    aliases: [],
    desc: "Define o cargo do jogador com base na senha.",
    usage: "!cargo <senha>",
    roles: [],
    deleteMessage: true,
  })
  public async cargo(execInfo: CommandExecInfo): Promise<void> {
    const player = execInfo.player;
    const input = execInfo.arguments[0]?.toString();
    if (!input) {
      player.reply({ message: "[PV] ⚠️ Você deve fornecer uma senha.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Normal });
      return;
    }

    const passwords = this.getPasswords();
    const targetRole = passwords[input];
    if (!targetRole) {
      player.reply({ message: "[PV] ⚠️ Senha inválida.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    const currentRole = player.settings.role;
    if (currentRole === targetRole) {
      player.reply({ message: `[PV] ❌ Você já é ${targetRole}.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    if (currentRole && (this.roleHierarchy[currentRole] || 0) > (this.roleHierarchy[targetRole] || 0)) {
      player.reply({ message: `[PV] ❌ Não pode usar esta senha pois seu cargo (${currentRole}) é superior.`, color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification });
      return;
    }

    if (currentRole) {
      const oldDbRole = this.roleToDb(currentRole);
      if (oldDbRole) rolesDb.removeByAuth(player.auth ?? "");
    }

    player.settings.role = targetRole;
    player.admin = true;
    rolesDb.upsert(player.ip ?? "", player.auth ?? "", player.name ?? "", this.roleToDb(targetRole));

    this.room.send({
      message: `${player.name} utilizou a senha de ${targetRole.toUpperCase()}.`,
      color: Colors.YellowGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification,
    });
  }

  @ModuleCommand({
    aliases: ["hackbanir"],
    desc: "Banir um jogador por ID.",
    usage: "hackban <ID>",
    roles: ["👨‍💼 ADMINISTRADOR", "👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
  })
  public hackban(execInfo: CommandExecInfo): void {
    const { player, arguments: [targetId], room } = execInfo;
    if (!targetId) { player.reply({ message: "[PV] ⚠️ Informe o ID.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    const id = Number.parseInt(targetId.toString().replace("#", ""), 10);
    if (isNaN(id)) { player.reply({ message: "[PV] ⚠️ ID inválido.", color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    const target = room.players[id];
    if (!target) { player.reply({ message: `[PV] ⚠️ Jogador ${id} não encontrado.`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    if (["👮‍♂️ capitão", "💂 sub-capitão", "⚽ jogador", "👨‍💼 ADMINISTRADOR"].includes(target.settings.role)) {
      player.reply({ message: "[PV] ❌ Não pode banir este jogador.", color: Colors.Orange, style: ChatStyle.Bold, sound: ChatSounds.Notification }); return; }
    target.ban("🔴 !hackban");
    const { bansDb } = require("../../database/Database");
    bansDb.insert(target.ip ?? "", target.auth ?? "", target.name ?? "", player.name ?? "", "hackban");
  }

  @ModuleCommand({
    aliases: ["hackclearbans", "hacklimparbans", "hackcb"],
    desc: "Limpar todos os bans do banco de dados.",
    usage: "hackclearbans",
    roles: ["👨‍💼 ADMINISTRADOR", "👮‍♂️ capitão", "💂 sub-capitão"],
    deleteMessage: true,
  })
  public hackclearbans(execInfo: CommandExecInfo): void {
    const { bansDb } = require("../../database/Database");
    const result = bansDb.clear();
    execInfo.room.unbanAll();
    execInfo.player.reply({ message: "[PV] ✅ Todos os bans foram limpos.", color: Colors.SeaGreen, style: ChatStyle.Bold, sound: ChatSounds.Notification });
  }
}
