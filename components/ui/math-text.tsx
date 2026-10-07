import { Fragment, type ReactNode } from "react";

/** Renders simple caret notation such as 2^5 or (9^9)^5 as superscript. */
export function MathText({ text, className }: { text: string; className?: string }) {
  const lines = String(text || "").split("\n");
  return <span className={className}>{lines.map((line, index) => <Fragment key={`${index}-${line}`}>
    {renderLine(line)}
    {index < lines.length - 1 && <br />}
  </Fragment>)}</span>;
}

function renderLine(line: string): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern = /\^(\{[^{}]+\}|-?\d+(?:[a-zA-Z]+)?)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(line))) {
    if (match.index > cursor) result.push(<Fragment key={`text-${key++}`}>{line.slice(cursor, match.index)}</Fragment>);
    const exponent = match[1].startsWith("{") ? match[1].slice(1, -1) : match[1];
    result.push(<sup key={`power-${key++}`} className="relative -top-0.5 text-[0.68em] leading-none">{exponent}</sup>);
    cursor = match.index + match[0].length;
  }
  if (cursor < line.length) result.push(<Fragment key={`text-${key}`}>{line.slice(cursor)}</Fragment>);
  return result;
}
