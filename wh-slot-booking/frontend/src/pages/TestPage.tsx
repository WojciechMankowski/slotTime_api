import React, { useState } from "react";
import { Lang } from "../Helper/i18n";
import SlotForm from "../components/Forms/SlotForms";
import FilterSlotAdmin from "../components/FilertSlotAdmin";

interface Props {
  lang: Lang;
}

export default function TestPage({ lang }: Props) {
  const [startOd, setStartOd] = useState("");
  const [endDo, setEndDo] = useState("");
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
            setStartOd(start);
            setEndDo(end);
          }}
          setStartOd={setStartOd}
          setEndDo={setEndDo}
        />
      </div>
    </>
  );
}
