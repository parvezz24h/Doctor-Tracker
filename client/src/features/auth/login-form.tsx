"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowBigUpDashIcon, CircleAlertIcon, EyeIcon, EyeOffIcon, InfoIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormField } from "@/components/shared/form-field";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginValues = z.infer<typeof loginSchema>;

/** Only allow redirects back into this app. */
function safeRedirect(target: string | null) {
  return target && target.startsWith("/") && !target.startsWith("//") ? target : "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const { error } = await authClient.signIn.email(values);
    if (error) {
      setFormError(
        error.status === 429
          ? "Too many sign-in attempts. Please wait a few minutes and try again."
          : (error.message ?? "Could not sign in. Please try again."),
      );
      return;
    }
    setRedirecting(true);
    router.replace(safeRedirect(searchParams.get("next")));
  });

  const passwordField = register("password");
  const trackCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) =>
    setCapsLock(event.getModifierState("CapsLock"));

  const sessionExpired = searchParams.get("reason") === "expired" && !formError;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {sessionExpired ? (
        <div className="flex items-start gap-2 rounded-lg border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          <InfoIcon className="mt-0.5 size-4 shrink-0" />
          Your session has expired. Please sign in again.
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="animate-content-in flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
          {formError}
        </div>
      ) : null}

      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="you@hospital.com"
          aria-invalid={Boolean(errors.email)}
          className="h-10"
          {...register("email")}
        />
      </FormField>

      <FormField id="password" label="Password" error={errors.password?.message}>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={Boolean(errors.password)}
            className="h-10 pr-10"
            {...passwordField}
            onKeyDown={trackCapsLock}
            onKeyUp={trackCapsLock}
            onBlur={(event) => {
              void passwordField.onBlur(event);
              setCapsLock(false);
            }}
            aria-describedby={capsLock ? "caps-lock-warning" : undefined}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
        {capsLock ? (
          <p
            id="caps-lock-warning"
            role="status"
            className="animate-content-in flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"
          >
            <ArrowBigUpDashIcon className="size-3.5" /> Caps Lock is on
          </p>
        ) : null}
      </FormField>

      <SubmitButton pending={isSubmitting || redirecting} size="lg" className="h-10 w-full">
        {redirecting ? "Opening portal…" : "Sign in"}
      </SubmitButton>
    </form>
  );
}
