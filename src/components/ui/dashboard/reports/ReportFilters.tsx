"use client";

import { useState } from "react";
import {
  FiCalendar,
  FiChevronDown,
  FiDownload,
  FiFilter,
} from "react-icons/fi";

interface ReportFiltersProps {
  period: string;
  onPeriodChange: (period: string) => void;
  onCustomRangeChange: (range: { start: string; end: string }) => void;
  onExport: (type: "pdf" | "csv") => void;
  reportType: string;
  isLoading?: boolean;
}

export default function ReportFilters({
  period,
  onPeriodChange,
  onCustomRangeChange,
  onExport,
  reportType,
  isLoading = false,
}: ReportFiltersProps) {
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [open, setOpen] = useState(false);

  const handleExport = (type: "pdf" | "csv") => {
    onExport(type);
    setOpen(false); // close dropdown after export
  };

  const periods = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year", label: "This Year" },
    { value: "last_week", label: "Last Week" },
    { value: "last_month", label: "Last Month" },
    { value: "last_year", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
  ];

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onPeriodChange(value);
    setShowCustomRange(value === "custom");
  };

  const applyCustomRange = () => {
    if (customStart && customEnd) {
      onCustomRangeChange({ start: customStart, end: customEnd });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6 border border-gray-100 dark:border-gray-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiFilter className="text-gray-400" />
            </div>
            <select
              id="period"
              value={period}
              onChange={handlePeriodChange}
              className="pl-10 pr-8 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer"
              disabled={isLoading}
            >
              {periods.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <FiChevronDown className="text-gray-400" />
            </div>
          </div>

          {showCustomRange && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
              <div className="flex items-center gap-2">
                <FiCalendar className="text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Custom Range:
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  disabled={isLoading}
                />
                <span className="self-center text-gray-500 dark:text-gray-400">
                  to
                </span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                  disabled={isLoading}
                />
                <button
                  onClick={applyCustomRange}
                  className="bg-blue-500 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  disabled={isLoading}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative inline-block text-left">
          <button
            onClick={() => setOpen(!open)}
            className="bg-blue-500 cursor-pointer text-white px-4 py-2.5 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
            disabled={isLoading}
          >
            <FiDownload size={16} />
            Export
            <FiChevronDown size={16} className="ml-1" />
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 overflow-hidden">
              <button
                onClick={() => handleExport("csv")}
                className="w-full cursor-pointer text-left px-4 py-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                <FiDownload className="text-emerald-500" size={16} />
                CSV
              </button>
              <button
                onClick={() => handleExport("pdf")}
                className="w-full cursor-pointer text-left px-4 py-2 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                disabled={isLoading}
              >
                <FiDownload className="text-rose-500" size={16} />
                PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
