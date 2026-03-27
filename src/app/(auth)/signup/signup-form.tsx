"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Translations } from "@/lib/i18n/translations";

type AuthT = Translations["auth"];

export function SignupForm({ t }: { t: AuthT }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError(t.passwordMismatch); return; }
    if (password.length < 8) { setError("Min. 8 chars"); return; }
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (authError) {
      setError(authError.message.includes("already registered")
        ? t.haveAccount
        : authError.message);
      setLoading(false);
      return;
    }
    setSuccess(true); setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-4">📧</div>
        <p className="text-sm text-muted-foreground">{t.checkEmail}</p>
        <button onClick={() => router.push("/login")} className="mt-6 text-primary hover:underline font-medium text-sm">
          ← {t.loginLink}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">{t.email}</label>
        <input id="email" type="email" autoComplete="email" required value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          placeholder={t.emailPlaceholder} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">{t.password}</label>
        <input id="password" type="password" autoComplete="new-password" required value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          placeholder={t.passwordPlaceholder} />
      </div>
      <div className="space-y-1">
        <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground">{t.confirmPassword}</label>
        <input id="confirm-password" type="password" autoComplete="new-password" required value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
          placeholder={t.passwordPlaceholder} />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition">
        {loading ? t.signingUp : t.signupButton}
      </button>
    </form>
  );
}
