import { DemoEngine } from "./demoEngine";
import type { EngineMode, MissionEngine } from "./types";

const engines: Partial<Record<EngineMode, Promise<MissionEngine>>> = {};

/** One engine per mode. The live engine (and its 8MB WASM) loads only when needed. */
export function getEngine(mode: EngineMode): Promise<MissionEngine> {
  if (!engines[mode]) {
    engines[mode] =
      mode === "demo"
        ? Promise.resolve(new DemoEngine())
        : import("./liveEngine").then((m) => new m.LiveEngine());
  }
  return engines[mode]!;
}

export type * from "./types";
