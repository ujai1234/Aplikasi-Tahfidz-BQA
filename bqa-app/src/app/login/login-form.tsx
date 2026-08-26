"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Ornament } from "@/components/ui/ornament";
import { useAuth } from "@/components/providers/auth-provider";
import { errorMessage } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const usernameOrEmail = String(formData.get("username") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        if (!usernameOrEmail || !password) {
          toast.warning("Username dan password wajib diisi");
          return;
        }

        setSubmitting(true);
        try {
          const user = await login(usernameOrEmail, password);
          toast.success(
            `Assalamu'alaikum! Selamat datang kembali, ${user.nama}`
          );
          router.push("/");
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setSubmitting(false);
        }
      }}
    >
      <Field label="Username atau Email" htmlFor="username" required>
        <Input
          id="username"
          name="username"
          placeholder="mis. ahmad.fauzi"
          autoComplete="username"
          required
        />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        required
        hint="Gunakan akun terdaftar: Admin, Ustadz, Ustadzah, atau Kepala Pesantren."
      >
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted-foreground">
          <input type="checkbox" defaultChecked className="accent-primary" />
          Ingat saya
        </label>
        <button
          type="button"
          onClick={() =>
            toast.info("Silakan hubungi Admin untuk reset password akun Anda")
          }
          className="text-[12.5px] font-bold text-primary hover:underline"
        >
          Lupa password?
        </button>
      </div>
      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="w-full rounded-2xl"
      >
        {submitting ? "Memproses…" : "Masuk"}
        {!submitting && <ArrowRight className="size-4" strokeWidth={2} />}
      </Button>
      <Ornament className="pt-2" />
    </form>
  );
}
