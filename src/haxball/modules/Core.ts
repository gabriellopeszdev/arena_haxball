import { Module, type Player, type Room, Event, Colors, ChatStyle, ChatSounds } from "haxball-extended-room";
import { fetch } from "undici";
import { bansDb, rolesDb } from "../../database/Database";
import { WebhookClient } from "discord.js";
import { client } from "../../discord/Client";

const emojiMap: Record<string, { id: string; emojiName: string }> = {
  Nick: { id: "1508652143605846096", emojiName: "Nick" },
  Auth: { id: "1508652011770478673", emojiName: "Auth" },
  IP: { id: "1508652093848817794", emojiName: "IP" },
  CONN: { id: "1508652073820885124", emojiName: "CONN" },
  Provedora: { id: "1508652192855363655", emojiName: "Provedora" },
  "Organização": { id: "1508652159611441302", emojiName: "Organizacao" },
  "País": { id: "1508652175801319527", emojiName: "Pais" },
  Estado: { id: "1508652231761854655", emojiName: "Estado" },
  Cidade: { id: "1508652056888741998", emojiName: "Cidade" },
  Latitude: { id: "1508652110605058178", emojiName: "Latitude" },
  Longitude: { id: "1508652126891540711", emojiName: "Longitude" },
  Proxy: { id: "1508652213151727696", emojiName: "Proxy" },
};

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

  private emojiField(name: string): string {
    const data = emojiMap[name];
    if (data) {
      return `<:${data.emojiName}:${data.id}> ${name}`;
    }
    return name;
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
    } catch {}

    if (geo.proxy === "yes") {
      player.reply({
        message: `🛜 Detectado o uso de VPN ou Proxy!`,
        color: Colors.DodgerBlue,
        style: ChatStyle.Bold,
        sound: ChatSounds.Notification,
      });
    }

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

    player.settings.geoData = geo;

    const provedora = geo.provider || geo.isp || "—";
    const organizacao = geo.organisation || geo.organization || geo.org || "—";

    if (this.entryWebhook) {
      try {
        await this.entryWebhook.send({
          embeds: [{
            color: 0x00FF00,
            title: this.room.name,
            description: `\`${player.name}\` entrou na sala!`,
            fields: [
              { name: this.emojiField("Nick"), value: `\`\`\`fix\n${player.name}\`\`\``, inline: true },
              { name: this.emojiField("Auth"), value: `\`\`\`fix\n${player.auth}\`\`\``, inline: true },
              { name: this.emojiField("IP"), value: `\`\`\`fix\n${player.ip}\`\`\``, inline: true },
              { name: this.emojiField("CONN"), value: `\`\`\`fix\n${player.conn}\`\`\``, inline: true },
              { name: this.emojiField("Provedora"), value: `\`\`\`fix\n${provedora}\`\`\``, inline: true },
              { name: this.emojiField("Organização"), value: `\`\`\`fix\n${organizacao}\`\`\``, inline: true },
              { name: this.emojiField("País"), value: `\`\`\`fix\n${geo.country || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Estado"), value: `\`\`\`fix\n${geo.region || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Cidade"), value: `\`\`\`fix\n${geo.city || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Latitude"), value: `\`\`\`fix\n${geo.latitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Longitude"), value: `\`\`\`fix\n${geo.longitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Proxy"), value: geo.proxy === "yes" ? "```yaml\nSim```" : "```fix\nNão```", inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${this.room.name} - Todos os direitos reservados`, icon_url: client.user?.displayAvatarURL({ size: 256 }) },
          }],
        });
      } catch {}
    }
  }

  @Event
  async onPlayerLeave(player: Player): Promise<void> {
    if (this.exitWebhook) {
      try {
        const geo = (player.settings.geoData || {}) as Record<string, any>;
        const provedora = geo.provider || geo.isp || "—";
        const organizacao = geo.organisation || geo.organization || geo.org || "—";

        await this.exitWebhook.send({
          embeds: [{
            color: 0xFF0000,
            title: this.room.name,
            description: `\`${player.name}\` saiu da sala!`,
            fields: [
              { name: this.emojiField("Nick"), value: `\`\`\`fix\n${player.name}\`\`\``, inline: true },
              { name: this.emojiField("Auth"), value: `\`\`\`fix\n${player.auth}\`\`\``, inline: true },
              { name: this.emojiField("IP"), value: `\`\`\`fix\n${player.ip}\`\`\``, inline: true },
              { name: this.emojiField("CONN"), value: `\`\`\`fix\n${player.conn}\`\`\``, inline: true },
              { name: this.emojiField("Provedora"), value: `\`\`\`fix\n${provedora}\`\`\``, inline: true },
              { name: this.emojiField("Organização"), value: `\`\`\`fix\n${organizacao}\`\`\``, inline: true },
              { name: this.emojiField("País"), value: `\`\`\`fix\n${geo.country || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Estado"), value: `\`\`\`fix\n${geo.region || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Cidade"), value: `\`\`\`fix\n${geo.city || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Latitude"), value: `\`\`\`fix\n${geo.latitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Longitude"), value: `\`\`\`fix\n${geo.longitude || "—"}\`\`\``, inline: true },
              { name: this.emojiField("Proxy"), value: geo.proxy === "yes" ? "```yaml\nSim```" : "```fix\nNão```", inline: true },
            ],
            footer: { text: `${new Date().getFullYear()} © ${this.room.name} - Todos os direitos reservados`, icon_url: client.user?.displayAvatarURL({ size: 256 }) },
          }],
        });
      } catch {}
    }
  }

  @Event
  onPlayerChat(player: Player, message: string): boolean | undefined {
    if (message.startsWith("!")) {
      const cmdName = message.slice(1).trim().split(/ +/)[0].toLowerCase();
      const commands = (this.room as any)._commands;
      if (commands && !commands.get(cmdName)) {
        player.reply({ message: `Comando desconhecido: ${message.split(" ")[0]}`, color: Colors.Red, style: ChatStyle.Bold, sound: ChatSounds.Notification });
        return false;
      }
      return;
    }
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
