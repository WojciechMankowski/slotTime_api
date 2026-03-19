import { useState } from "react";
import { postNotice, NoticePayload } from "../API/serviceSlot";
import { t, Lang } from "../Helper/i18n";
import { getApiError } from "../Helper/helper";
import type { Slot } from "../Types/SlotType";

const emptyForm: NoticePayload = {
  numer_zlecenia: "",
  referencja: "",
  rejestracja_auta: "",
  rejestracja_naczepy: "",
  ilosc_palet: 1,
  kierowca_imie_nazwisko: "",
  kierowca_tel: "",
  uwagi: "",
};

export default function useNotice(lang: Lang, onSuccess: () => void) {
  const [noticeSlot, setNoticeSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState<NoticePayload>({ ...emptyForm });
  const [errors, setErrors] = useState<Partial<Record<keyof NoticePayload, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const open = (slot: Slot) => {
    setNoticeSlot(slot);
    setSubmitErr(null);
    setErrors({});
    setForm({ ...emptyForm });
  };

  const close = () => setNoticeSlot(null);

  const clearError = (field: keyof NoticePayload) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const submit = async () => {
    if (!noticeSlot) return;

    const errs: Partial<Record<keyof NoticePayload, string>> = {};
    const req = t("notice_required_field", lang);

    if (!form.numer_zlecenia.trim()) errs.numer_zlecenia = req;
    if (!form.referencja.trim()) errs.referencja = req;
    if (!form.rejestracja_auta.trim()) errs.rejestracja_auta = req;
    if (!form.rejestracja_naczepy.trim()) errs.rejestracja_naczepy = req;
    if (!form.ilosc_palet || form.ilosc_palet <= 0)
      errs.ilosc_palet = t("notice_pallets_positive", lang);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitErr(null);
    setSubmitting(true);
    try {
      await postNotice(noticeSlot.id, form);
      setNoticeSlot(null);
      onSuccess();
    } catch (err) {
      setSubmitErr(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return {
    noticeSlot,
    form,
    errors,
    submitting,
    submitErr,
    open,
    close,
    setForm,
    clearError,
    submit,
  };
}
