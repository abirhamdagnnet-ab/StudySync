import { describe, expect, it } from "@jest/globals";
import { buildContextChunks, maxChunks, wordsPerChunk } from "../src/services/contextBuilder.js";

describe("material context builder", () => {
  it("splits material into chunks of at most about 800 words", () => {
    const material = Array.from({ length: 1700 }, (_value, index) => `word${index}`).join(" ");
    const chunks = buildContextChunks(material, "word");

    expect(chunks.map((chunk) => chunk.split(/\s+/u).length)).toEqual([800, 800, 100]);
    expect(wordsPerChunk).toBe(800);
  });

  it("ranks by keyword overlap, preserves stable ties, and returns no more than three chunks", () => {
    const makeChunk = (words) => [...words, ...Array(800 - words.length).fill("filler")].join(" ");
    const chunks = [
      makeChunk(["unrelated", "background"]),
      makeChunk(["photosynthesis", "sunlight", "chlorophyll"]),
      makeChunk(["photosynthesis", "sunlight"]),
      makeChunk(["photosynthesis"]),
    ];

    const selected = buildContextChunks(chunks.join(" "), "Explain photosynthesis using sunlight and chlorophyll.");

    expect(selected).toHaveLength(maxChunks);
    expect(selected[0]).toBe(chunks[1]);
    expect(selected[1]).toBe(chunks[2]);
    expect(selected[2]).toBe(chunks[3]);
    expect(selected.reduce((total, chunk) => total + chunk.split(/\s+/u).length, 0)).toBeLessThanOrEqual(2400);
  });

  it("returns no chunks for missing or whitespace-only material", () => {
    expect(buildContextChunks(null, "question")).toEqual([]);
    expect(buildContextChunks("  \n ", "question")).toEqual([]);
  });
});