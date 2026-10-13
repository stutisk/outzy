import Link from "next/link";
import { PAGE_CONTAINER } from "@/lib/layout";

const LINKS = [
  { href: "/feed", label: "Discover" },
  { href: "/create-activity", label: "Host a plan" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "mailto:hello@outzy.app", label: "Contact" },
] as const;

const linkClass =
  "rounded-sm text-stone-600 underline-offset-4 transition-colors hover:text-navy hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

export function LandingFooter() {
  return (
    <footer className="border-t border-black/8 bg-[#faf9f7]">
      <div
        className={`${PAGE_CONTAINER} flex flex-col items-center gap-4 py-5 sm:flex-row sm:justify-between sm:py-6`}
      >
        <Link
          href="/"
          className="text-base font-bold tracking-tight text-coral"
        >
          Outzy
        </Link>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm sm:justify-end">
            {LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
