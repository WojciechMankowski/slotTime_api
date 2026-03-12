import React, { useState, useEffect } from "react";
import { Lang } from "../Helper/i18n";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";
import Table from "../components/Table";
import { getSlotsAdmin } from "../API/getSlot";
import { Slot } from "../Types/SlotType";
import { getDokAdmin } from "../API/getDok";
import { DokTyp } from "../Types/DokType";
import { assignDock } from "../API/getSlot";

interface Props {
  lang: Lang;
}

export default function TestPage({ lang }: Props) {
  const now = new Date().toISOString().split("T")[0]; // "2026-03-12"
  const [startOd, setStartOd] = useState(now);
  const [endDo, setEndDo] = useState(now);
  const [slotsAdmin, setSltsAdmin] = useState<Slot[]>([]);
  const [dockAdmin, setDokAdmin] = useState<DokTyp[]>([]);

  const loadDataSlot = async (start: string, end: string) => {
    setStartOd(start);
    setEndDo(end);
    const data = await getSlotsAdmin(start, end); // użyj argumentów, nie stanu
    setSltsAdmin(data);
    const doks = await getDokAdmin();
    setDokAdmin(doks);
  };
  const onDockChange = async (slotId: number , newDock: number) => {
    const res = await assignDock(slotId, newDock)
  }

  return (
    <>
      <div className="w-[80%] mx-auto bg-white p-6 rounded-md shadow-sm mt-4">
        <SlotForm onSubmit={() => {}} isLoading={true} serverError={null} />
      </div>
      <div className="w-[80%] mx-auto bg-white p-6 rounded-md shadow-sm mt-4">
        <FilterSlotAdmin
          lang={lang}
          startOd={startOd}
          endDo={endDo}
          onChange={(start, end) => {
            // setStartOd(start);
            // setEndDo(end);
            loadDataSlot(start, end);
          }}
          setStartOd={setStartOd}
          setEndDo={setEndDo}
        />
      </div>
      <div className="w-[80%] mx-auto bg-white p-6 rounded-md shadow-sm mt-4">
        <Table
          columns={["Start", "Koniec", "Status", "Typ", "DOK", "Rezerwacja"]}
          rows={slotsAdmin} id={1} docks={dockAdmin} onDockChange={onDockChange}
        />
      </div>
    </>
  );
}
// TODO DOK -> lista rozwijana
// TODO akcja anulowania rezerwacji
