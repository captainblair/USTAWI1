"use client";

import { useRouter } from "next/navigation";
import { Building2, Eye, EyeOff, Handshake, Home, ShieldCheck } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { OtpInput, OtpResendTimer } from "@/components/auth/otp-input";
import {
  AuthDivider,
  AuthFieldError,
  AuthFieldLabel,
  AuthFooterLink,
  AuthPageHeader,
  AuthPrimaryButton,
  AuthProgressSteps,
  AuthRoleCard,
  PremiumAuthSplitLayout,
  authInputClass,
} from "@/components/auth/premium-auth-split-layout";
import { GoogleAuthProvider } from "@/components/auth/google-auth-provider";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuth } from "@/components/providers/auth-provider";
import { Input } from "@/components/ui/input";
import {
  loginWithGoogle,
  registerProfile,
  registerRole,
  registerSendOtp,
  registerVerifyOtp,
} from "@/lib/api/auth";
import { persistAuthPayload } from "@/lib/auth/persist";
import { getPostAuthRedirect, maskPhone } from "@/lib/auth/map-user";
import type { RegistrationRole } from "@/types/auth";
import { ApiRequestError } from "@/types/api";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 60;

const ROLES: {
  value: RegistrationRole;
  label: string;
  description: string;
  icon: typeof Home;
}[] = [
  { value: "TENANT", label: "Tenant", description: "Find your perfect home", icon: Home },
  { value: "LANDLORD", label: "Landlord", description: "Manage your properties", icon: Building2 },
  { value: "AGENT", label: "Agent", description: "Connect buyers & sellers", icon: Handshake },
];

type Phase = "register" | "verify";

