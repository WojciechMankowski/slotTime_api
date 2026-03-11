import React, { useState } from "react";
import Input from "../Input";
import Select from "../Select";
import Button from "../Button";
import Label from "../Label";
import { FormProps, SlotFormData } from "../../Types/Props";

const SlotForm: React.FC<FormProps> = ({
  onSubmit,
  isLoading,
  serverError,
}) => {
  const defaultData: SlotFormData = {
    date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD dla input type="date"
    startTime: "09:00",
    endTime: "10:00",
    slotType: "INBOUND",
    quantity: 1,
  };

  const [dataForm, setFormData] = useState<SlotFormData>(defaultData);
  const [errors, setErrors] = useState<{
    [key in keyof SlotFormData]?: string;
  }>({});

  // POPRAWKA: Funkcja teraz przyjmuje wartość i opcjonalnie nazwę pola
  const handleValueChange = (value: string | number, name?: string) => {
    if (!name) return;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key in keyof SlotFormData]?: string } = {};

    if (!dataForm.date) {
      newErrors.date = "Data jest wymagana.";
    }

    if (!dataForm.startTime) {
      newErrors.startTime = "Godzina rozpoczęcia jest wymagana.";
    }

    if (!dataForm.endTime) {
      newErrors.endTime = "Godzina zakończenia jest wymagana.";
    } else if (dataForm.startTime && dataForm.startTime >= dataForm.endTime) {
      newErrors.endTime =
        "Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.";
    }

    if (!dataForm.slotType) {
      newErrors.slotType = "Typ slotu jest wymagany.";
    }

    if (!dataForm.quantity || dataForm.quantity < 1) {
      newErrors.quantity = "Liczba slotów musi być większa niż 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(dataForm);
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        Dodaj slot (pojedynczy)
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5">
            <div className="form-group w-full">
            <Label label="Data" />
            <Input
                type="date"
                name="date"
                value={dataForm.date}
                onChange={handleValueChange}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>

            <div className="form-group w-full">
            <Label label="Godzina rozpoczęcia" />
            <Input
                type="time"
                name="startTime"
                value={dataForm.startTime}
                onChange={handleValueChange}
            />
            {errors.startTime && (
                <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
            )}
            </div>

            <div className="form-group w-full">
            <Label label="Godzina zakończenia" />
            <Input
                type="time"
                name="endTime"
                value={dataForm.endTime}
                onChange={handleValueChange}
            />
            {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>

            <div className="form-group w-full">
            <Label label="Typ slotu" />
            <Select
                name="slotType"
                options={["INBOUND", "OUTBOUND", "ANY"]}
                onChange={(val) => handleValueChange(val, "slotType")}
            />
            {errors.slotType && <p className="text-red-500 text-sm mt-1">{errors.slotType}</p>}
            </div>

            <div className="form-group w-full">
            <Label label="Liczba slotów" />
            <Input
                type="number"
                name="quantity"
                value={dataForm.quantity}
                onChange={handleValueChange}
            />
            {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">{serverError}</div>
        )}

        <div className="mt-2 text-right">
          <Button type="submit" className="w-[100%] md:w-[150px] primary" text="Utwórz slot" onClick={() => {}} />
        </div>
      </form>
    </div>
  );
};

export default SlotForm;
