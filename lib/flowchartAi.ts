import { askAi, extractJson } from './aiClient';

export interface GenerateFlowchartInput {
  topic?: string;
  passage?: string;
  grammaticalStyle?: string;
  boxCount?: number;
}

export interface GeneratedFlowchart {
  title: string;
  boxes: string[];
  grammarTip: string;
}

export interface SpellCheckInput {
  title?: string;
  boxes?: string[];
}

export interface SpellCheckIssue {
  location: string;
  boxIndex: number;
  wrongWord: string;
  suggestion: string;
  reason: string;
}

export interface SpellCheckResult {
  hasErrors: boolean;
  errors: SpellCheckIssue[];
  correctedTitle: string;
  correctedBoxes: string[];
}

export interface RulesFixInput {
  title?: string;
  boxes?: string[];
  targetGrammar?: string;
}

export interface RulesFixResult {
  fixedTitle: string;
  fixedBoxes: string[];
}

const DEFAULT_GRAMMAR_STYLE = 'Present participle / gerund phrase (every box starts with a V-ing word)';

export const AI_PROVIDER_NAME = 'Shawon GPT API';

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function clampBoxCount(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 6;
  return Math.min(10, Math.max(3, Math.round(parsed)));
}

export function cleanBoxText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return capitalize(
    value
      .replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '')
      .replace(/^["'“”]+|["'“”]+$/g, '')
      .replace(/[.;,]+$/g, '')
      .trim()
  );
}

export function normalizeTitle(value: unknown, fallbackTopic: string): string {
  let title = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!title) title = fallbackTopic;

  title = title
    .replace(/^a\s+flow\s*-?\s*chart\s+showing\s*/i, '')
    .replace(/\s+is\s+given\s+below\s*:?\s*$/i, '')
    .replace(/[.:;]+$/g, '')
    .trim();

  if (!title) title = 'the given events';

  return `A flow-chart showing ${title} is given below:`;
}

