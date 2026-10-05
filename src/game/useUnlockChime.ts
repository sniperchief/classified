import { useEffect, useRef } from "react";
import { sfx } from "../lib/sound";

/** Chime once when a locked action becomes available (e.g. funds finished confirming). */
export function useUnlockChime(locked: boolean) {
  const wasLocked = useRef(locked);
  useEffect(() => {
    if (wasLocked.current && !locked) sfx.confirm();
    wasLocked.current = locked;
  }, [locked]);
}
