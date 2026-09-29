const wordsPerChunk = 800;
const maxChunks = 3;
const ignoredWords = new Set([
  "about", "after", "again", "also", "and", "are", "because", "been", "before", "being",
  "between", "could", "does", "each", "from", "have", "into", "just", "more", "most",
  "other", "over", "same", "some", "such", "than", "that", "their", "them", "then",
  "there", "these", "they", "this", "those", "through", "under", "very", "what", "when",
  "where", "which", "while", "with", "would", "your",
]);

const tokenize = (text) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

const scoreChunk = (chunk, keywords) => {
  const chunkWords = new Set(tokenize(chunk));
  let score = 0;
  for (const keyword of keywords) {
    if (chunkWords.has(keyword)) score += 1;
  }
  return score;
};

const buildContextChunks = (extractedText, question) => {
  if (!extractedText?.trim()) return [];

  const keywords = new Set(tokenize(question).filter((word) => word.length > 2 && !ignoredWords.has(word)));
  const bestChunks = [];
  let words = [];
  let index = 0;

  const keepChunk = () => {
    const content = words.join(" ");
    const candidate = { content, index, score: scoreChunk(content, keywords) };
    bestChunks.push(candidate);
    bestChunks.sort((left, right) => right.score - left.score || left.index - right.index);
    if (bestChunks.length > maxChunks) bestChunks.pop();
    words = [];
    index += 1;
  };

  for (const match of extractedText.matchAll(/\S+/gu)) {
    words.push(match[0]);
    if (words.length === wordsPerChunk) keepChunk();
  }
  if (words.length) keepChunk();

  return bestChunks.map(({ content }) => content);
};

export { buildContextChunks, wordsPerChunk, maxChunks };
