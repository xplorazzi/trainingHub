"use client";

import { useSyncExternalStore } from "react";
import { X } from "lucide-react";

function getSnapshot() {
  return localStorage.getItem("trainhub-onboarding-seen") === "1";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

export function OnboardingBanner() {
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, () => true);

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-brand-900">Welcome to xperie.nz TrainHub</p>
          <p className="mt-1 text-sm text-brand-700">
            Pick a module, watch the video, complete the quiz, and review your results.
            Sign in to save progress and access manager tools.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            localStorage.setItem("trainhub-onboarding-seen", "1");
            window.dispatchEvent(new Event("storage"));
          }}
          className="rounded-lg p-1 text-brand-600 hover:bg-brand-100"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
