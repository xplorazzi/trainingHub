"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const DEMO_USERS = [
  { label: "Demo Employee", email: "employee@demo.trainhub.local", password: "demo1234" },
  { label: "Demo Manager", email: "manager@demo.trainhub.local", password: "demo1234" },
  { label: "Demo Admin", email: "admin@demo.trainhub.local", password: "demo1234" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signIn(emailValue: string, passwordValue: string) {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailValue,
      password: passwordValue,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/xperie-logo.png"
          alt="xperie.nz"
          width={64}
          height={64}
          className="h-16 w-16 object-contain"
          priority
        />
        <h1 className="mt-4 text-2xl font-bold">
          Sign in to xperie<span className="text-brand-600">.nz</span> TrainHub
        </h1>
        <p className="mt-2 text-slate-600">Access your training modules and track progress</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email sign in</CardTitle>
          <CardDescription>Use your work email and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={loading}
            onClick={() => signIn(email, password)}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Demo accounts</CardTitle>
          <CardDescription>Quick access for stakeholder demos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DEMO_USERS.map((demo) => (
            <Button
              key={demo.email}
              variant="outline"
              className="w-full justify-start"
              disabled={loading}
              onClick={() => signIn(demo.email, demo.password)}
            >
              Continue as {demo.label}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
