import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export default function EmptyState({ icon, title, desc }: EmptyStateProps) {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="mx-auto mb-4 opacity-30 flex justify-center">{icon}</div>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm mt-1">{desc}</p>
    </div>
  );
}
