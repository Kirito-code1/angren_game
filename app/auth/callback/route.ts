import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { syncSupabaseProfileFromAuthUser } from "@/lib/auth-profile";
import { withMessage } from "@/lib/messages";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizePathParam(value: string | null, fallback: string) {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  return value;
}

function touchPaths() {
  revalidatePath("/");
  revalidatePath("/games");
  revalidatePath("/tournaments");
  revalidatePath("/teams");
  revalidatePath("/profile");
  revalidatePath("/profile/tournaments");
  revalidatePath("/admin");
  revalidatePath("/login");
  revalidatePath("/register");
}

export async function GET(request: NextRequest) {
  const sourcePath = normalizePathParam(request.nextUrl.searchParams.get("source"), "/login");
  const nextPath = normalizePathParam(request.nextUrl.searchParams.get("next"), "/profile");
  const intent = request.nextUrl.searchParams.get("intent") === "register" ? "register" : "login";
  const code = request.nextUrl.searchParams.get("code");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(withMessage(sourcePath, "error", "Вход через Google сейчас недоступен."), request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(withMessage(sourcePath, "error", "Не удалось завершить вход через Google."), request.url),
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(withMessage(sourcePath, "error", "Не удалось завершить вход через Google."), request.url),
      );
    }

    const authUser = data.user ?? (await supabase.auth.getUser()).data.user;
    const email = authUser?.email?.toLowerCase() ?? "";

    if (!authUser || !email) {
      return NextResponse.redirect(
        new URL(withMessage(sourcePath, "error", "Google не вернул email для этого аккаунта."), request.url),
      );
    }

    const nicknameHint =
      typeof authUser.user_metadata?.preferred_username === "string"
        ? authUser.user_metadata.preferred_username
        : typeof authUser.user_metadata?.full_name === "string"
          ? authUser.user_metadata.full_name
          : typeof authUser.user_metadata?.name === "string"
            ? authUser.user_metadata.name
            : email.split("@")[0];

    const syncedProfile = await syncSupabaseProfileFromAuthUser({
      authUserId: authUser.id,
      email,
      nicknameHint,
    });

    touchPaths();

    const message =
      syncedProfile.status === "created"
        ? intent === "register"
          ? "Профиль создан через Google."
          : "Аккаунт создан через Google."
        : "Вы успешно вошли через Google.";

    return NextResponse.redirect(new URL(withMessage(nextPath, "success", message), request.url));
  } catch {
    return NextResponse.redirect(
      new URL(
        withMessage(sourcePath, "error", "Не удалось завершить регистрацию через Google."),
        request.url,
      ),
    );
  }
}
