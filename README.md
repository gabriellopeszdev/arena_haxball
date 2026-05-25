
<div align="center">

# 🏟️ **ARENA VINCERE**

> 🎮 Sistema completo de gerenciamento de salas **Haxball** com integração **Discord**, renderização de clipes e banco de dados SQLite.

<br>

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)
![Status](https://img.shields.io/badge/status-active-brightgreen?style=flat-square)

<br>

---

</div>

<br>

## 📋 **Sumário**

&nbsp;&nbsp;▸ &nbsp;[✨ Visão Geral](#-visão-geral)  
&nbsp;&nbsp;▸ &nbsp;[📦 Tecnologias](#-tecnologias)  
&nbsp;&nbsp;▸ &nbsp;[⚙️ Configuração](#️-configuração)  
&nbsp;&nbsp;▸ &nbsp;[🚀 Execução](#-execução)  
&nbsp;&nbsp;▸ &nbsp;[🏗️ Estrutura do Projeto](#️-estrutura-do-projeto)  
&nbsp;&nbsp;▸ &nbsp;[🎮 Funcionalidades Haxball](#-funcionalidades-haxball)  
&nbsp;&nbsp;▸ &nbsp;[💬 Funcionalidades Discord](#-funcionalidades-discord)  
&nbsp;&nbsp;▸ &nbsp;[🗺️ Mapas Disponíveis](#️-mapas-disponíveis)  
&nbsp;&nbsp;▸ &nbsp;[🎬 Sistema de Clipes](#-sistema-de-clipes)  
&nbsp;&nbsp;▸ &nbsp;[🌍 Geo-Localização](#-geo-localização)  
&nbsp;&nbsp;▸ &nbsp;[🤝 Contribuição](#-contribuição)  
&nbsp;&nbsp;▸ &nbsp;[📄 Licença](#-licença)

<br>

---

## ✨ **Visão Geral**

**Arena Vincere** é uma plataforma robusta para criação e gerenciamento de salas de **Haxball** (🔴🔵) com suporte total via **Discord**. O sistema permite controlar múltiplas salas simultaneamente, gerenciar cargos, aplicar bans/mutes, alternar mapas, e muito mais - tudo diretamente do seu servidor Discord.

> 🇧🇷 **Servidores localizados em São Paulo, Brasil** - latência mínima para jogadores brasileiros. Ambas as salas são principais.

<br>

---

## 📦 **Tecnologias**

<div align="center">

| 🔧 Tecnologia | 📌 Versão | 📖 Descrição |
|:---|:---:|---|
| **TypeScript** | `^5.x` | Linguagem principal com tipagem estática |
| **Node.js** | `^20.x` | Runtime JavaScript |
| **Discord.js** | `^14.x` | Framework de integração com Discord |
| **Haxball.js** | `^1.x` | Conexão com a API Headless do Haxball |
| **Better-SQLite3** | `^11.x` | Banco de dados local embarcado |
| **Puppeteer** | `~23.x` | Renderização de clipes headless |
| **Dotenv** | `^16.x` | Gerenciamento de variáveis de ambiente |

</div>

<br>

---

## ⚙️ **Configuração**

### 📄 **Variáveis de Ambiente**

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env
```

<details>
<summary><b>🔍 Clique para ver o conteúdo do <code>.env.example</code></b></summary>

```
# ─── Discord Bot ────────────────────────
TOKEN_BOT=seu_token_discord_aqui
CLIENT_ID=seu_client_id_aqui
GUILD_ID=seu_guild_id_aqui
TEAM_NAME=Fnatic

# ─── Geo (Brazil - 🇧🇷 São Paulo) ───────
GEO_CODE=BR
GEO_LAT=-23.5167
GEO_LON=-46.6463

# ─── Rooms (max 2 per IP without proxy) ─────
ROOM1_TOKEN=token_sala_1
ROOM1_NAME=🫄🏻 ARENA TERQUILA 🫄🏻
ROOM2_TOKEN=token_sala_2
ROOM2_NAME=🦉 ARENA GIU 🦉

# Proxy for rooms 3+
# ROOM3_TOKEN=token_sala_3
# ROOM3_PROXY=http://127.0.0.1:9050

# ─── Role Passwords ──────────────────
CAP=senha_capitao
SUBCAP=senha_subcapitao
JOGADOR=senha_jogador
ADMIN=senha_administrador
SENHA_PADRAO=fncpass

# ─── Discord Webhooks ───────────────────
ADMIN_WEBHOOK=url_admin
CONFIRMACAO_WEBHOOK=url_confirmacao
ENTRADA_WEBHOOK=url_entrada
SAIDA_WEBHOOK=url_saida
CHROMIUM_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

</details>

### 📦 **Instalação de Dependências**

```bash
npm install
```

<br>

---

## 🚀 **Execução**

### 🛠️ **Modo Desenvolvimento**

```bash
npm run dev
```

> 🔄 Recarrega automaticamente com `tsx watch`

### ⚡ **Modo Produção**

```bash
npm run build
npm start
```

<br>

---

## 🏗️ **Estrutura do Projeto**

```
📦 src/
 ┣ 📂 clip/              🎬 Sistema de renderização de clipes
 ┃ ┣ 📜 ClipManager.ts   ─ Gerenciador de eventos e gravação
 ┃ ┣ 📜 Queue.ts         ─ Fila de renderização
 ┃ ┗ 📜 Renderer.ts      ─ Renderizador Puppeteer
 ┣ 📂 config/            ⚙️ Configurações
 ┃ ┗ 📜 env.ts           ─ Leitura de variáveis de ambiente
 ┣ 📂 database/          🗄️ Banco de dados SQLite
 ┃ ┗ 📜 Database.ts      ─ Inicialização e conexão
 ┣ 📂 discord/           💬 Bot Discord
 ┃ ┣ 📜 Client.ts        ─ Inicialização do cliente
 ┃ ┣ 📜 EmbedFactory.ts  ─ Fábrica de embeds
 ┃ ┣ 📜 registrar.ts     ─ Registro de comandos slash
 ┃ ┗ 📂 cogs/            🧩 Comandos do bot
 ┃   ┣ 📜 Admin.ts       ─ Dar/remover admin
 ┃   ┣ 📜 Avatar.ts      ─ Alterar avatar
 ┃   ┣ 📜 Banir.ts       ─ Banir jogador
 ┃   ┣ 📜 Camp.ts        ─ Trocar de campo
 ┃   ┣ 📜 Chat.ts        ─ Ativar/desativar chat
 ┃   ┣ 📜 Desmutar.ts    ─ Desmutar jogador
 ┃   ┣ 📜 Despausar.ts   ─ Despausar partida
 ┃   ┣ 📜 Iniciar.ts     ─ Iniciar partida
 ┃   ┣ 📜 Kickar.ts      ─ Kickar jogador
 ┃   ┣ 📜 Kickrate.ts    ─ Configurar kickrate
 ┃   ┣ 📜 Limparbans.ts  ─ Limpar bans
 ┃   ┣ 📜 Mapa.ts        ─ Trocar mapa
 ┃   ┣ 📜 Mensagem.ts    ─ Enviar mensagem global
 ┃   ┣ 📜 MensagemPrivada.ts  ─ Mensagem privada
 ┃   ┣ 📜 MensagemTime.ts     ─ Mensagem para time
 ┃   ┣ 📜 Mutar.ts       ─ Mutar jogador
 ┃   ┣ 📜 Parar.ts       ─ Parar partida
 ┃   ┣ 📜 Pausar.ts      ─ Pausar partida
 ┃   ┣ 📜 Players.ts     ─ Listar jogadores
 ┃   ┣ 📜 Radius.ts      ─ Kick por raio
 ┃   ┣ 📜 Reiniciar.ts   ─ Reiniciar sala
 ┃   ┣ 📜 Senha.ts       ─ Alterar senha
 ┃   ┣ 📜 Time.ts        ─ Mover para time
 ┃   ┣ 📜 Trocar.ts      ─ Trocar de time
 ┃   ┗ 📜 Uniforme.ts    ─ Alterar uniforme
 ┣ 📂 haxball/           🎮 Módulos Haxball
 ┃ ┣ 📜 handler.ts       ─ Roteador de comandos
 ┃ ┣ 📂 commands/        ⌨️ Comandos in-game (!)
 ┃ ┃ ┣ 📜 AFK.ts
 ┃ ┃ ┣ 📜 Avatar.ts
 ┃ ┃ ┣ 📜 Ball.ts
 ┃ ┃ ┣ 📜 Ban.ts
 ┃ ┃ ┣ 📜 Camp.ts
 ┃ ┃ ┣ 📜 Chat.ts
 ┃ ┃ ┣ 📜 Eval.ts
 ┃ ┃ ┣ 📜 Kick.ts
 ┃ ┃ ┣ 📜 Mute.ts
 ┃ ┃ ┣ 📜 Password.ts
 ┃ ┃ ┣ 📜 Radius.ts
 ┃ ┃ ┣ 📜 Reset.ts
 ┃ ┃ ┣ 📜 Spec.ts
 ┃ ┃ ┣ 📜 Swap.ts
 ┃ ┃ ┗ 📜 Uniform.ts
 ┃ ┗ 📂 modules/         🧠 Módulos do sistema
 ┃   ┣ 📜 Admin.ts       ─ Sistema de admin
 ┃   ┣ 📜 BanKick.ts     ─ Ban/Kick automático
 ┃   ┣ 📜 Core.ts        ─ Entrada/saída/webhooks
 ┃   ┣ 📜 Goals.ts       ─ Sistema de gols
 ┃   ┣ 📜 Help.ts        ─ Comando !ajuda
 ┃   ┣ 📜 KickRate.ts    ─ Controle de kickrate
 ┃   ┣ 📜 Leave.ts       ─ Comando !sair
 ┃   ┣ 📜 Mute.ts        ─ Sistema de mute
 ┃   ┣ 📜 Pause.ts       ─ Sistema de pausa
 ┃   ┣ 📜 PrivateMessage.ts  ─ Mensagens privadas
 ┃   ┣ 📜 RealSoccer.ts  ─ Regras de futebol real
 ┃   ┣ 📜 Roles.ts       ─ Sistema de cargos
 ┃   ┣ 📜 Stadium.ts     ─ Gerenciador de mapas
 ┃   ┣ 📜 TeamChat.ts    ─ Chat por time
 ┃   ┗ 📜 Webhook.ts     ─ Webhooks de eventos
 ┣ 📂 room/              🏠 Gerenciamento de salas
 ┃ ┣ 📜 RoomFactory.ts   ─ Fábrica de salas Haxball
 ┃ ┗ 📜 RoomManager.ts   ─ Gerenciador de múltiplas salas
 ┣ 📂 utils/             🛠️ Utilitários
 ┃ ┗ 📜 helpers.ts       ─ Funções auxiliares
 ┗ 📜 index.ts           🚀 Ponto de entrada

📦 maps/                 🗺️ Mapas Haxball (JSON)
```

<br>

---

## 🎮 **Funcionalidades Haxball**

<div align="center">

| 🎯 Comando | 📖 Descrição | 🎭 Acesso |
|:---|---:|:---:|
| `!adm` | Virar administrador da sala (se não houver) | 👤 Todos |
| `!cargo` | Definir cargo por senha | 👤 Todos |
| `!rr` / `!reset` | Reiniciar a partida | 🏆 Admin/Cap/Sub/Jog |
| `!banall` / `!banred` / `!banblue` / `!banspec` | Banir todos/time/espectadores | 👮‍♂️ Cap / 💂 Sub |
| `!clearbans` | Limpar todos os bans | 🏆 Admin/Cap/Sub/Jog |
| `!kickall` / `!kickred` / `!kickblue` / `!kickspec` | Kickar todos/time/espectadores | 👮‍♂️ Cap / 💂 Sub |
| `!fechar` / `!abrir` | Fechar/abrir sala com senha | 🏆 Admin/Cap/Sub |
| `!mute` / `!unmute` | Mutar/desmutar jogador | 🏆 Admin/Cap/Sub |
| `!camp` / `!firmo` | Ativar/confirmar modo campeonato | 👮‍♂️ Cap / 💂 Sub / ⚽ Jog |
| `!swap` | Inverter times red/blue | 🏆 Admin/Cap/Sub/Jog |
| `!radius` | Alterar tamanho do jogador | 🏆 Admin/Cap/Sub |
| `!puxarbola` / `!pararbola` | Puxar/parar a bola | 🏆 Admin/Cap/Sub |
| `!tp` | Teleportar bola para posição | 🏆 Admin/Cap/Sub |
| `!chaton` / `!chatoff` | Ativar/desativar chat | 🏆 Admin/Cap/Sub |
| `!specon` / `!specoff` | Ativar/desativar chat de spec | 🏆 Admin/Cap/Sub |
| `!uniform` | Alterar uniforme | 🏆 Admin/Cap/Sub/Jog |
| `!avatar` | Alterar avatar | 🏆 Admin/Cap/Sub/Jog |
| `!afk` | Marcar como ausente | 👤 Todos |
| `!kickrate` | Configurar kickrate | 🏆 Admin/Cap/Sub |
| `!pausar` / `!despausar` | Pausar/despausar partida | 🏆 Admin/Cap/Sub/Jog |
| `!pv` / `!t` | Mensagem privada / chat do time | 👤 Todos |
| `!bb` / `!leave` | Sair da sala | 👤 Todos |
| `!help` | Mostrar ajuda | 👤 Todos |
| `!x3` / `!x4` / `!lvk` / `!rs` / `!penal` | Trocar mapa | 🏆 Admin/Cap/Sub/Jog |
| `!hackban` | Banir jogador por ID | 👮‍♂️ Cap |
| `!hackclearbans` | Limpar bans do banco de dados | 👮‍♂️ Cap |
| `!eval` | Executar código JavaScript | 👮‍♂️ Cap |

</div>

> **Hierarquia de cargos:** 👮‍♂️ **Capitão** (maior) → 💂 **Sub-capitão** → ⚽ **Jogador** → 👨‍💼 **Administrador** (menor)
>
> **Administrador da sala** (`!adm`) é um conceito separado dos cargos - qualquer um pode se tornar admin via `!adm` quando não houver nenhum presente. O cargo `👨‍💼 administrador` é definido via senha no `!cargo`.

<br>

---

## 💬 **Funcionalidades Discord**

<div align="center">

| 🤖 Comando | 📖 Descrição |
|:---|---:|
| `/admin` | 🛡️ Conceder ou remover admin de um jogador |
| `/avatar` | 🖼️ Alterar avatar de um jogador |
| `/banir` | 🚫 Banir jogador da sala permanentemente |
| `/desmutar` | 🔓 Remover mute de um jogador |
| `/despausar` | ▶️ Despausar a partida |
| `/iniciar` | 🏁 Iniciar uma nova partida |
| `/kickar` | 👢 Expulsar jogador da sala |
| `/kickrate` | ⚡ Configurar limite de kickrate |
| `/limparbans` | 🧹 Limpar lista de bans |
| `/mapa` | 🗺️ Trocar o mapa da sala |
| `/mensagem` | 💬 Enviar mensagem global na sala |
| `/mensagemprivada` | 🤫 Enviar mensagem privada para um jogador |
| `/mensagemtime` | 📢 Enviar mensagem para um time específico |
| `/mutar` | 🔇 Mutar um jogador temporariamente |
| `/parar` | ⏹️ Parar a partida em andamento |
| `/pausar` | ⏸️ Pausar a partida |
| `/players` | 👥 Listar todos os jogadores na sala |
| `/radius` | 📐 Alterar tamanho do jogador |
| `/reiniciar` | 🔄 Reiniciar a partida |
| `/senha` | 🔑 Alterar a senha da sala |
| `/time` | 🔵🔴 Mover jogador para um time |
| `/trocar` | 🔄 Trocar de campo (lado) |
| `/uniforme` | 👕 Alterar uniforme do time |

</div>

<br>

---

## 🗺️ **Mapas Disponíveis**

<div align="center">

| 🏟️ Mapa | 📐 Tipo |
|:---|---:|
| **Futsal X3** | 🏟️ Campo 3x3 |
| **Futsal X4** | 🏟️ Campo 4x4 |
| **Real Soccer Revolution** | ⚽ Campo Grande |
| **LVK** | 🏟️ Arena LVK |
| **Penaltis** | 🥅 Treino de pênaltis |

</div>

<br>

---

## 🎬 **Sistema de Clipes**

O sistema de clipes captura automaticamente lances de gol e gera vídeos utilizando **Puppeteer** + **Chromium** headless.

```
⚽ GOL ──➤ [Detecção automática]
               │
               ▼
        📹 ClipManager.ts ──➤ [Captura de replay]
               │
               ▼
        🎞️ Queue.ts ──➤ [Fila de renderização]
               │
               ▼
        🖼️ Renderer.ts ──➤ [Renderização Puppeteer]
               │
               ▼
        📤 Upload & Notificação
```

<br>

---

## 🌍 **Geo-Localização**

```
🇧🇷 Brasil - São Paulo
├── Latitude:  -23.5167
├── Longitude: -46.6463
└── Código:    BR
```

As salas são hospedadas com servidores otimizados para **América do Sul**, garantindo baixa latência para jogadores brasileiros.

<br>

---

## 🤝 **Contribuição**

1. 🍴 Faça um **fork** do projeto
2. 🌿 Crie uma **branch** (`git checkout -b feature/nova-feature`)
3. 💻 Faça suas **alterações**
4. ✔️ Execute `npm run build` para verificar erros de compilação
5. 📝 Faça o **commit** (`git commit -m '✨ Adiciona nova feature'`)
6. 📤 Faça o **push** (`git push origin feature/nova-feature`)
7. 🔃 Abra um **Pull Request**

<br>

---

## 📄 **Licença**

```
MIT License

Copyright © 2026 Arena Vincere

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
```

<br>

---

<div align="center">

**Feito por Fusion** ❤️

[![Discord](https://img.shields.io/badge/Discord-ARENA%20VINCERE-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/arena)

</div>
