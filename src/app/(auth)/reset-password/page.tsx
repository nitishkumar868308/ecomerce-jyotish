"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useResetPassword } from "@/services/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Lock, CheckCircle } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import Link from "next/link";
import { ROUTES } from "@/config/routes";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    resetPassword.mutate({ token, password });
  };

  if (resetPassword.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-success-light)]">
            <CheckCircle className="h-8 w-8 text-[var(--accent-success)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Password Reset!</h1>
          <p className="text-[var(--text-muted)] mb-6">Your password has been reset successfully. You can now login.</p>
          <Link href={ROUTES.HOME}><Button>Go to Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-primary)] px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-lg)]">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{APP_NAME}</h1>
            <p className="mt-2 text-[var(--text-muted)]">Set your new password</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} required fullWidth />
            <Input label="Confirm Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} leftIcon={<Lock className="h-4 w-4" />} error={error} required fullWidth />
            <Button type="submit" fullWidth loading={resetPassword.isPending}>Reset Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
