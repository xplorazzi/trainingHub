import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "video" | "quiz" | "results";

const steps: { key: Step; label: string }[] = [
  { key: "video", label: "Watch" },
  { key: "quiz", label: "Quiz" },
  { key: "results", label: "Results" },
];

export function ModuleStepper({
  current,
  moduleTitle,
}: {
  current: Step;
  moduleTitle: string;
}) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="mb-6">
      <p className="text-sm text-slate-500">Training module</p>
      <h1 className="text-2xl font-bold text-slate-900">{moduleTitle}</h1>
      <div className="mt-4 flex items-center gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.key} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                  isComplete && "bg-brand-600 text-white",
                  isCurrent && "border-2 border-brand-600 text-brand-600",
                  !isComplete && !isCurrent && "bg-slate-100 text-slate-400",
                )}
              >
                {isComplete ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isCurrent ? "font-medium text-slate-900" : "text-slate-500",
                )}
              >
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className="mx-1 h-px w-8 bg-slate-200 sm:w-12" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
