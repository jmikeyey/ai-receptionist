import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("packs multiple short paragraphs into one chunk up to maxChars", () => {
    const text = "First para.\n\nSecond para.\n\nThird para.";
    const chunks = chunkText(text, 500);
    expect(chunks).toEqual(["First para.\n\nSecond para.\n\nThird para."]);
  });

  it("starts a new chunk when adding a paragraph would exceed maxChars", () => {
    const a = "A".repeat(300);
    const b = "B".repeat(300);
    const chunks = chunkText(`${a}\n\n${b}`, 500);
    expect(chunks).toEqual([a, b]);
  });

  it("hard-splits a single paragraph longer than maxChars", () => {
    const long = "x".repeat(1200);
    const chunks = chunkText(long, 500);
    expect(chunks).toEqual(["x".repeat(500), "x".repeat(500), "x".repeat(200)]);
    expect(chunks.every((c) => c.length <= 500)).toBe(true);
  });

  it("returns [] for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });
});
