import React from "react";

interface OverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

export default function Overlay({ children, onClose }: OverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-10000 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

