export const Footer = () => {
  return (
    <footer className="border-t border-line py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:gap-0">
        <div className="text-base font-medium tracking-tight text-ink">
          Home Record
        </div>
        <p className="text-sm text-ink-subtle">
          Every plan, permit and receipt — verified, and yours to hand on.
        </p>
        <div className="flex gap-6">
          <a
            href="/contact"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Contact
          </a>
          <a
            href="/service-terms"
            className="text-sm text-ink-muted transition-colors hover:text-ink"
          >
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
};
