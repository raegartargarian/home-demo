import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * The one button in the app.
 *
 * Every screen used to reach past this component and restate the same handful
 * of token classes inline (`bg-brand text-ink-inverse hover:bg-brand-hover`,
 * `border-line text-ink-muted hover:bg-surface-inset`), which meant the app had
 * as many button styles as it had buttons and no way to change any of them at
 * once. Those spellings now live here as variants; call sites pass a variant,
 * not a palette.
 *
 * Pill-shaped throughout, following the two elements that already set the
 * product's tone: the landing page's primary call to action and the floating
 * nav. Focus is the blueprint accent — the one place the drawing's blue appears
 * on every screen.
 *
 * Five variants, and the list is meant to stay short: a button is the primary
 * action, an equal-weight alternative to it, a quiet control, a piece of text
 * that acts, or a deletion. Anything that needs a sixth is usually not a button
 * — chips are `FilterChip`, and a clickable card is a card.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full",
    "text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        /** The primary action. Near-black on warm grey — see main.scss. */
        primary: "bg-brand text-ink-inverse shadow-sm hover:bg-brand-hover",
        /** Paired with a primary: same weight, no fill. */
        outline:
          "border border-line bg-surface-raised text-ink hover:bg-surface-inset",
        /** Quiet controls — icon buttons, and anything on another surface. */
        ghost: "text-ink-muted hover:bg-surface-inset hover:text-ink",
        /** Text that acts. No box, so it can sit inside a sentence. */
        link: "text-blueprint-ink underline-offset-4 hover:underline",
        destructive: "bg-alert text-ink-inverse shadow-sm hover:bg-alert/90",
      },
      size: {
        sm: "h-8 px-3.5 text-xs [&_svg]:size-3.5",
        default: "h-9 px-4 [&_svg]:size-4",
        lg: "h-11 px-6 text-base [&_svg]:size-4",
        icon: "h-9 w-9 [&_svg]:size-4",
        "icon-sm": "h-8 w-8 [&_svg]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
