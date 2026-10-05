import { supabase } from "@/lib/supabase";

/** Only allow same-origin relative paths (incl. query). */
export function safeNextPath(path: string | null | undefined, fallback = "/feed") {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}

export async function signInWithGoogleNext(nextPath: string) {
  const path = safeNextPath(nextPath);
  const redirectTo = `${window.location.origin}${path}`;

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}

export async function requireUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function navigateToCreateWithCategory(
  categorySlug: string,
  router: { push: (path: string) => void }
) {
  const path = `/create-activity?category=${encodeURIComponent(categorySlug)}`;
  const user = await requireUser();
  if (user) {
    router.push(path);
    return;
  }
  await signInWithGoogleNext(path);
}
