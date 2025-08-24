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
      className={`p-4 rounded-lg shadow hover:shadow-lg transition-all border border-gray-200 
      bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white`}
    >
      <div className="flex justify-between items-center">
        <p className="font-bold text-lg">{title}</p>
        <div className="flex items-center">{icon}</div>
      </div>
      <div className="mt-8">
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-xs opacity-80">{change}</p>
      </div>
    </div>
  );
}
