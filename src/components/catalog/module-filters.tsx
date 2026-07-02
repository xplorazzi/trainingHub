"use client";

import { cn } from "@/lib/utils";

export type FilterTab = "all" | "my-progress" | "completed";

export function ModuleFilters({
  active,
  onChange,
}: {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
}) {
  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All modules" },
    { key: "my-progress", label: "My progress" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="flex gap-2 border-b border-slate-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-b-2 border-brand-600 text-brand-600"
              : "text-slate-500 hover:text-slate-700",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
