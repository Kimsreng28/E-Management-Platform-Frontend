import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
  gradientFrom,
  gradientTo,
}: StatCardProps) {
  return (
    <div
      className={`p-4 rounded-2xl border border-gray-200 
      bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white 
      shadow-md transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] 
      hover:scale-[1.05] hover:shadow-2xl hover:brightness-110`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-semibold text-lg">{title}</p>
        </div>
        <div className="text-5xl opacity-90">{icon}</div>
      </div>

      <div className="mt-8">
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-xs opacity-80">{change}</p>
      </div>
    </div>
  );
}
