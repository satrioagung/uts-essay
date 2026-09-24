import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, children, tone = "neutral" }: { className?: string; children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "brand" }) {
  const tones = { neutral: "bg-[#f1f3f7] text-muted", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-danger", brand: "bg-brand-soft text-brand" };
  return <span className={cn("inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-bold", tones[tone], className)}>{children}</span>;
}
