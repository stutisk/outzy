"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from("users")
          .select("username")
          .eq("id", user.id)
          .single();

        if (!profile?.username) {
          router.push("/onboarding");
        } else {
          router.push("/");
        }
      }
      setLoading(false);
    };

    getUser();
  }, [router]);

  const login = async () => {
    setAuthLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });
    } catch (error) {
      console.error("Auth error:", error);
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Loading Outzy...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-150 h-150 bg-blue-100/60 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-sky-50 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-200">
                O
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-slate-900 leading-tight">Outzy</span>
              <span className="text-[10px] font-medium text-blue-600 -mt-0.5">explore together</span>
            </div>
          </div>

          {/* Nav Links */}
          {!user && (
            <div className="hidden md:flex items-center gap-6">
              <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                How it works
              </a>
              <a href="#why-outzy" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                Why Outzy
              </a>
              <button
                onClick={login}
                disabled={authLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-lg transition-all"
              >
                Get Early Access
              </button>
            </div>
          )}

          {user ? (
            <button
              onClick={logout}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={login}
              className="md:hidden p-2 bg-slate-900 text-white rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Tag - USP instead of location */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-full">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-blue-700">
                Life's too short to explore solo
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
              Discover people
              <br />
              <span className="bg-linear-to-r from-blue-600 via-indigo-600 to-blue-800 bg-clip-text text-transparent">
                to explore with
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg md:text-xl text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Find curated adventures, local experiences, and build genuine{" "}
              <span className="font-semibold text-slate-900">friendships</span> through
              exploring the world together.
            </p>

            {/* Key Benefits */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              {[
                { emoji: "🗺️", text: "Curated adventures" },
                { emoji: "🤝", text: "Small groups" },
                { emoji: "🧭", text: "Local guides" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm"
                >
                  <span>{item.emoji}</span>
                  <span className="text-sm font-medium text-slate-700">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA or User Info */}
            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <div className="flex items-center gap-3 bg-white border-2 border-blue-200 px-5 py-3 rounded-2xl shadow-lg">
                  {user.user_metadata.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.user_metadata.full_name}
                      className="w-10 h-10 rounded-full ring-2 ring-blue-200"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-linear-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white">
                      👤
                    </div>
                  )}
                  <span className="font-bold text-slate-900">
                    Hey, {user.user_metadata.full_name?.split(" ")[0]}! 👋
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={login}
                disabled={authLoading}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-xl">🧭</span>
                    Get Early Access
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Visual - Travel-themed */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Floating Cards - Adventure Themed */}
              <div className="absolute top-10 left-0 bg-white border-2 border-blue-100 rounded-3xl p-5 shadow-xl -rotate-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">🏔️</div>
                  <div>
                    <p className="font-bold text-slate-900">Sunrise Hike</p>
                    <p className="text-sm text-slate-500">Tom & 3 others</p>
                  </div>
                </div>
              </div>

              <div className="absolute top-40 right-0 bg-white border-2 border-indigo-100 rounded-3xl p-5 shadow-xl rotate-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">☕</div>
                  <div>
                    <p className="font-bold text-slate-900">Coffee Crawl</p>
                    <p className="text-sm text-slate-500">Hidden gems</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-20 left-10 bg-white border-2 border-sky-100 rounded-3xl p-5 shadow-xl rotate-1 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">📸</div>
                  <div>
                    <p className="font-bold text-slate-900">Photo Walk</p>
                    <p className="text-sm text-slate-500">Golden hour</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 right-10 bg-linear-to-br from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-xl -rotate-2 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🧭</div>
                  <div>
                    <p className="font-bold">Adventure awaits</p>
                    <p className="text-sm text-white/80">Join the crew</p>
                  </div>
                </div>
              </div>

              {/* Center Logo */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-28 h-28 bg-linear-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-white text-5xl shadow-2xl">
                  🌍
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works - Improved */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-slate-900">
          How It Works
        </h2>
        <p className="text-center text-slate-600 mb-12 max-w-xl mx-auto">
          Finding your adventure tribe is easy. No complicated apps, no endless swiping.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Join with Google",
              desc: "Sign up in 30 seconds using your Google account. That's it.",
              icon: "🔐",
            },
            {
              step: "02",
              title: "Find Adventures",
              desc: "Browse curated activities near you - hiking, food tours, photo walks, and more.",
              icon: "🔍",
            },
            {
              step: "03",
              title: "Request to Join",
              desc: "Send a quick request to join. Chat with the host before committing.",
              icon: "✋",
            },
            {
              step: "04",
              title: "Explore Together",
              desc: "Meet new people, have fun, and rate your experience to help others.",
              icon: "🌟",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="relative bg-white border-2 border-slate-100 rounded-3xl p-6 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              {/* Step number */}
              <div className="absolute -top-3 -left-3 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                {item.step}
              </div>

              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.desc}
              </p>

              {/* Arrow connector */}
              {idx < 3 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 text-2xl text-slate-300 group-hover:text-blue-300 transition-colors">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Why Outzy - Dark Section */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Why Outzy? 🌎
          </h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            We built Outzy because doing things alone sucks. But bars are loud,
            dating apps aren't for friends, and Meetup is basically Craigslist.
            Outzy is new. Built for this generation. Built for real connections.
          </p>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: "✓", title: "Real people, verified profiles" },
              { icon: "✓", title: "Safe locations - landmarks, not exact addresses" },
              { icon: "✓", title: "Small groups - 2 to 8 people max" },
              { icon: "✓", title: "Chats expire after your adventure" },
              { icon: "✓", title: "Rate hosts and attendees" },
              { icon: "✓", title: "No creepers, no spam" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center gap-2 bg-white/10 px-4 py-3 rounded-xl text-left"
              >
                <span className="text-blue-400">{item.icon}</span>
                <span className="text-sm font-medium">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What Activities Can You Join? */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-slate-900">
          What Can You Join?
        </h2>
        <p className="text-center text-slate-600 mb-12 max-w-xl mx-auto">
          Literally anything involving real people in the real world. Host your own or join others.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { emoji: "🏔️", name: "Hiking", color: "bg-emerald-50 border-emerald-200" },
            { emoji: "☕", name: "Coffee", color: "bg-amber-50 border-amber-200" },
            { emoji: "🚴", name: "Cycling", color: "bg-orange-50 border-orange-200" },
            { emoji: "🌊", name: "Beaches", color: "bg-sky-50 border-sky-200" },
            { emoji: "🍜", name: "Food Tours", color: "bg-red-50 border-red-200" },
            { emoji: "📸", name: "Photo Walks", color: "bg-violet-50 border-violet-200" },
            { emoji: "🎨", name: "Museums", color: "bg-fuchsia-50 border-fuchsia-200" },
            { emoji: "💃", name: "Dance", color: "bg-pink-50 border-pink-200" },
            { emoji: "🏃", name: "Running", color: "bg-rose-50 border-rose-200" },
            { emoji: "🎮", name: "Gaming", color: "bg-indigo-50 border-indigo-200" },
            { emoji: "🧘", name: "Yoga", color: "bg-teal-50 border-teal-200" },
            { emoji: "🥂", name: "Nightlife", color: "bg-slate-50 border-slate-200" },
          ].map((activity, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border-2 text-center hover:scale-105 transition-all cursor-pointer hover:shadow-lg ${activity.color}`}
            >
              <div className="text-3xl mb-2">{activity.emoji}</div>
              <p className="font-semibold text-slate-800">{activity.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      {!user && (
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="bg-linear-to-br from-blue-600 to-indigo-600 rounded-[2.5rem] p-10 md:p-14 text-white shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Ready to explore?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-md mx-auto">
              Don't explore alone. Join early and be the first to discover
              amazing adventures in your area.
            </p>
            <button
              onClick={login}
              disabled={authLoading}
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-white text-blue-600 font-bold text-xl rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {authLoading ? (
                <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-2xl">🧭</span>
                  Join Early Access
                </>
              )}
            </button>
            <p className="text-white/70 text-sm mt-4">
              Free • Google sign-in • Takes 30 seconds
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm font-medium">
            © 2025 Outzy. Explore the world. 🌍
          </p>
        </div>
      </footer>
    </main>
  );
}