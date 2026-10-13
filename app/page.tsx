import { cookies } from "next/headers";
import { LandingGeoSync } from "@/components/landing-geo-sync";
import { LandingPageClient } from "@/components/landing-page-client";
import { parseGeoCookie } from "@/lib/geo";
import { getLandingPlans } from "@/lib/landing-get-plans";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const userLocation = parseGeoCookie(cookieStore.get("outzy_geo")?.value);

  let interests: string[] | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("interests")
      .eq("id", user.id)
      .maybeSingle();
    interests = (profile?.interests as string[] | null) ?? null;
  }

  const landing = await getLandingPlans({
    userId: user?.id ?? null,
    limit: 12,
    userLocation,
    interests,
  });

  return (
    <>
      <LandingGeoSync />
      <LandingPageClient
        landing={landing}
        initialUserId={user?.id ?? null}
      />
    </>
  );
}
