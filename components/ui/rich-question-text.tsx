"use client";

import DOMPurify from "dompurify";
import { MathText } from "@/components/ui/math-text";

export function RichQuestionText({ text, className }: { text: string; className?: string }) {
  const value = String(text || "");
  if (!/<(?:p|br|strong|b|em|i|u|sup|sub|ul|ol|li|img|table|div|span)\b/i.test(value)) {
    return <MathText text={value} className={className} />;
  }
  const html = DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ["target"],
  });
  return <div className={`${className || ""} [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg [&_p]:my-2`} dangerouslySetInnerHTML={{ __html: html }} />;
}
