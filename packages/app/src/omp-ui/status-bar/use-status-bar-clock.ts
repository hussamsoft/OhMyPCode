import { useEffect, useState } from "react";

/**
 * A wall-clock string that ticks on its own.
 *
 * The status bar owns this rather than having the panel pass a time down,
 * for two reasons: the panel is the heaviest component in the product and has
 * no business running a timer, and a clock is a property of the thing that
 * displays it. The interval is coarse and unmounts with the bar, so a
 * collapsed persistent chrome costs nothing.
 *
 * `enabled` is false when no `time` segment is in the active preset, so a
 * preset that omits it never schedules a tick at all.
 */
export function useStatusBarClock(enabled: boolean, intervalMs = 30_000): string | null {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!enabled) return;
    // Re-sync immediately: the value may be stale by the time the bar mounts.
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs]);

  if (!enabled) return null;
  return formatClockTime(now);
}

function formatClockTime(value: Date): string {
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Elapsed wall time on a turn, from the moment the agent went to running.
 *
 * The host has no turn-start timestamp in the agent snapshot, so the panel
 * records the transition. That is a display convenience, not accounting: it
 * is correct for turns that start while the panel is mounted and resets if
 * the panel unmounts mid-turn, which is preferable to reporting a number
 * derived from a timestamp that does not exist.
 */
export function useTurnElapsed(status: string | null | undefined, enabled: boolean): string | null {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const running = status === "running";

  useEffect(() => {
    if (running) {
      setStartedAt((previous) => previous ?? Date.now());
    } else {
      setStartedAt(null);
    }
  }, [running]);

  useEffect(() => {
    if (!enabled || startedAt === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [enabled, startedAt]);

  if (!enabled || startedAt === null) return null;
  return formatDuration(now - startedAt);
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
