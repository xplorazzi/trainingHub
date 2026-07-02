"use client";

import { useMemo, useState } from "react";
import { ModuleCard } from "./module-card";
import { ModuleFilters, type FilterTab } from "./module-filters";
import type { ProgressStatus } from "@/lib/types";

export interface CatalogModule {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  category: string;
  durationMins: number;
  thumbnail: string | null;
  required: boolean;
  progress: { status: ProgressStatus; attemptCount: number } | null;
}

export function CatalogClient({ modules }: { modules: CatalogModule[] }) {
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return modules;
    if (filter === "my-progress") {
      return modules.filter(
        (m) =>
          m.progress?.status === "in_progress" || m.progress?.status === "failed",
      );
    }
    return modules.filter((m) => m.progress?.status === "passed");
  }, [modules, filter]);

  return (
    <div>
      <ModuleFilters active={filter} onChange={setFilter} />
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full py-12 text-center text-slate-500">
            No modules match this filter.
          </p>
        ) : (
          filtered.map((module) => <ModuleCard key={module.id} {...module} />)
        )}
      </div>
    </div>
  );
}
