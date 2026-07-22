/**
 * Split source text into embedding-sized chunks. Paragraphs (blank-line separated) are the
 * atomic unit: they're greedily packed into chunks up to ~maxChars, never split mid-paragraph —
 * except a single paragraph longer than maxChars, which is hard-split into maxChars pieces.
 */
export function chunkText(text: string, maxChars = 500): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current) chunks.push(current);
    current = "";
  };

  for (const paragraph of paragraphs) {
    if (paragraph.length > maxChars) {
      flush();
      for (let i = 0; i < paragraph.length; i += maxChars) {
        chunks.push(paragraph.slice(i, i + maxChars));
      }
      continue;
    }

    if (!current) {
      current = paragraph;
    } else if (current.length + 2 + paragraph.length <= maxChars) {
      current += `\n\n${paragraph}`;
    } else {
      flush();
      current = paragraph;
    }
  }

  flush();
  return chunks;
}
