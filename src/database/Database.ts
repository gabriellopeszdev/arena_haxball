import Database from "better-sqlite3";
import path from "node:path";

const DB_PATH = path.resolve(__dirname, "../../data.db");

const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      ip TEXT NOT NULL,
      auth TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jogador', 'capitao', 'sub-capitao', 'administrador')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (ip, auth)
    );

    CREATE TABLE IF NOT EXISTS bans (
      ip TEXT NOT NULL,
      auth TEXT NOT NULL,
      name TEXT NOT NULL,
      banned_by TEXT,
      reason TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (ip, auth)
    );

    CREATE TABLE IF NOT EXISTS mutes (
      ip TEXT NOT NULL,
      auth TEXT NOT NULL,
      name TEXT NOT NULL,
      muted_by TEXT,
      reason TEXT DEFAULT '',
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (ip, auth)
    );

    CREATE TABLE IF NOT EXISTS clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_name TEXT NOT NULL,
      player_name TEXT,
      duration INTEGER NOT NULL,
      comment TEXT DEFAULT '',
      file_path TEXT,
      webhook_url TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','done','failed')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_roles_auth ON roles(auth);
    CREATE INDEX IF NOT EXISTS idx_bans_auth ON bans(auth);
    CREATE INDEX IF NOT EXISTS idx_mutes_expires ON mutes(expires_at);
  `);

  migrateRolesAdminCheck();
}

function migrateRolesAdminCheck(): void {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'roles'").get() as { sql: string } | undefined;
  if (!row || row.sql.includes("'administrador'")) return;

  db.exec(`
    ALTER TABLE roles RENAME TO roles_old;

    CREATE TABLE roles (
      ip TEXT NOT NULL,
      auth TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('jogador', 'capitao', 'sub-capitao', 'administrador')),
      created_at INTEGER NOT NULL DEFAULT (unixepoch()),
      PRIMARY KEY (ip, auth)
    );

    INSERT OR REPLACE INTO roles (ip, auth, name, role, created_at)
    SELECT ip, auth, name, role, created_at
    FROM roles_old
    WHERE role IN ('jogador', 'capitao', 'sub-capitao', 'administrador');

    DROP TABLE roles_old;
  `);
}

export const rolesDb = {
  findByAuth(auth: string) {
    return db.prepare("SELECT * FROM roles WHERE auth = ?").get(auth) as { ip: string; auth: string; name: string; role: string } | undefined;
  },
  findByIp(ip: string) {
    return db.prepare("SELECT * FROM roles WHERE ip = ?").get(ip) as { ip: string; auth: string; name: string; role: string } | undefined;
  },
  upsert(ip: string, auth: string, name: string, role: string) {
    db.prepare("INSERT OR REPLACE INTO roles (ip, auth, name, role) VALUES (?, ?, ?, ?)").run(ip, auth, name, role);
  },
  removeByAuth(auth: string) {
    db.prepare("DELETE FROM roles WHERE auth = ?").run(auth);
  },
  removeByIp(ip: string) {
    db.prepare("DELETE FROM roles WHERE ip = ?").run(ip);
  },
};

export const bansDb = {
  find(auth: string, ip: string) {
    return db.prepare("SELECT * FROM bans WHERE auth = ? OR ip = ?").get(auth, ip) as { ip: string; auth: string; name: string } | undefined;
  },
  insert(ip: string, auth: string, name: string, bannedBy?: string, reason?: string) {
    db.prepare("INSERT OR IGNORE INTO bans (ip, auth, name, banned_by, reason) VALUES (?, ?, ?, ?, ?)").run(ip, auth, name, bannedBy ?? "", reason ?? "");
  },
  getAll() {
    return db.prepare("SELECT * FROM bans").all() as { ip: string; auth: string; name: string }[];
  },
  clear() {
    return db.prepare("DELETE FROM bans").run();
  },
};

export const mutesDb = {
  findActive(auth: string, ip: string) {
    return db.prepare("SELECT * FROM mutes WHERE (auth = ? OR ip = ?) AND expires_at > unixepoch()").get(auth, ip) as { ip: string; auth: string; name: string; muted_by: string; reason: string; expires_at: number } | undefined;
  },
  insert(ip: string, auth: string, name: string, mutedBy: string, expiresAt: number, reason?: string) {
    db.prepare("INSERT OR REPLACE INTO mutes (ip, auth, name, muted_by, reason, expires_at) VALUES (?, ?, ?, ?, ?, ?)").run(ip, auth, name, mutedBy, reason ?? "", expiresAt);
  },
  remove(auth: string, ip: string) {
    db.prepare("DELETE FROM mutes WHERE auth = ? AND ip = ?").run(auth, ip);
  },
  cleanExpired() {
    db.prepare("DELETE FROM mutes WHERE expires_at <= unixepoch()").run();
  },
  getAllActive() {
    return db.prepare("SELECT * FROM mutes WHERE expires_at > unixepoch()").all() as { ip: string; auth: string; name: string; muted_by: string; reason: string; expires_at: number }[];
  },
};

export const clipsDb = {
  insert(roomName: string, playerName: string, duration: number, comment: string) {
    return db.prepare("INSERT INTO clips (room_name, player_name, duration, comment) VALUES (?, ?, ?, ?)").run(roomName, playerName, duration, comment);
  },
  updateStatus(id: number, status: string, filePath?: string) {
    if (filePath) {
      db.prepare("UPDATE clips SET status = ?, file_path = ? WHERE id = ?").run(status, filePath, id);
    } else {
      db.prepare("UPDATE clips SET status = ? WHERE id = ?").run(status, id);
    }
  },
  getNextPending() {
    return db.prepare("SELECT * FROM clips WHERE status = 'pending' ORDER BY id ASC LIMIT 1").get() as { id: number; room_name: string; player_name: string; duration: number; comment: string } | undefined;
  },
};

export default db;
