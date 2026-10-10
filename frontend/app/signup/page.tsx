"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/hooks/useToast";
import { AuthShell } from "@/components/auth/AuthShell";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { Button, Input } from "@/components/ui";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const toast = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!email) nextErrors.email = "Email is required";
    if (password.length < 8) nextErrors.password = "Use at least 8 characters";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toast(error.message, "error");
      setLoading(false);
      return;
    }
    // If email confirmation is required, there is no active session yet.
    if (!data.session) {
      toast("Check your email to confirm your account.", "success");
      setLoading(false);
      return;
    }
    toast("Account created!", "success");
    router.push(next);
    router.refresh();
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start running AI-assisted interviews in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-[#4F46E5] font-semibold hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <GoogleButton next={next} />
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-[#ECE8DF]" />
        <span className="text-xs text-gray-400 font-medium">or</span>
        <div className="flex-1 h-px bg-[#ECE8DF]" />
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Recruiter"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
        />
        <Input
          type="email"
          label="Work email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          type="password"
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" loading={loading} className="w-full">
          Create account
        </Button>
      </form>
      <p className="text-xs text-gray-400 mt-4 text-center">
        By signing up you agree to our Terms and Privacy Policy.
      </p>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupForm />
    </Suspense>
  );
}
