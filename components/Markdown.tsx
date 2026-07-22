import type { ReactNode } from "react";

/* Minimal, safe markdown for assistant chat bubbles. Renders the small set the
   model actually emits — paragraphs, bullet/numbered lists, bold, italic, links —
   as React elements (never dangerouslySetInnerHTML). */

const INLINE = /(\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;
    if (match[2] !== undefined) nodes.push(<strong key={key}>{match[2]}</strong>);
    else if (match[3] !== undefined) nodes.push(<em key={key}>{match[3]}</em>);
    else if (match[4] !== undefined)
      nodes.push(
        <a key={key} href={match[5]} target="_blank" rel="noopener noreferrer">
          {match[4]}
        </a>,
      );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let b = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === "") {
      i++;
      continue;
    }

    // List block (consecutive bullet or numbered lines).
    const isBullet = /^\s*[-*]\s+/.test(line);
    const isOrdered = /^\s*\d+\.\s+/.test(line);
    if (isBullet || isOrdered) {
      const items: ReactNode[] = [];
      while (i < lines.length && (isBullet ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/).test(lines[i])) {
        const content = lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, "");
        items.push(<li key={`li-${i}`}>{renderInline(content, `li-${i}`)}</li>);
        i++;
      }
      blocks.push(
        isOrdered ? <ol key={`b-${b++}`}>{items}</ol> : <ul key={`b-${b++}`}>{items}</ul>,
      );
      continue;
    }

    // Paragraph — gather until a blank line, keeping soft breaks.
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    const key = `b-${b++}`;
    blocks.push(
      <p key={key}>
        {para.flatMap((l, idx) => {
          const rendered = renderInline(l, `${key}-${idx}`);
          return idx < para.length - 1 ? [...rendered, <br key={`br-${key}-${idx}`} />] : rendered;
        })}
      </p>,
    );
  }

  return <div className="prose-chat">{blocks}</div>;
}
