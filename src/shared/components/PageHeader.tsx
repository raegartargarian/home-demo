import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /**
   * The identity line under the title — badges, dates, counts. Page-specific,
   * because a home and a section are not identified by the same facts.
   */
  meta?: React.ReactNode;
  /** The page's own action, top right. */
  actions?: React.ReactNode;
  /** `ProvenanceDetails`, below a rule. Omitted where there is nothing to prove. */
  provenance?: React.ReactNode;
  className?: string;
}

/**
 * The top of a page that opens on words rather than on a photograph.
 *
 * The homes list and a section page had each grown their own: different icon
 * tile sizes, different heading weights, one on a card and one loose on the
 * page. They are the same thing — an icon, a name, a line about it, and the
 * page's action — so they are now one component and cannot drift again.
 *
 * The vault page deliberately does not use this. Its subject is the house, so
 * its header is the photograph (`PropertyHero`); what it shares with this one
 * is `ProvenanceDetails`, which both render identically.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  description,
  meta,
  actions,
  provenance,
  className,
}) => (
  <header
    className={cn(
      "rounded-xl border border-line bg-surface-raised p-6",
      className,
    )}
  >
    <div className="flex items-start gap-4">
      {Icon && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface">
          <Icon className="h-6 w-6 text-cat" aria-hidden />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-medium tracking-tight text-ink md:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
        {meta && (
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            {meta}
          </div>
        )}
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>

    {provenance && (
      <div className="mt-5 border-t border-line pt-4">{provenance}</div>
    )}
  </header>
);

export default PageHeader;
