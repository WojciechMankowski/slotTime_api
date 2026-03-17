import React, { useState } from "react";
import { Lang, t } from "../Helper/i18n";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";
import Select from "./Select";

interface Props {
  lang: Lang;
  startOd: string;
  endDo: string;
  onChange: (start: string, end: string) => Promise<void>;
  setStartOd: (start: string) => void;
  setEndDo: (end: string) => void;
  setTypeSlot: (name: string) => void;
  setStatus: (name: string) => void;
}

function FilterSlotAdmin({
  lang,
  startOd,
  endDo,
  onChange,
  setStartOd,
  setEndDo,
  setStatus,
  setTypeSlot,
}: Props) {
  return (
    <div className="flex gap-4 justify-center  items-center">
      <Label label={t('date_from', lang)} />
      <Input
        type="date"
        name="date"
        value={startOd}
        onChange={(val) => setStartOd(String(val))}
      />
      <Label label={t('date_to', lang)} />
      <Input
        type="date"
        name="date"
        value={endDo}
        onChange={(val) => setEndDo(String(val))}
      />
      <Label label={t('type', lang)} />
      <Select
        options={[
          { value: "--", label: "--" },
          { value: "OUTBOUND", label: t('outbound', lang) },
          { value: "INBOUND", label: t('inbound', lang) },
          { value: "ANY", label: t('any', lang) }
        ]}
        onChange={(val) => {
          setTypeSlot(val);
        }}
      />
      <Label label={t('status', lang)} />
      <Select
        options={[
          { value: "--", label: "--" },
          { value: "AVAILABLE", label: t('available', lang) },
          { value: "BOOKED", label: t('booked', lang) },
          { value: "APPROVED_WAITING_DETAILS", label: t('approved_waiting_details', lang) },
          { value: "RESERVED_CONFIRMED", label: t('reserved_confirmed', lang) },
          { value: "COMPLETED", label: t('completed', lang) },
          { value: "CANCELLED", label: t('cancelled', lang) },
        ]}
        onChange={(val) => {
          setStatus(val);
        }}
      />
      <Button text={t('filter_slots', lang)} onClick={() => onChange(startOd, endDo)} />
    </div>
  );
}

export default FilterSlotAdmin;
