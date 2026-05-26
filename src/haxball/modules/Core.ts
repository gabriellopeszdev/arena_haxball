import { Module, type Player, type Room, Event, Colors, ChatStyle, ChatSounds } from "haxball-extended-room";
import { fetch } from "undici";
import { bansDb, rolesDb } from "../../database/Database";
import { WebhookClient } from "discord.js";
import { getEnv } from "../../config/env";
import { getTeamIcon } from "../../utils/helpers";

@Module
export class CoreModule {
  private entryWebhook?: WebhookClient;
  private exitWebhook?: WebhookClient;

  constructor(private room: Room) {
    const entryUrl = process.env.ENTRADA_WEBHOOK;
    const exitUrl = process.env.SAIDA_WEBHOOK;
    if (entryUrl) this.entryWebhook = new WebhookClient({ url: entryUrl });
    if (exitUrl) this.exitWebhook = new WebhookClient({ url: exitUrl });
  }

  @Event
  async onPlayerJoin(player: Player): Promise<void> {
    const duplicate = Array.from(this.room.players.values()).find(
      (p) => (p.ip === player.ip || p.conn === player.conn || p.auth === player.auth) && p.id !== player.id,
    );
    if (duplicate) {
      player.kick(`⚠️ Você já está na sala [${duplicate.name}]`);
      return;
    }

    if (!player.auth || player.auth.trim() === "") {
      player.kick("❌ Auth inválida");
      return;
    }

    const ban = bansDb.find(player.auth, player.ip);
    if (ban) {
      player.ban("❌ Você está na lista negra da sala");
      return;
    }

    const roleData = rolesDb.findByAuth(player.auth) || rolesDb.findByIp(player.ip);
    if (roleData) {
      const roleName = roleData.role;
      const roleMap: Record<string, string> = {
        jogador: "⚽ jogador",
        capitao: "👮‍♂️ capitão",
        "sub-capitao": "💂 sub-capitão",
      };
      const displayName = roleMap[roleName];
      if (displayName) {
        player.settings.role = displayName;
        player.admin = true;
        this.room.send({
          message: `O ${displayName.toUpperCase()} ${player.name} entrou na sala.`,
          color: Colors.YellowGreen,
          style: ChatStyle.Bold,
          sound: ChatSounds.Notification,
        });
      }
    }

    let geo: Record<string, any> = {};
    try {
      const response = await fetch(`https://proxycheck.io/v2/${player.ip}?vpn=1&asn=1`);
      const result = (await response.json()) as Record<string, any>;
      geo = result[player.ip] || {};
      if (geo?.proxy === "yes" || geo?.vpn === "yes") {
        player.reply({
          message: "🛜 Detectado o uso de VPN ou Proxy!",
          color: Colors.DodgerBlue,
          style: ChatStyle.Bold,
          sound: ChatSounds.Notification,
        });
      }
    } catch {}

    player.reply({
      message: `👋🏼 Eai, ${player.name}! Seja bem-vindo(a) à ${this.room.name}!`,
      color: Colors.Red,
      style: ChatStyle.Bold,
      sound: ChatSounds.Notification,
    });

    player.reply({
      message: `📜 Para ver a lista de comandos disponíveis, use "!help".`,
      color: Colors.Orange,
      style: ChatStyle.Bold,
      sound: ChatSounds.None,
    });

    const provedora = geo.isp || geo.provider || "—";
    const organizacao = geo.org || geo.organization || "—";

    if (this.entryWebhook) {
      try {
        await this.entryWebhook.send({
          embeds: [{
            color: 0x00FF00,
            title: this.room.name,
            description: `\`${player.name}\` entrou na sala!`,
            fields: [
              { name: "Nick", value: `\`${player.name}\``, inline: true },
              { name: "Auth", value: `\`${player.auth}\``, inline: true },
              { name: "IP", value: `\`${player.ip}\``, inline: true },
              { name: "CONN", value: `\`${player.conn}\``, inline: true },
              { name: "Provedora", value: `\`${provedora}\``, inline: true },
              { name: "Organização", value: `\`${organizacao}\``, inline: true },
              { name: "País", value: `\`${geo.country || "—"}\``, inline: true },
              { name: "Estado", value: `\`${geo.region || "—"}\``, inline: true },
              { name: "Cidade", value: `\`${geo.city || "—"}\``, inline: true },
              { name: "Latitude", value: `\`${geo.latitude || "—"}\``, inline: true },
              { name: "Longitude", value: `\`${geo.longitude || "—"}\``, inline: true },
              { name: "Proxy", value: `\`${geo.proxy === "yes" ? "Sim" : "Não"}\``, inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${this.room.name}` },
          }],
        });
      } catch {}
    }
  }

  @Event
  async onPlayerLeave(player: Player): Promise<void> {
    if (this.exitWebhook) {
      try {
        await this.exitWebhook.send({
          embeds: [{
            color: 0xFF0000,
            title: this.room.name,
            description: `\`${player.name}\` saiu da sala!`,
            fields: [
              { name: "Nick", value: `\`\`\`fix\n${player.name}\`\`\``, inline: true },
              { name: "Auth", value: `\`\`\`fix\n${player.auth}\`\`\``, inline: true },
              { name: "IP", value: `\`\`\`fix\n${player.ip}\`\`\``, inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${this.room.name}` },
          }],
        });
      } catch {}
    }
  }

  @Event
  onPlayerChat(player: Player, message: string): boolean | undefined {
    if (message.startsWith("!")) return;
    if (player.settings.role) {
      const colors: Record<string, number> = {
        "⚽ jogador": Colors.MistyRose,
        "👮‍♂️ capitão": Colors.YellowGreen,
        "💂 sub-capitão": Colors.Yellow,
      };
      const color = colors[player.settings.role] || Colors.White;
      this.room.send({
        message: `[${player.settings.role.toUpperCase()}] ${player.name}: ${message}`,
        color,
        style: ChatStyle.Bold,
        sound: ChatSounds.Normal,
      });
      return false;
    }
  }
}
