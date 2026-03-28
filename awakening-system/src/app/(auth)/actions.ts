"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed")) {
      return { error: "EMAIL_NOT_CONFIRMED" };
    }
    if (msg.includes("invalid login") || msg.includes("invalid credentials") || msg.includes("wrong password")) {
      return { error: "Неверный email или пароль" };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function resendConfirmation(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  if (!email) return { error: "Email не указан" };
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) return { error: error.message };
  return { success: true };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { hunter_name: "Охотник" },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });

  if (error) {
    // Check by error code first (most reliable), then fall back to message matching
    const code = (error as { code?: string }).code ?? "";
    const msg = error.message.toLowerCase();
    if (
      code === "user_already_exists" ||
      code === "email_exists" ||
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      msg.includes("user already") ||
      msg.includes("already in use")
    ) {
      return { error: "EMAIL_ALREADY_EXISTS" };
    }
    return { error: error.message };
  }

  // Email confirmation ON: Supabase silently "succeeds" but returns
  // a fake user with empty identities and no session — covers confirmed emails.
  // Also covers unconfirmed emails when re-registering after initial signup attempt.
  if (!data.session && (!data.user?.identities || data.user.identities.length === 0)) {
    return { error: "EMAIL_ALREADY_EXISTS" };
  }

  // Session exists = email confirmation disabled, go straight to onboarding
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  // No session = email confirmation required, tell client to show "check email" screen
  return { confirmEmail: true };
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;

  if (!email) return { error: "Введите email" };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  if (!password || password.length < 8) {
    return { error: "Минимум 8 символов" };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete("onboarding_completed");
  revalidatePath("/", "layout");
  redirect("/login");
}
