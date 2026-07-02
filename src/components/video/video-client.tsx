"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { ModuleStepper } from "@/components/layout/module-stepper";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { authJsonHeaders } from "@/lib/supabase/fetch-auth";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VideoClient({
  moduleId,
  title,
  videoUrl,
  objectives,
  acknowledged,
}: {
  moduleId: string;
  title: string;
  videoUrl: string;
  objectives: string[];
  acknowledged: boolean;
}) {
  const [watched, setWatched] = useState(acknowledged);

  async function handleAcknowledge() {
    setWatched(true);
    const headers = await authJsonHeaders();
    await fetch(`/api/modules/${moduleId}/acknowledge`, {
      method: "POST",
      headers,
      credentials: "same-origin",
    });
  }

  return (
    <div>
      <ModuleStepper current="video" moduleTitle={title} />

      <div className="aspect-video overflow-hidden rounded-xl bg-black shadow-lg">
        <iframe
          src={videoUrl}
          title={title}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-brand-600" />
            Learning objectives
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {objectives.map((obj) => (
              <li key={obj} className="flex items-start gap-2 text-slate-600">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                {obj}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={watched}
            onChange={(e) => {
              if (e.target.checked) handleAcknowledge();
              else setWatched(false);
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          I have watched this video and understand the material
        </label>

        {watched ? (
          <Link
            href={`/modules/${moduleId}/quiz`}
            className={cn(buttonVariants(), "w-full sm:w-auto")}
          >
            Continue to quiz
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <Button disabled className="w-full sm:w-auto">
            Continue to quiz
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