function parseBoxesFromPlainText(text: string, boxCount: number): string[] {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^```/i.test(line))
    .map((line) => cleanBoxText(line))
    .filter((line) => line.length > 2)
    .filter((line) => !/flow-?chart/i.test(line));

  return lines.slice(0, boxCount);
}

function dedupeBoxes(boxes: string[], boxCount: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const box of boxes) {
    const key = box.toLowerCase();
    if (!box || seen.has(key)) continue;
    seen.add(key);
    result.push(box);
    if (result.length === boxCount) break;
  }

  return result;
}

export async function generateFlowchart(input: GenerateFlowchartInput): Promise<GeneratedFlowchart> {
  const topic = (input.topic || '').trim();
  const passage = (input.passage || '').trim();
  const grammarStyle = (input.grammaticalStyle || DEFAULT_GRAMMAR_STYLE).trim();
  const boxCount = clampBoxCount(input.boxCount);

  if (!topic && !passage) {
    throw new Error('Provide a topic or a passage to generate a flowchart.');
  }

  const prompt = `You are an expert examiner for Bangladesh HSC English 1st Paper, Question No. 2 (Flow Chart).
Create one standard Bangladesh Board exam flowchart.

Topic: ${topic || 'Extract the topic from the passage below'}
${passage ? `Passage / question context:\n${passage.slice(0, 3000)}` : ''}
Required grammar style: ${grammarStyle}
Number of boxes: exactly ${boxCount}

Strict rules:
1. The title must follow this exact form: "A flow-chart showing <short description> is given below:".
2. Produce exactly ${boxCount} boxes, in logical chronological order.
3. Each box must be a short phrase of 6 to 12 words, with the first letter capitalized and NO full stop at the end.
4. All boxes must follow the same grammatical pattern (strict parallelism with box 1).
5. Base the content only on the topic or passage provided. Do not invent unrelated events.
6. Reply with raw JSON only. No markdown fences, no explanation. Use exactly this shape:
{"title":"A flow-chart showing ... is given below:","boxes":["...","...","...","...","...","..."],"grammarTip":"one short sentence about the grammar pattern used"}`;

  const raw = await askAi(prompt, { timeoutMs: 50_000, attempts: 2 });
  const parsed = extractJson<Record<string, unknown>>(raw);

  let boxes: string[] = [];
  if (parsed && Array.isArray(parsed.boxes)) {
    boxes = (parsed.boxes as unknown[]).map(cleanBoxText).filter(Boolean);
  }

  if (boxes.length === 0) {
    boxes = parseBoxesFromPlainText(raw, boxCount);
  }

  boxes = dedupeBoxes(boxes, boxCount);

  if (boxes.length < 3) {
    throw new Error(
      `${AI_PROVIDER_NAME} returned an unusable flowchart. Please try again in a moment.`
    );
  }

  const title = normalizeTitle(parsed?.title, topic || 'the given events');
  const grammarTip =
    typeof parsed?.grammarTip === 'string' && parsed.grammarTip.trim()
      ? parsed.grammarTip.trim()
      : `Generated with ${AI_PROVIDER_NAME}.`;

  return { title, boxes, grammarTip };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function resolveBoxIndex(value: unknown, location: unknown, totalBoxes: number): number {
  const direct = Number(value);
  if (Number.isInteger(direct)) {
    if (direct === -1) return -1;
    // AI may answer with a 1-based index (1..6) or a 0-based index (0..5).
    if (direct >= 1 && direct <= totalBoxes) return direct - 1;
    if (direct >= 0 && direct < totalBoxes) return direct;
  }

  if (typeof location === 'string') {
    const match = location.match(/box\s*(\d+)/i);
    if (match) {
      const index = Number(match[1]) - 1;
      if (index >= 0 && index < totalBoxes) return index;
    }
    if (/title|heading/i.test(location)) return -1;
  }

  return -2;
}

export async function spellCheckFlowchart(input: SpellCheckInput): Promise<SpellCheckResult> {
  const title = (input.title || '').trim();
  const boxes = (Array.isArray(input.boxes) ? input.boxes : []).map((box) =>
    typeof box === 'string' ? box : String(box ?? '')
  );

  const numbered = boxes.map((box, index) => `${index}. ${box}`).join('\n');

  const prompt = `You are an expert English spelling and grammar checker for Bangladesh HSC exam flowcharts.
Check the heading and every box below for spelling mistakes, typos and clear grammar errors.

Heading: ${title || '(empty)'}
Boxes (the number before each line is the box index):
${numbered || '(no boxes)'}

Rules:
1. Report only real spelling mistakes, typos or grammar errors. Do not report style preferences.
2. Only report a single incorrect word or short incorrect fragment per issue.
3. boxIndex must be the numeric index shown above, or -1 when the error is in the heading.
4. If a word is already correct, do not report it.
5. Reply with raw JSON only, no markdown fences, no explanation, using exactly this shape:
{"hasErrors":true,"errors":[{"location":"Box 1","boxIndex":0,"wrongWord":"wrong word exactly as written","suggestion":"correct word","reason":"short reason"}]}
6. If nothing is wrong reply exactly:
{"hasErrors":false,"errors":[]}`;

  const raw = await askAi(prompt, { timeoutMs: 45_000, attempts: 2 });
  const parsed = extractJson<Record<string, unknown>>(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`${AI_PROVIDER_NAME} returned an unexpected spell-check response.`);
  }

  const rawIssues = Array.isArray(parsed.errors) ? (parsed.errors as unknown[]) : [];
  const errors: SpellCheckIssue[] = [];
  const seen = new Set<string>();

  for (const item of rawIssues) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const wrongWord = typeof record.wrongWord === 'string' ? record.wrongWord.trim() : '';
    const suggestion = typeof record.suggestion === 'string' ? record.suggestion.trim() : '';
    if (!wrongWord || !suggestion || wrongWord.toLowerCase() === suggestion.toLowerCase()) continue;

    const boxIndex = resolveBoxIndex(record.boxIndex, record.location, boxes.length);
    if (boxIndex < -1) continue;

    const key = `${boxIndex}:${wrongWord.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);

    errors.push({
      location:
        boxIndex === -1
          ? 'Title'
          : `Box ${boxIndex + 1}`,
      boxIndex,
      wrongWord,
      suggestion,
      reason: typeof record.reason === 'string' && record.reason.trim() ? record.reason.trim() : 'Spelling mistake',
    });
  }

  let correctedTitle = title;
  const correctedBoxes = [...boxes];

  for (const issue of errors) {
    const pattern = new RegExp(`\\b${escapeRegExp(issue.wrongWord)}\\b`, 'gi');
    if (issue.boxIndex === -1) {
      correctedTitle = correctedTitle.replace(pattern, issue.suggestion);
    } else if (issue.boxIndex >= 0 && issue.boxIndex < correctedBoxes.length) {
      correctedBoxes[issue.boxIndex] = correctedBoxes[issue.boxIndex].replace(pattern, issue.suggestion);
    }
  }

  // Drop issues the AI reported but whose text cannot be found in the chart.
  const verifiedErrors = errors.filter((issue) => {
    if (issue.boxIndex === -1) {
      return new RegExp(`\\b${escapeRegExp(issue.wrongWord)}\\b`, 'i').test(title);
    }
    const source = boxes[issue.boxIndex] || '';
    return new RegExp(`\\b${escapeRegExp(issue.wrongWord)}\\b`, 'i').test(source);
  });

  return {
    hasErrors: verifiedErrors.length > 0,
    errors: verifiedErrors,
    correctedTitle,
    correctedBoxes,
  };
}

