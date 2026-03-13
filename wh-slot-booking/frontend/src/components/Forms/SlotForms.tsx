import React, { useState, useEffect } from "react";
import Input from "../Input";
import Select from "../Select";
import Button from "../Button";
import Label from "../Label";
import { FormProps, SlotFormData } from "../../Types/Props";
import { createSlot } from "../../API/serviceSlot";

const SlotForm: React.FC<FormProps> = ({
  serverError,
}) => {
  const defaultData: SlotFormData = {
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "10:00",
    slotType: "INBOUND",
    quantity: 1,
    interval: 30,
  };

  const [dataForm, setFormData] = useState<SlotFormData>(defaultData);
  const [errors, setErrors] = useState<{
    [key in keyof SlotFormData]?: string;
  }>({});
  
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
    console.log(newErrors)
    setErrors({});
    createSlot(dataForm.date, dataForm.startTime, dataForm.endTime, dataForm.slotType, dataForm.quantity, 1)
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
       Dodawanie nowych slotów
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            <div className="form-group col-span-1 md:col-span-2">
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
            <Label label="Typ" />
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
             <div className="form-group w-full">
            <Label label="Interwał (minuty)" />
            <Select
                name="interval"
                options={[30, 60, 90, 120]}
                onChange={(val) => handleValueChange(val, "interval")}
            />
            {errors.interval && <p className="text-red-500 text-sm mt-1">{errors.interval}</p>}
            </div>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">{serverError}</div>
        )}

        <div className="mt-2 text-right">
          <Button type="submit" className="w-[100%] md:w-[150px] primary" 
          text="Utwórz sloty" onClick={() => {handleSubmit}} />
        </div>
      </form>
    </div>
  );
};

export default SlotForm;
