"use client";

const FLOAT_CARDS = [
  {
    emoji: "🏔️",
    title: "Sunshine Hike",
    pos: "top-4 left-2",
    float: "animate-float",
    delay: "0s",
  },
  {
    emoji: "☕",
    title: "Coffee & chats",
    pos: "top-8 right-0",
    float: "animate-float-slow",
    delay: "0.4s",
  },
  {
    emoji: "🎲",
    title: "Board games night",
    pos: "bottom-16 left-0",
    float: "animate-float",
    delay: "0.8s",
  },
  {
    emoji: "📸",
    title: "Photo walk",
    pos: "bottom-8 right-4",
    float: "animate-float-slow",
    delay: "1.2s",
  },
] as const;

export function LandingHeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md animate-hero-visual">
      <div
        className="absolute inset-[6%] rounded-full border border-dashed border-teal-200/60 animate-spin-slow"
        aria-hidden
      />
      <div
        className="absolute inset-[18%] rounded-full border border-stone-200/90 bg-white/40 backdrop-blur-sm"
        aria-hidden
      />
      <div
        className="absolute inset-[32%] rounded-full bg-linear-to-br from-coral-50 to-white shadow-inner ring-1 ring-teal-100/50"
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
      >
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full bg-coral text-center text-xs font-bold leading-tight text-white shadow-lg shadow-teal-900/25 ring-4 ring-white/80 animate-pulse-soft"
        >
          your
          <br />
          plans
        </div>
      </div>

      {FLOAT_CARDS.map((card) => (
        <div
          key={card.title}
          className={`absolute ${card.pos} z-20 flex items-center gap-2 rounded-2xl border border-stone-100/90 bg-white/95 px-3 py-2.5 shadow-md backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg ${card.float}`}
          style={{ animationDelay: card.delay }}
        >
          <span className="text-lg">{card.emoji}</span>
          <span className="text-xs font-semibold text-stone-800">{card.title}</span>
        </div>
      ))}
    </div>
  );
}
