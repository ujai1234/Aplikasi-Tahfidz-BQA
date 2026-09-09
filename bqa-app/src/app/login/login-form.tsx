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
import { signIn } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      toast.error("Gagal memulai login dengan Google");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        disabled={googleLoading || submitting}
        onClick={handleGoogleLogin}
        className="w-full rounded-xl py-6 font-bold shadow-sm border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-emerald-500/30 transition-all flex items-center justify-center gap-3 relative overflow-hidden group cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {googleLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        <span className="text-slate-700 dark:text-slate-200">Lanjutkan dengan Google</span>
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-semibold">Atau login manual</span>
        </div>
      </div>

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
          disabled={submitting || googleLoading}
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
    </div>
  );
}
