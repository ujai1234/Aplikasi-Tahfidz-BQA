"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, User, Lock, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/providers/auth-provider";
import { errorMessage } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [submitting, setSubmitting] = useState(false);

  const handleQuickFill = (userVal: string, passVal: string) => {
    setUsername(userVal);
    setPassword(passVal);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.warning("Username dan password wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const user = await login(username, password);
      toast.success(`Assalamu'alaikum! Selamat datang kembali, ${user.nama}`);
      router.push("/");
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <form className="grid gap-4" onSubmit={handleFormSubmit}>
        <Field label="Username atau Email" htmlFor="username" required>
          <div className="relative flex items-center">
            <User className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="mis. ahmad.fauzi"
              autoComplete="username"
              className="pl-9"
              required
            />
          </div>
        </Field>
        
        <Field label="Password" htmlFor="password" required>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 size-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pl-9"
              required
            />
          </div>
        </Field>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-muted-foreground">
            <input type="checkbox" defaultChecked className="accent-[#065f46] rounded" />
            Ingat saya
          </label>
          <button
            type="button"
            onClick={() => toast.info("Silakan hubungi Admin Pesantren untuk reset password")}
            className="text-[12.5px] font-bold text-[#065f46] hover:text-[#d97706] hover:underline transition-colors"
          >
            Lupa password?
          </button>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-[#065f46] to-[#047857] hover:from-[#044e3a] hover:to-[#065f46] text-white font-bold shadow-md cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Memproses Masuk...</span>
            </>
          ) : (
            <>
              <span>Masuk Ke Aplikasi</span>
              <ArrowRight className="size-4" strokeWidth={2} />
            </>
          )}
        </Button>
      </form>

      {/* Quick Demo Persona Shortcuts */}
      <div className="pt-4 border-t border-line">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#065f46] dark:text-emerald-400 uppercase tracking-wider mb-2">
          <Sparkles className="size-3.5 text-[#d97706]" />
          <span>Akses Cepat Demo Account</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickFill("admin", "admin123")}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-[#d97706] text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("ustadz.ahmad", "ustadz123")}
            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-[#065f46] dark:text-emerald-300 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
          >
            Ustadz
          </button>
          <button
            type="button"
            onClick={() => handleQuickFill("kepala.pesantren", "kepala123")}
            className="bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border border-sky-200 dark:border-sky-800 transition-all cursor-pointer"
          >
            Mudir
          </button>
        </div>
      </div>
    </div>
  );
}
