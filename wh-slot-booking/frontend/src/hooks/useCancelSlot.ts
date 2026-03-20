import { useState } from "react";
import { patchSlotStatus } from "../API/serviceSlot";
import { getApiError } from "../Helper/helper";

export default function useCancelSlot(onSuccess: () => void) {
  const [cancelSlotId, setCancelSlotId] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const open = (slotId: number) => {
    setCancelSlotId(slotId);
    setCancelErr(null);
  };

  const close = () => setCancelSlotId(null);

  const confirm = async () => {
    if (cancelSlotId === null) return;
    setCancelErr(null);
    setCancelling(true);
    try {
      await patchSlotStatus(cancelSlotId, "CANCELLED");
      setCancelSlotId(null);
      onSuccess();
    } catch (err) {
      setCancelErr(getApiError(err));
    } finally {
      setCancelling(false);
    }
  };

  return {
    cancelSlotId,
    cancelling,
    cancelErr,
    open,
    close,
    confirm,
  };
}