export async function fixFlowchartRules(input: RulesFixInput): Promise<RulesFixResult> {
  const title = (input.title || '').trim();
  const boxes = (Array.isArray(input.boxes) ? input.boxes : []).map((box) =>
    typeof box === 'string' ? box : String(box ?? '')
  );
  const targetGrammar = (input.targetGrammar || DEFAULT_GRAMMAR_STYLE).trim();

  if (boxes.length === 0) {
    throw new Error('There are no boxes to fix.');
  }

  const prompt = `You are a chief examiner for Bangladesh HSC English 1st Paper, Question No. 2 (Flow Chart).
Rewrite the flowchart below so that it strictly follows NCTB board rules.

Current heading: ${title || '(empty)'}
Current boxes:
${boxes.map((box, index) => `${index}. ${box}`).join('\n')}
Target grammatical pattern: ${targetGrammar}

Rules to enforce:
1. The heading must be exactly: "A flow-chart showing <topic> is given below:" with a trailing colon.
2. Keep exactly ${boxes.length} boxes, in the same order and with the same meaning.
3. Every box must be a short note or phrase of 5 to 12 words. Never a full sentence.
4. Remove leading subject pronouns (He, She, They, It, We) from every box.
5. All boxes must strictly follow the target grammatical pattern, exactly matching box 1.
6. No full stop or period at the end of a box. Capitalize the first letter of each box.
7. Do not add commentary, numbering or extra text inside the box strings.

Reply with raw JSON only, no markdown fences, using exactly this shape:
{"fixedTitle":"A flow-chart showing ... is given below:","fixedBoxes":["...","...","..."]}`;

  const raw = await askAi(prompt, { timeoutMs: 45_000, attempts: 2 });
  const parsed = extractJson<Record<string, unknown>>(raw);

  if (!parsed || !Array.isArray(parsed.fixedBoxes)) {
    throw new Error(`${AI_PROVIDER_NAME} returned an unexpected rule-fix response.`);
  }

  const fixedBoxes = (parsed.fixedBoxes as unknown[])
    .map(cleanBoxText)
    .filter(Boolean)
    .slice(0, boxes.length);

  if (fixedBoxes.length !== boxes.length) {
    throw new Error(`${AI_PROVIDER_NAME} returned an incomplete rule fix.`);
  }

  return {
    fixedTitle: normalizeTitle(parsed.fixedTitle, title || 'the given events'),
    fixedBoxes,
  };
}
