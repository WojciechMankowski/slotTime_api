import React from "react";

const Label = ({ label }: { label: string }) => {
    return (
        <label className="text-[0.85rem] text-(--text-muted) font-medium mb-0.5 block">{label}</label>
    );
};

export default Label;