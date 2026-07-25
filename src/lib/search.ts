import type { Question } from '@/models';

/**
 * Tokenize Chinese text using Intl.Segmenter (iOS 16+)
 * Falls back to character-boundary regex for older browsers
 */
export function tokenize(text: string): string[] {
  const cleaned = text.toLowerCase().trim();
  if (!cleaned) return [];

  try {
    // Try Intl.Segmenter for proper CJK word segmentation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IntlWithSegmenter = Intl as typeof Intl & { Segmenter?: new (locale: string, options: { granularity: string }) => { segment: (text: string) => Iterable<{ isWordLike: boolean; segment: string }> } };
    if (!IntlWithSegmenter.Segmenter) throw new Error('Segmenter not available');
    const segmenter = new IntlWithSegmenter.Segmenter('zh-CN', { granularity: 'word' });
    const tokens: string[] = [];
    for (const seg of segmenter.segment(cleaned)) {
      if (seg.isWordLike && seg.segment.trim()) {
        tokens.push(seg.segment.trim());
      }
    }
    if (tokens.length > 0) return [...new Set(tokens)];
  } catch {
    // fallback to regex
  }

  // Fallback: split by Chinese characters and alphanumeric groups
  const result = cleaned.match(/[一-鿿]+|[a-zA-Z0-9]+/g);
  return result ? [...new Set(result)] : [];
}

export function buildSearchIndex(questions: Question[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const q of questions) {
    const text = [q.title, q.content, q.answer, q.wrongAnswer, q.analysis, q.source, ...q.tags].join(' ');
    const tokens = tokenize(text);
    for (const token of tokens) {
      let ids = index.get(token);
      if (!ids) {
        ids = new Set();
        index.set(token, ids);
      }
      ids.add(q.id);
    }
  }
  return index;
}

export function searchIndex(
  index: Map<string, Set<string>>,
  query: string
): Set<string> {
  const tokens = tokenize(query);
  if (tokens.length === 0) return new Set();

  const results = tokens.map(t => index.get(t) ?? new Set<string>());
  // intersect all token matches
  const first = results[0];
  if (!first) return new Set();
  for (let i = 1; i < results.length; i++) {
    for (const id of first) {
      if (!results[i].has(id)) first.delete(id);
    }
  }
  return first;
}
