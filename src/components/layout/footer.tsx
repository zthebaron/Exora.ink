import Image from "next/image";

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
            Digital Boutique, a Division of Digital Universe
          </p>

          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Exora.ink. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
