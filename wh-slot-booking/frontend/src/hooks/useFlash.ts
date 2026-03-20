import { useState, useCallback } from "react";

export default function useFlash(duration = 4000) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const flash = useCallback(
    (msg: string) => {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), duration);
    },
    [duration]
  );

  const dismiss = useCallback(() => setSuccessMsg(null), []);

  return { successMsg, flash, dismiss };
}
