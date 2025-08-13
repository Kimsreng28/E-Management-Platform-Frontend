import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
}: StatCardProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-all border border-gray-200">
      <div className="flex justify-between items-center">
        <p className="text-gray-900 font-bold text-sm">{title}</p>
        <div className="flex items-center">{icon}</div>
      </div>
      <div className="mt-8">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-gray-600 text-xs">{change}</p>
      </div>
    </div>
  );
}
