import { FormCompanyProps } from "../../Types/Props";
import React, { useState, useEffect } from "react";
import Input from "../Input";
import Button from "../Button";
import Label from "../Label";

const AdminCreateUser = () => {
    return (
         <div className="bg-white p-6 rounded-md shadow-sm slot-form-card">
      <h2 className="text-2xl font-bold">Formularz tworzenie nowej firmy</h2>
      <form className="flex flex-col gap-6"
    //    onSubmit={}
       >
        <div className="form-group col-span-1 md:col-span-2 grid-3">
           <div className="form-group w-full">
          <Label label="Nazwa firmy" />
         
          </div>
           <div className="form-group w-full">
          <Label label="Alias (opcjonalne)" />
        
          {/* {error && <p className="text-red-500 text-sm mt-1">{error}</p>}  */}
          </div>
          <div className="mt-2 text-right">
           
          </div>
        </div>
      </form>
    </div>
    )
}

export default AdminCreateUser