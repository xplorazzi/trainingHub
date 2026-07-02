"use client";

import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AdminQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AdminModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  passThreshold: number;
  durationMins: number;
  category: string;
  maxAttempts: number;
  questions: AdminQuestion[];
}

export function AdminModulesClient({ modules }: { modules: AdminModule[] }) {
  const [items, setItems] = useState(modules);
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<string | null>(
    modules[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");

  async function saveModule(id: string) {
    const item = items.find((m) => m.id === id);
    if (!item) return;

    setSaving(id);
    setMessage("");
    const res = await fetch(`/api/admin/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: item.title,
        description: item.description,
        videoUrl: item.videoUrl,
        thumbnail: item.thumbnail,
        passThreshold: item.passThreshold,
        durationMins: item.durationMins,
        category: item.category,
        maxAttempts: item.maxAttempts,
        questions: item.questions,
      }),
    });

    setSaving(null);
    if (res.ok) {
      setMessage(`Saved "${item.title}" — module settings, image, and questions updated.`);
    } else {
      setMessage("Failed to update module. Are you signed in as admin?");
    }
  }

  function updateField(
    id: string,
    field: keyof Omit<AdminModule, "id" | "questions">,
    value: string | number,
  ) {
    setItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  }

  function updateQuestion(
    moduleId: string,
    questionId: string,
    field: keyof AdminQuestion,
    value: string | number,
  ) {
    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        return {
          ...m,
          questions: m.questions.map((q) => {
            if (q.id !== questionId) return q;
            if (field === "options") {
              const options = String(value)
                .split("|")
                .map((o) => o.trim())
                .filter(Boolean);
              return { ...q, options };
            }
            return { ...q, [field]: value };
          }),
        };
      }),
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {message && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>
      )}
      {items.map((module) => (
        <Card key={module.id}>
          <CardHeader>
            <CardTitle>{module.title}</CardTitle>
            <p className="text-sm text-slate-500">{module.questions.length} questions</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={module.title}
                  onChange={(e) => updateField(module.id, "title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={module.category}
                  onChange={(e) => updateField(module.id, "category", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Input
                  value={module.description}
                  onChange={(e) => updateField(module.id, "description", e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Catalog thumbnail image URL</Label>
                <Input
                  value={module.thumbnail}
                  placeholder="https://... (direct image link)"
                  onChange={(e) => updateField(module.id, "thumbnail", e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Paste a direct image URL (e.g. from your site, CDN, or product photo). Amazon
                  image URLs often block hotlinking — prefer Unsplash or your own hosted image.
                </p>
                {module.thumbnail && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                    <Image
                      src={module.thumbnail}
                      alt="Thumbnail preview"
                      width={400}
                      height={225}
                      className="h-32 w-full object-cover"
                      unoptimized
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Video URL (YouTube embed)</Label>
                <Input
                  value={module.videoUrl}
                  placeholder="https://www.youtube.com/embed/..."
                  onChange={(e) => updateField(module.id, "videoUrl", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Pass threshold (%)</Label>
                <Input
                  type="number"
                  value={module.passThreshold}
                  onChange={(e) =>
                    updateField(module.id, "passThreshold", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Max attempts</Label>
                <Input
                  type="number"
                  value={module.maxAttempts}
                  onChange={(e) =>
                    updateField(module.id, "maxAttempts", Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Duration (mins)</Label>
                <Input
                  type="number"
                  value={module.durationMins}
                  onChange={(e) =>
                    updateField(module.id, "durationMins", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left font-medium text-slate-900"
                onClick={() =>
                  setExpandedQuestions(
                    expandedQuestions === module.id ? null : module.id,
                  )
                }
              >
                <span>MCQ questions ({module.questions.length})</span>
                <span className="text-sm text-brand-600">
                  {expandedQuestions === module.id ? "Hide" : "Show & edit"}
                </span>
              </button>

              {expandedQuestions === module.id && (
                <div className="mt-4 space-y-6">
                  {module.questions.map((q, index) => (
                    <div
                      key={q.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="mb-3 text-sm font-medium text-slate-700">
                        Question {index + 1}
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label>Question text</Label>
                          <Input
                            value={q.text}
                            onChange={(e) =>
                              updateQuestion(module.id, q.id, "text", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer options (separate with | )</Label>
                          <Input
                            value={q.options.join(" | ")}
                            onChange={(e) =>
                              updateQuestion(module.id, q.id, "options", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Correct option index (0 = first, 1 = second, …)</Label>
                          <Input
                            type="number"
                            min={0}
                            max={q.options.length - 1}
                            value={q.correctIndex}
                            onChange={(e) =>
                              updateQuestion(
                                module.id,
                                q.id,
                                "correctIndex",
                                Number(e.target.value),
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Explanation (shown after quiz)</Label>
                          <Input
                            value={q.explanation}
                            onChange={(e) =>
                              updateQuestion(module.id, q.id, "explanation", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button onClick={() => saveModule(module.id)} disabled={saving === module.id}>
              {saving === module.id ? "Saving…" : "Save module & questions"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
