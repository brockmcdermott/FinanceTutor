"use client";

import { useState } from "react";
import { FormField, FormError, FormSubmitButton } from "@/components/form";
import { useUpdatePassword } from "@/hooks/use-update-password";

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const { updatePassword, isLoading, error } = useUpdatePassword();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    await updatePassword(password);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Reset Your Password</h1>
      <p className="text-sm">Please enter your new password below.</p>
      <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
        <FormField
          label="New password"
          id="password"
          type="password"
          placeholder="New password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={error} />
        <FormSubmitButton disabled={isLoading}>
          {isLoading ? "Saving..." : "Save new password"}
        </FormSubmitButton>
      </form>
    </div>
  );
}
