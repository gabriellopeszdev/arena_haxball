import type { Room } from "haxball-extended-room";
import { HandleModules, HandleCommands } from "../haxball/handler";
import { HotReloader } from "../hot/HotReloader";

interface RoomOptions {
  roomName: string;
  maxPlayers: number;
  public: boolean;
  token: string;
  geo?: { code: string; lat: number; lon: number };
  proxy?: string;
}

export async function initializeHaxballRoom(
  HBInit: any,
  options: RoomOptions,
): Promise<Room> {
  const { Room } = await import("haxball-extended-room");

  const config: any = {
    roomName: options.roomName,
    maxPlayers: options.maxPlayers,
    public: options.public,
    token: options.token,
    noPlayer: true,
  };

  if (options.geo) config.geo = options.geo;
  if (options.proxy) config.proxy = options.proxy;

  const room = new Room(config as any, HBInit);

  room.onRoomLink = (link: string) =>
    console.log(`🔗 Link da sala ${options.roomName}: ${link}`);

  room.lockTeams();
  HandleModules(room);
  HandleCommands(room);

  const reloader = new HotReloader();
  reloader.setRoom(room);
  reloader.start();

  return room;
}
