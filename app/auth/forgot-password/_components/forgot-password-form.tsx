"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField, FormError, FormSubmitButton } from "@/components/form";
import { useForgotPassword } from "@/hooks/use-forgot-password";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const { sendResetEmail, isLoading, error, success } = useForgotPassword();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendResetEmail(email);
  };

  if (success) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Check Your Email</h1>
        <p className="text-sm">
          If you registered using your email and password, you will receive a
          password reset email.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Reset Your Password</h1>
      <p className="text-sm">
        Type in your email and we&apos;ll send you a link to reset your
        password
      </p>
      <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormError message={error} />
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset email"}
        </FormSubmitButton>
      </form>
      <p className="text-sm text-center">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
