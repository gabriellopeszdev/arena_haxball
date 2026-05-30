import fs from "node:fs";
import path from "node:path";
import type { Room } from "haxball-extended-room";

const WATCH_DIRS = [
  path.resolve(__dirname, "../haxball"),
  path.resolve(__dirname, "../discord/cogs"),
  path.resolve(__dirname, "../clip"),
];

const COGS_DIR = path.resolve(__dirname, "../discord/cogs").toLowerCase();

export class HotReloader {
  private watchers: fs.FSWatcher[] = [];
  private room: Room | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private reloadCogs: (() => Promise<void>) | null = null;

  setRoom(room: Room): void {
    this.room = room;
  }

  setReloadCogs(fn: () => Promise<void>): void {
    this.reloadCogs = fn;
  }

  start(): void {
    for (const dir of WATCH_DIRS) {
      if (!fs.existsSync(dir)) continue;
      const watcher = fs.watch(dir, { recursive: true }, () => {
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.refresh(), 300);
      });
      this.watchers.push(watcher);
    }
    console.log("🔄 Hot Reload ativo — alterações em modules/commands/cogs serão aplicadas sem reiniciar.");
  }

  private refresh(): void {
    if (!this.room) return;
    try {
      const clearPrefixes = [
        path.resolve(__dirname, "../haxball").toLowerCase(),
        path.resolve(__dirname, "../clip").toLowerCase(),
        COGS_DIR,
      ];
      for (const key of Object.keys(require.cache)) {
        const lower = key.toLowerCase();
        if (clearPrefixes.some((p) => lower.startsWith(p))) {
          delete require.cache[key];
        }
      }

      for (const mod of this.room.modules) {
        this.room.removeModule(mod.name);
      }
      for (const cmd of this.room.commands) {
        this.room.removeCommand(cmd.name);
      }

      const handler = require("../haxball/handler") as typeof import("../haxball/handler");
      handler.SetRoomMessages(this.room);
      handler.HandleModules(this.room);
      handler.HandleCommands(this.room);

      if (this.reloadCogs) {
        this.reloadCogs().catch((err: unknown) => console.error("❌ Erro ao recarregar cogs:", err));
      }

      console.log(`🔄 Hot Reload aplicado (${new Date().toLocaleTimeString()})`);
    } catch (err) {
      console.error("❌ Erro no Hot Reload:", err);
    }
  }

  stop(): void {
    for (const w of this.watchers) {
      w.close();
    }
    this.watchers = [];
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
