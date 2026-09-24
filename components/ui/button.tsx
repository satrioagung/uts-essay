import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: { default: "bg-brand text-white shadow-sm hover:bg-[#423acb]", secondary: "bg-white text-ink border border-line hover:bg-canvas", ghost: "text-muted hover:bg-canvas hover:text-ink", danger: "bg-danger text-white hover:bg-[#bd4654]", soft: "bg-brand-soft text-brand hover:bg-[#e3e1ff]" },
    size: { default: "h-10 px-4", sm: "h-8 px-3 text-xs", lg: "h-11 px-5" },
  }, defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export function Button({ className, variant, size, ...props }: ButtonProps) { return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />; }
