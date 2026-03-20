import React from "react";
import { useSearchParams } from "react-router-dom";
import { Lang } from "../Helper/i18n";
import type { Me } from "../Types/types";
import AdminSlot from "./AdminSlot";

export default function Slots({ lang, me }: { lang: Lang; me: Me }) {
  const [params] = useSearchParams();
  const initialDate = params.get("date") ?? undefined;

  return (
    <div className="p-4 max-w-full mx-auto text-gray-800">
      <AdminSlot lang={lang} initialDate={initialDate} />
    </div>
  );
}
