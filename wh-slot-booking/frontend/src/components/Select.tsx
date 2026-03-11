import { SelectProps } from "../Types/Props";
import React from "react";

const Select = ({ options, onChange, className, disabled, name, id }: SelectProps) => {
    const mapsSelect = options.map((option, index) => (
        <option key={index} value={option}>
            {option}
        </option>
    ));
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(event.target.value);
    }
    
    return (
        <select
            onChange={handleChange}
            className={className}
            disabled={disabled}
            name={name}
            id={id?.toString() ?? name}
        >
            {mapsSelect}
        </select>
    );
};

export default Select;
    