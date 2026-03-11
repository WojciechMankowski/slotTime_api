import React, { useState } from "react";
import { Lang } from "../Helper/i18n";
import Input from "./Input";
import Button from "./Button";
import Label from "./Label";

interface Props {
  lang: Lang;
  startOd: string;
  endDo: string;
  onChange: (start: string, end: string) => void;
  setStartOd: (start: string) => void;
  setEndDo: (end: string) => void;
}

function FilterSlotAdmin({ lang, startOd, endDo, onChange, setStartOd, setEndDo }: Props) {

  return (
    <div className="flex gap-4 justify-center  items-center" >
      <Label label="Od"/>
      <Input type="date" name="date" value={startOd} onChange={(val) => setStartOd(val)} />
      <Label label="Do"/>
      <Input type="date" name="date" value={endDo} onChange={(val) => setEndDo(val)} />
      <Button text="Filtruj" onClick={() => onChange(startOd, endDo)} />

    </div>
  );
}

export default FilterSlotAdmin;