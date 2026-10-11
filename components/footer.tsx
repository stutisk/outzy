import Link from "next/link";
import { PAGE_CONTAINER } from "@/lib/layout";

type FooterProps = {
  year?: number;
};

export function Footer({ year = new Date().getFullYear() }: FooterProps) {
  return (
    <footer className="border-hairline-t bg-background">
      <div
        className={`${PAGE_CONTAINER} flex flex-col gap-6 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between`}
      >
        <Link
          href="/"
          className="font-display text-lg font-semibold text-ink"
        >
          Outzy.
        </Link>
        <p className="text-center md:flex-1">
          Made for leaving the house.
        </p>
        <div className="flex justify-center gap-6 md:justify-end">
          <Link href="#" className="hover:text-ink">
            Safety
          </Link>
          <Link href="#" className="hover:text-ink">
            Contact
          </Link>
          <span className="text-muted/80">© {year}</span>
        </div>
      </div>
    </footer>
  );
}
