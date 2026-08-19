import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import React from "react";

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /**
   * The identity line under the title — chips, dates, counts. Page-specific,
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
 * Type on the page ground, not a card. A card is a container for content, and a
 * page title is not content in a container — boxing it produced a full-width
 * bordered slab holding two lines of text, drawn in the same surface, border
 * and radius as the cards beneath it, so it read as an oversized sibling rather
 * than a header. The dashboard never did this and neither does the reference
 * app, whose own page header is a bare block with a hairline under it.
 *
 * The hairline appears only when something sits below the title inside the
 * header — provenance or actions. A title with nothing under it needs no rule
 * to separate it from the page; the space already does that.
 *
 * The vault page deliberately does not use this. Its subject is the house, so
 * its header is the photograph (`PropertyHero`).
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
  <header className={cn(provenance && "border-b border-line pb-5", className)}>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-cat-line bg-cat-surface">
            <Icon className="h-5 w-5 text-cat" aria-hidden />
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mt-3 max-w-xl text-ink-muted">{description}</p>
          )}
          {meta && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              {meta}
            </div>
          )}
        </div>
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>

    {provenance && <div className="mt-5">{provenance}</div>}
  </header>
);

export default PageHeader;
