import { useState } from "react";
import { reserveSlot } from "../API/serviceSlot";
import { getApiError } from "../Helper/helper";
import type { Slot } from "../Types/SlotType";

export default function useReservation(onSuccess: () => void) {
  const [confirmSlot, setConfirmSlot] = useState<Slot | null>(null);
  const [requestedType, setRequestedType] = useState<"INBOUND" | "OUTBOUND">("INBOUND");
  const [reserving, setReserving] = useState(false);
  const [reserveErr, setReserveErr] = useState<string | null>(null);

  const open = (slot: Slot) => {
    setConfirmSlot(slot);
    setReserveErr(null);
    setRequestedType("INBOUND");
  };

  const close = () => setConfirmSlot(null);

  const confirm = async () => {
    if (!confirmSlot) return;
    setReserveErr(null);
    setReserving(true);
    try {
      const payload =
        confirmSlot.slot_type === "ANY" ? { requested_type: requestedType } : {};
      await reserveSlot(confirmSlot.id, payload as any);
      setConfirmSlot(null);
      onSuccess();
    } catch (err) {
      setReserveErr(getApiError(err));
    } finally {
      setReserving(false);
    }
  };

  return {
    confirmSlot,
    requestedType,
    reserving,
    reserveErr,
    open,
    close,
    confirm,
    setRequestedType,
  };
}
