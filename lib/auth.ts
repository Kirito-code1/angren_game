import { cookies } from "next/headers";
import { readStore } from "@/lib/store";
import { signSession, verifySignedSession } from "@/lib/security";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SESSION_COOKIE = "arena_session";

export async function setSession(userId: string) {
  if (isSupabaseConfigured()) {
    return;
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return;
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id ?? null;
  }

  const cookieStore = await cookies();
  const rawSession = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  if (!rawSession) {
    return null;
  }

  return verifySignedSession(rawSession);
}

export async function getCurrentUser() {
  const sessionUserId = await getSessionUserId();

  if (!sessionUserId) {
    return null;
  }

  const store = await readStore();

  if (isSupabaseConfigured()) {
    return store.users.find((user) => user.authUserId === sessionUserId) ?? null;
  }

  return store.users.find((user) => user.id === sessionUserId) ?? null;
}
