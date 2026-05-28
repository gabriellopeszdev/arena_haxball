<div align="center">

# Arena Vincere

Sistema de salas HaxBall com bot Discord, cargos persistentes, automações de moderação, replay upload e geração de GIFs.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Discord.js](https://img.shields.io/badge/Discord.js-5865F2?style=for-the-badge&logo=discord&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![Puppeteer](https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white)

**HaxBall + Discord + SQLite + clipes automáticos**

</div>

---

## Visão Geral

Arena Vincere centraliza a operação de uma ou mais salas HaxBall com:

- comandos in-game com cargos persistentes;
- comandos slash no Discord;
- webhooks para entrada, saída, mensagens, bans e gravações;
- replays enviados ao TheHax;
- GIFs dos últimos segundos da partida;
- banco SQLite local para cargos, bans, mutes e fila de clips;
- hot reload para módulos e comandos.

---

## Cargos

Hierarquia dos cargos do sistema:

```text
👮‍♂️ Capitão > 💂 Sub-capitão > ⚽ Jogador > 👨‍💼 Administrador > 👑 Admin da sala > Membro comum
```

Notas importantes:

- `👑 Admin da sala` é o `player.admin` nativo do HaxBall.
- `👨‍💼 Administrador` é cargo do sistema, obtido via `!cargo`.
- `player.admin` sozinho não é o cargo `👨‍💼 Administrador`.
- Cargos persistem no SQLite por auth/IP.

---

## Comandos In-Game

| Comando | Descrição | Acesso |
|:--|:--|:--|
| `!adm` | Vira admin da sala quando não há admin presente | 👤 Todos |
| `!cargo <senha>` | Define cargo persistente por senha | 👤 Todos |
| `!rr` / `!reset` | Reinicia a partida | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!fechar` / `!senha` | Fecha a sala com senha | 👨‍💼 Adm / 💂 Sub / 👮‍♂️ Cap |
| `!abrir` | Remove a senha da sala | 👨‍💼 Adm / 💂 Sub / 👮‍♂️ Cap |
| `!clearbans` | Limpa bans do HaxBall e banco | 👑 Admin / 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!banall` / `!banred` / `!banblue` / `!banspec` | Bane grupos de jogadores | 👮‍♂️ Cap / 💂 Sub |
| `!kickall` / `!kickred` / `!kickblue` / `!kickspec` | Kicka grupos de jogadores | 👮‍♂️ Cap / 💂 Sub |
| `!mute` / `!unmute` | Muta ou desmuta jogador | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!camp` / `!firmo` | Ativa campeonato e confirma presença | 👮‍♂️ Cap / 💂 Sub / ⚽ Jog |
| `!swap` | Troca times entre red, blue e spec | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!radius` | Altera o raio de um jogador | 👨‍💼 Adm / 💂 Sub / 👮‍♂️ Cap |
| `!puxarbola` / `!pararbola` / `!tp` | Controle avançado da bola | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!chaton` / `!chatoff` | Liga/desliga chat de jogadores | 👨‍💼 Adm / 💂 Sub / 👮‍♂️ Cap |
| `!specon` / `!specoff` | Liga/desliga chat de espectadores | 👨‍💼 Adm / 💂 Sub / 👮‍♂️ Cap |
| `!uniform` | Altera uniforme do time | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!avatar` | Altera avatar de jogador | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!pausar` / `!despausar` | Pausa ou despausa a partida | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!pv` / `!t` | Mensagem privada ou chat de time | 👤 Todos |
| `!afk` / `!afks` | Marca AFK ou lista AFKs | 👤 Todos |
| `!bb` / `!leave` | Sai da sala | 👤 Todos |
| `!help` | Mostra comandos disponíveis | 👤 Todos |
| `!gif` / `!clip` / `!gravar` / `!replay` | Gera GIF dos últimos segundos | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!x3` / `!x4` / `!lvk` / `!rs` / `!penal` | Troca o mapa | 👨‍💼 Adm / ⚽ Jog / 💂 Sub / 👮‍♂️ Cap |
| `!hackban` | Bane jogador por ID | 👮‍♂️ Cap |
| `!hackclearbans` | Limpa bans do banco | 👮‍♂️ Cap |
| `!eval` | Executa JavaScript | 👮‍♂️ Cap |

---

## Sistema de GIFs

O comando `!gif` gera um GIF dos últimos segundos da partida.

Regras:

- acesso apenas para `👮‍♂️ Capitão`, `💂 Sub-capitão`, `⚽ Jogador` e `👨‍💼 Administrador`;
- duração permitida: `1` a `15` segundos;
- sem duração informada, o padrão é `5s`;
- se a partida tiver menos tempo que o pedido, o GIF usa apenas o tempo disponível;
- máximo de `4` GIFs por partida;
- o GIF é enviado no Discord via `GIFS_WEBHOOK`;
- depois de enviado com sucesso, o arquivo local é apagado;
- se o envio falhar, o arquivo local permanece salvo em `clips/`.

Exemplos:

```text
!gif
!gif 5
!clip 10 gola bonito
!replay 3 defesa final
```

O embed enviado no Discord inclui sala, duração, solicitante, comentário e o GIF anexado.

---

## Discord

Os comandos slash controlam a sala pelo Discord.

| Comando | Função |
|:--|:--|
| `/admin` | Dá ou remove admin nativo da sala |
| `/avatar` | Altera avatar de jogador |
| `/banir` | Bane jogador |
| `/kickar` | Kicka jogador |
| `/mutar` / `/desmutar` | Muta ou desmuta jogador |
| `/players` | Lista jogadores da sala |
| `/time` | Move jogador de time |
| `/radius` | Altera raio de jogador |
| `/mensagem geral` | Envia mensagem para a sala |
| `/mensagem time` | Envia mensagem para um time |
| `/mensagem privada` | Envia PV para jogador |
| `/mapa` | Carrega mapa por arquivo `.hbs` ou `.json` |
| `/senha` | Altera senha da sala |
| `/iniciar` / `/parar` / `/pausar` / `/despausar` / `/reiniciar` | Controle de partida |
| `/limparbans` | Limpa bans |
| `/kickrate` | Ajusta kickrate |
| `/uniforme` | Altera uniforme |

### Autocomplete

O campo `sala` recebe as salas ativas automaticamente.

Nos comandos com campo `player`, depois de escolher a sala, o Discord sugere os jogadores daquela sala no formato:

```text
[id] nome
```

Assim você escolhe o jogador direto na lista, sem precisar usar `/players` antes.

---

## Configuração

Crie o `.env` a partir do exemplo:

```bash
cp .env.example .env
```

Variáveis principais:

```env
TOKEN_BOT=
CLIENT_ID=
GUILD_ID=

ROOM1_TOKEN=
ROOM1_NAME=
ROOM1_PUBLIC=true

CAP=
SUBCAP=
JOGADOR=
ADMIN=
SENHA_PADRAO=fncpass

ADMIN_WEBHOOK=
CONFIRMACAO_WEBHOOK=
ENTRADA_WEBHOOK=
SAIDA_WEBHOOK=
MENSAGEM_WEBHOOK=
GRAVACAO_WEBHOOK=
GIFS_WEBHOOK=
SENHA_WEBHOOK=

THEHAX_TENANT=
THEHAX_APIKEY=
CHROMIUM_PATH=
```

---

## Instalação

```bash
npm install
```

---

## Execução

```bash
npm run start
```

Build:

```bash
npm run build
```

---

## Estrutura

```text
src/
  clip/        Renderização e envio de GIFs
  config/      Leitura de variáveis de ambiente
  database/    SQLite
  discord/     Bot e comandos slash
  haxball/     Comandos e módulos in-game
  room/        Inicialização e gerenciamento de salas
  utils/       Helpers
maps/          Mapas HaxBall
clips/         Replays e GIFs temporários
```

---

## Mapas

| Comando | Mapa |
|:--|:--|
| `!x3` | Futsal X3 |
| `!x4` | Futsal X4 |
| `!lvk` | LVK |
| `!rs` | Real Soccer Revolution |
| `!penal` | Penaltis |

---

## Banco de Dados

O SQLite armazena:

- cargos persistentes;
- bans;
- mutes;
- fila e status de clips.

Arquivo padrão:

```text
data.db
```

---

## Observações Operacionais

- Reinicie o bot após alterar `.env`.
- Webhooks são credenciais; não publique URLs reais.
- `clips/` é diretório operacional e não deve ser versionado.
- Use `npm run build` antes de subir alterações.
