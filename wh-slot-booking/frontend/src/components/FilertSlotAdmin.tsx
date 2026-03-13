import React, { useState } from "react";
import { Lang } from "../Helper/i18n";
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
      <Label label="Od" />
      <Input
        type="date"
        name="date"
        value={startOd}
        onChange={(val) => setStartOd(String(val))}
      />
      <Label label="Do" />
      <Input
        type="date"
        name="date"
        value={endDo}
        onChange={(val) => setEndDo(String(val))}
      />
      <Label label="Typ" />
      <Select
        options={["--", "OUTBOUND", "INBOUND ", "ANY"]}
        onChange={(val) => {
          setTypeSlot(val);
        }}
      />
      <Label label="Status" />
      <Select
        options={[
          "--",
          "AVAILABLE",
          "BOOKED",
          "APPROVED_WAITING_DETAILS",
          "RESERVED_CONFIRMED",
          "COMPLETED",
          "CANCELLED",
        ]}
        onChange={(val) => {
          setStatus(val);
        }}
      />
      <Button text="Filtruj" onClick={() => onChange(startOd, endDo)} />
    </div>
  );
}

export default FilterSlotAdmin;
