import fs from "node:fs";
import path from "node:path";
import type { Room } from "haxball-extended-room";

const WATCH_DIRS = [
  path.resolve(__dirname, "../haxball/modules"),
  path.resolve(__dirname, "../haxball/commands"),
  path.resolve(__dirname, "../discord/cogs"),
];

export class HotReloader {
  private watchers: fs.FSWatcher[] = [];
  private room: Room | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  setRoom(room: Room): void {
    this.room = room;
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

  private async refresh(): Promise<void> {
    if (!this.room) return;
    try {
      const haxballDir = path.resolve(__dirname, "../haxball");
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(haxballDir)) delete require.cache[key];
      }

      for (const mod of this.room.modules) {
        this.room.removeModule(mod.name);
      }
      for (const cmd of this.room.commands) {
        this.room.removeCommand(cmd.name);
      }

      const handler = await import("../haxball/handler");
      handler.HandleModules(this.room);
      handler.HandleCommands(this.room);

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