export function RegisterWizard({ googleClientId }: { googleClientId: string }) {
  const router = useRouter();
  const { setSession } = useAuth();

  const [phase, setPhase] = useState<Phase>("register");
  const [role, setRole] = useState<RegistrationRole>("TENANT");
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(RESEND_COOLDOWN);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpError, setOtpError] = useState(false);

  async function handleGoogleSuccess(credential: string) {
    setError(null);
    setGoogleLoading(true);
    try {
      const payload = await loginWithGoogle(credential, role);
      const session = persistAuthPayload(payload);
      setSession(session);
      router.push(getPostAuthRedirect(session.user.role));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 409) {
        setError("An account with this email already exists. Try signing in with Google on the login page.");
      } else {
        setError(err instanceof ApiRequestError ? err.message : "Google sign-up failed.");
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  useEffect(() => {
    if (phase !== "verify" || resendSeconds <= 0) return;
    const t = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [phase, resendSeconds]);

  const handleResendOtp = useCallback(async () => {
    if (!registrationToken || resendSeconds > 0) return;
    setError(null);
    setLoading(true);
    try {
      const otpData = await registerSendOtp(registrationToken);
      if (otpData.dev_otp) setDevOtpHint(otpData.dev_otp);
      setResendSeconds(RESEND_COOLDOWN);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not resend code.");
    } finally {
      setLoading(false);
    }
  }, [registrationToken, resendSeconds]);

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      let token = registrationToken;
      if (!token) {
        const roleData = await registerRole(role);
        token = roleData.registration_token;
        setRegistrationToken(token);
      }

      const profile = await registerProfile({
        registration_token: token,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phoneInput.trim(),
        password,
        password_confirm: passwordConfirm,
      });
      setPhone(profile.phone);

      const otpData = await registerSendOtp(profile.registration_token);
      if (otpData.dev_otp) setDevOtpHint(otpData.dev_otp);
      setResendSeconds(RESEND_COOLDOWN);
      setPhase("verify");
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        const mapped: Record<string, string> = {};
        Object.entries(err.details).forEach(([k, v]) => {
          mapped[k] = v[0];
        });
        setFieldErrors(mapped);
        setError(err.message);
      } else {
        setError(err instanceof ApiRequestError ? err.message : "Could not create account.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    if (!registrationToken) return;

    setError(null);
    setOtpError(false);
    setLoading(true);

    try {
      const payload = await registerVerifyOtp(registrationToken, otp);
      const session = persistAuthPayload(payload);
      setSession(session);
      setVerifySuccess(true);

      await new Promise((r) => setTimeout(r, 900));
      router.push(getPostAuthRedirect(session.user.role));
      router.refresh();
    } catch (err) {
      setOtpError(true);
      setError(err instanceof ApiRequestError ? err.message : "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  }

  if (phase === "verify") {
    return (
      <PremiumAuthSplitLayout brandVariant="verify">
        <AuthProgressSteps current={2} />

        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ustawi-coral-light text-ustawi-red">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.75} />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ustawi-navy">
            Verify your phone number
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-ustawi-muted">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-ustawi-navy">{maskPhone(phone)}</span>
          </p>
        </div>

        {devOtpHint && (
          <div className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-xs text-amber-900">
            Dev mode — your code is <strong className="font-mono text-sm">{devOtpHint}</strong>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="w-full min-w-0 space-y-6">
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              setOtpError(false);
            }}
            disabled={loading || verifySuccess}
            success={verifySuccess}
            error={otpError}
          />

          {error && !verifySuccess && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          {!verifySuccess && (
            <>
              <AuthPrimaryButton disabled={loading || otp.length < 6}>
                {loading ? "Verifying…" : "Verify Account"}
              </AuthPrimaryButton>
              <OtpResendTimer
                secondsLeft={resendSeconds}
                onResend={handleResendOtp}
                loading={loading}
              />
            </>
          )}
        </form>

        <button
          type="button"
          onClick={() => {
            setPhase("register");
            setOtp("");
            setError(null);
          }}
          className="mt-8 w-full text-center text-[13px] font-medium text-ustawi-muted hover:text-ustawi-navy"
        >
          ← Edit account details
        </button>
      </PremiumAuthSplitLayout>
    );
  }

  return (
    <GoogleAuthProvider clientId={googleClientId}>
      <PremiumAuthSplitLayout brandVariant="register">
        <AuthProgressSteps current={1} />

        <AuthPageHeader
          title="Sign up for Ustawi"
          subtitle="Create your account to get started."
        />

        <GoogleSignInButton
          clientId={googleClientId}
          disabled={loading || googleLoading}
          onSuccess={handleGoogleSuccess}
          onError={(message) => setError(message)}
        />
        <p className="mb-1 text-center text-xs text-ustawi-muted">
          Choose tenant, landlord, or agent above before continuing with Google.
        </p>
        <AuthDivider label="Manual sign up" />

      <section className="mb-5 w-full min-w-0">
        <p className="mb-2 text-sm font-semibold text-ustawi-navy">I am a…</p>
        <div className="grid w-full min-w-0 grid-cols-3 gap-1.5 sm:gap-2">
          {ROLES.map(({ value, label, description, icon }) => (
            <AuthRoleCard
              key={value}
              selected={role === value}
              label={label}
              description={description}
              icon={icon}
              onClick={() => setRole(value)}
            />
          ))}
        </div>
      </section>

      <form onSubmit={handleCreateAccount} className="w-full min-w-0 space-y-4">
        <div>
          <AuthFieldLabel htmlFor="reg-name">Full Name</AuthFieldLabel>
          <Input
            id="reg-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="Jane Wanjiku"
            className={authInputClass}
          />
          <AuthFieldError message={fieldErrors.full_name} />
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div>
            <AuthFieldLabel htmlFor="reg-phone">Phone Number</AuthFieldLabel>
            <Input
              id="reg-phone"
              type="tel"
              placeholder="+254 712 345 678"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              required
              className={authInputClass}
            />
            <AuthFieldError message={fieldErrors.phone} />
          </div>
          <div>
            <AuthFieldLabel htmlFor="reg-email">Email</AuthFieldLabel>
            <Input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={authInputClass}
            />
            <AuthFieldError message={fieldErrors.email} />
          </div>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <div>
            <AuthFieldLabel htmlFor="reg-password">Password</AuthFieldLabel>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className={cn(authInputClass, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ustawi-muted hover:text-ustawi-navy"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <AuthFieldError message={fieldErrors.password} />
          </div>
          <div>
            <AuthFieldLabel htmlFor="reg-password-confirm">Confirm Password</AuthFieldLabel>
            <Input
              id="reg-password-confirm"
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
              placeholder="Repeat password"
              className={authInputClass}
            />
            <AuthFieldError message={fieldErrors.password_confirm} />
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        <AuthPrimaryButton disabled={loading}>
          {loading ? "Creating account…" : "Sign up"}
        </AuthPrimaryButton>
      </form>

      <AuthFooterLink prompt="Already have an account?" linkText="Sign in" href="/login" />
      </PremiumAuthSplitLayout>
    </GoogleAuthProvider>
  );
}
