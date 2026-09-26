import { useEffect, useState } from "react";
import { isElectronRuntime } from "@/desktop/host";
import { getOmpRuntimeStatus, type OmpRuntimeStatus } from "./omp-runtime-status";

interface UseOmpRuntimeStatusResult {
  status: OmpRuntimeStatus | null;
  isLoading: boolean;
}

const IDLE_RESULT: UseOmpRuntimeStatusResult = { status: null, isLoading: false };

/** One-shot fetch of the desktop app's OMP runtime status. Only meaningful
 * inside the Electron shell -- returns idle immediately everywhere else. */
export function useOmpRuntimeStatus(): UseOmpRuntimeStatusResult {
  const [status, setStatus] = useState<OmpRuntimeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(isElectronRuntime());

  useEffect(() => {
    if (!isElectronRuntime()) {
      return undefined;
    }
    let cancelled = false;
    setIsLoading(true);
    void getOmpRuntimeStatus()
      .then((result) => {
        if (!cancelled) setStatus(result);
        return;
      })
      .catch((error: unknown) => {
        console.error("[Settings] Failed to load OMP runtime status", error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isElectronRuntime()) {
    return IDLE_RESULT;
  }
  return { status, isLoading };
}
