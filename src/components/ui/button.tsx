import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[3px] text-[0.8125rem] font-medium tracking-[0.14em] uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-maroon-deep focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border border-gold/70 bg-maroon text-cream shadow-[inset_0_0_0_1px_rgba(226,192,121,0.25)] hover:bg-maroon-deep",
        outline:
          "border border-gold/50 bg-transparent text-maroon hover:border-gold hover:bg-gold/10",
        ghost: "bg-transparent text-text-dark hover:bg-brown-deep/5",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-12 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

type ButtonLinkProps = ComponentProps<"a"> & VariantProps<typeof buttonVariants>;

/** An anchor styled as a button, for navigational calls to action. */
function ButtonLink({
  className,
  variant,
  size,
  ...props
}: ButtonLinkProps) {
  return <a className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button, ButtonLink };
