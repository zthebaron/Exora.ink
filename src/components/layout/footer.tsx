import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Image
            src="https://exora.ink/wp-content/uploads/2025/03/logo_exora-ink-light@2x.png"
            alt="Exora.ink"
            width={120}
            height={34}
            className="h-7 w-auto dark:hidden"
          />
          <Image
            src="https://exora.ink/wp-content/uploads/2025/03/logo_exora-ink-dark@2x.png"
            alt="Exora.ink"
            width={120}
            height={34}
            className="hidden h-7 w-auto dark:block"
          />

          <p className="max-w-xl text-sm text-muted-foreground">
            Created by Tim de Vall&eacute;e, AI Architect
            <br />
            310-453-5555 &middot;{" "}
            <a
              href="mailto:tim@digitalboutique.ai"
              className="text-primary hover:underline"
            >
              tim@digitalboutique.ai
            </a>
            <br />
            <a href="https://digitalboutique.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Boutique</a>, a Division of <a href="https://digital-universe-eight.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Digital Universe</a>
          </p>

          <Link
            href="/admin"
            className="opacity-40 transition-opacity hover:opacity-70"
            aria-label="Admin"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-current text-muted-foreground"
            >
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 2.18l7 3.89v4.43c0 4.56-3.07 8.81-7 9.95-3.93-1.14-7-5.39-7-9.95V8.07l7-3.89zm-1 4.32v5h2v-5h-2zm0 6.5v2h2v-2h-2z" />
            </svg>
          </Link>

          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Exora.ink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
