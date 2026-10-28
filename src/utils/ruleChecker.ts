import { FlowchartConfig } from '../types';

export type GrammarPattern = 'participle' | 'infinitive' | 'past_verb' | 'noun_phrase' | 'unknown';

export interface RuleViolation {
  ruleId: string;
  ruleTitle: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  violatingIndices?: number[]; // -1 for title, 0..5 for boxes
  suggestion?: string;
}

export interface RuleAuditReport {
  overallScore: number; // 0 to 100
  totalRules: number;
  passedCount: number;
  hasErrors: boolean;
  box1Pattern: GrammarPattern;
  box1PatternLabel: string;
  rules: RuleViolation[];
  fixedTitle: string;
  fixedBoxes: string[];
}

// Common irregular verbs mapping for base -> -ing, past -> -ing, etc.
const VERB_TO_ING: Record<string, string> = {
  be: 'Being',
  is: 'Being',
  was: 'Being',
  were: 'Being',
  have: 'Having',
  has: 'Having',
  had: 'Having',
  do: 'Doing',
  did: 'Doing',
  go: 'Going',
  went: 'Going',
  gone: 'Going',
  take: 'Taking',
  took: 'Taking',
  make: 'Making',
  made: 'Making',
  get: 'Getting',
  got: 'Getting',
  give: 'Giving',
  gave: 'Giving',
  lead: 'Leading',
  led: 'Leading',
  spend: 'Spending',
  spent: 'Spending',
  restore: 'Restoring',
  restored: 'Restoring',
  place: 'Placing',
  placed: 'Placing',
  set: 'Setting',
  offer: 'Offering',
  offered: 'Offering',
  win: 'Winning',
  won: 'Winning',
  become: 'Becoming',
  became: 'Becoming',
  establish: 'Establishing',
  established: 'Establishing',
  attract: 'Attracting',
  attracted: 'Attracting',
  preserve: 'Preserving',
  preserved: 'Preserving',
  serve: 'Serving',
  served: 'Serving',
  build: 'Building',
  built: 'Building',
  found: 'Founding',
  founded: 'Founding',
  create: 'Creating',
  created: 'Creating',
  fight: 'Fighting',
  fought: 'Fighting',
  learn: 'Learning',
  learned: 'Learning',
  show: 'Showing',
  showed: 'Showing',
  help: 'Helping',
  helped: 'Helping',
  save: 'Saving',
  saved: 'Saving',
  start: 'Starting',
  started: 'Starting',
  organize: 'Organizing',
  organized: 'Organizing',
  form: 'Forming',
  formed: 'Forming',
  achieve: 'Achieving',
  achieved: 'Achieving',
  gain: 'Gaining',
  gained: 'Gaining',
  bring: 'Bringing',
  brought: 'Bringing',
  demand: 'Demanding',
  demanded: 'Demanding',
  protest: 'Protesting',
  protested: 'Protesting',
};

// Detect pattern of a phrase
export function detectGrammarPattern(phrase: string): GrammarPattern {
  const clean = phrase.trim().replace(/^[^a-zA-Z]+/, '');
  if (!clean) return 'unknown';

  const firstWord = clean.split(/\s+/)[0].toLowerCase();

  // Infinitive: starts with "to"
  if (firstWord === 'to') return 'infinitive';

  // Participle/Gerund: starts with a word ending in "ing" (and length > 3)
  if (firstWord.endsWith('ing') && firstWord.length > 3) return 'participle';

  // Past verb checks (ends in "ed", or irregular past)
  if (firstWord.endsWith('ed') || ['led', 'spent', 'won', 'built', 'gave', 'made', 'took', 'fought', 'began', 'found', 'became'].includes(firstWord)) {
    return 'past_verb';
  }

  // Prepositional/noun phrase
  if (['by', 'for', 'with', 'in', 'on', 'at', 'through', 'after', 'before', 'the', 'a', 'an'].includes(firstWord)) {
    return 'noun_phrase';
  }

  return 'unknown';
}

export function getPatternLabel(pattern: GrammarPattern): string {
  switch (pattern) {
    case 'participle':
      return 'Present Participle (starting with V-ing)';
    case 'infinitive':
      return 'Infinitive phrase (starting with "To + Verb")';
    case 'past_verb':
      return 'Past verb phrase (e.g. Founded, Led)';
    case 'noun_phrase':
      return 'Noun / Prepositional phrase (e.g. By taking...)';
    default:
      return 'Standard Note / Phrase';
  }
}

// Convert a box's leading verb into target pattern
export function convertToPattern(boxText: string, targetPattern: GrammarPattern): string {
  const trimmed = boxText.trim().replace(/\.+$/, ''); // strip full stop
  if (!trimmed) return trimmed;

  const words = trimmed.split(/\s+/);
  if (words.length === 0) return trimmed;

  const firstWord = words[0];
  const lowerFirst = firstWord.toLowerCase();
  const restOfWords = words.slice(1).join(' ');

  if (targetPattern === 'participle') {
    if (lowerFirst.endsWith('ing') && lowerFirst.length > 3) {
      return capitalize(trimmed);
    }
    if (lowerFirst === 'to' && words.length > 1) {
      const verb = words[1].toLowerCase();
      const ing = VERB_TO_ING[verb] || (verb.endsWith('e') && !verb.endsWith('ee') ? verb.slice(0, -1) + 'ing' : verb + 'ing');
      return capitalize(`${ing} ${words.slice(2).join(' ')}`);
    }
    const ing = VERB_TO_ING[lowerFirst] || (lowerFirst.endsWith('e') && !lowerFirst.endsWith('ee') ? lowerFirst.slice(0, -1) + 'ing' : lowerFirst + 'ing');
    return capitalize(`${ing} ${restOfWords}`);
  }

  if (targetPattern === 'infinitive') {
    if (lowerFirst === 'to') return capitalize(trimmed);
    if (lowerFirst.endsWith('ing') && lowerFirst.length > 4) {
      // rough strip ing: taking -> take, leading -> lead
      let base = lowerFirst.slice(0, -3);
      if (['mak', 'tak', 'restor', 'plac', 'becom', 'organiz', 'giv'].includes(base)) base += 'e';
      return `To ${base} ${restOfWords}`;
    }
    return `To ${lowerFirst} ${restOfWords}`;
  }

  return capitalize(trimmed);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function auditFlowchartRules(config: FlowchartConfig): RuleAuditReport {
  const { title = '', boxes = [] } = config;
  const rules: RuleViolation[] = [];

  // 1. Heading Check
  const trimmedTitle = title.trim();
  const lowerTitle = trimmedTitle.toLowerCase();
  const startsWithFlowchart = lowerTitle.startsWith('a flow-chart showing') || lowerTitle.startsWith('a flowchart showing');
  const endsWithColon = trimmedTitle.endsWith(':');

  if (startsWithFlowchart && endsWithColon) {
    rules.push({
      ruleId: 'rule-title',
      ruleTitle: '1. Compulsory Heading Format',
      description: 'The heading must state "A flow-chart showing ... is given below:" with a trailing colon.',
      status: 'pass',
      details: 'Heading strictly complies with Bangladesh NCTB examination standards.',
    });
  } else {
    const issues = [];
    if (!startsWithFlowchart) issues.push('Must begin with "A flow-chart showing ..."');
    if (!endsWithColon) issues.push('Must end with a colon (:)');
    rules.push({
      ruleId: 'rule-title',
      ruleTitle: '1. Compulsory Heading Format',
      description: 'The heading must state "A flow-chart showing ... is given below:" with a trailing colon.',
      status: 'fail',
      details: issues.join(' and ') + '.',
      violatingIndices: [-1],
      suggestion: 'Ensure heading begins with "A flow-chart showing" and ends with ":"',
    });
  }

  // 2. Parallelism with Box 1
  const box1 = boxes[0] || '';
  const box1Pattern = detectGrammarPattern(box1);
  const patternLabel = getPatternLabel(box1Pattern);
  const nonParallelIndices: number[] = [];

  boxes.forEach((box, idx) => {
    if (idx === 0) return;
    const pat = detectGrammarPattern(box);
    if (box1Pattern === 'participle' && pat !== 'participle') {
      nonParallelIndices.push(idx);
    } else if (box1Pattern === 'infinitive' && pat !== 'infinitive') {
      nonParallelIndices.push(idx);
    } else if (box1Pattern === 'past_verb' && pat !== 'past_verb') {
      nonParallelIndices.push(idx);
    }
  });

  if (nonParallelIndices.length === 0) {
    rules.push({
      ruleId: 'rule-parallelism',
      ruleTitle: '2. Strict Grammatical Parallelism',
      description: 'Box 1 establishes the grammatical standard (e.g. V-ing participle). All other boxes must follow.',
      status: 'pass',
      details: `All boxes uniformly follow Box 1's format: ${patternLabel}.`,
    });
  } else {
    const list = nonParallelIndices.map((i) => `Box ${i + 1}`).join(', ');
    rules.push({
      ruleId: 'rule-parallelism',
      ruleTitle: '2. Strict Grammatical Parallelism',
      description: 'Box 1 establishes the grammatical standard (e.g. V-ing participle). All other boxes must follow.',
      status: 'fail',
      details: `${list} do not match Box 1's format (${patternLabel}).`,
      violatingIndices: nonParallelIndices,
      suggestion: `Transform ${list} to start with ${box1Pattern === 'participle' ? 'V-ing (e.g. Restoring, Leading)' : 'the same grammatical form as Box 1'}.`,
    });
  }

  // 3. Short Note Format (No Finite Clauses or Full Stops)
  const fullStopIndices: number[] = [];
  const fullSentenceIndices: number[] = [];

  boxes.forEach((box, idx) => {
    const t = box.trim();
    if (t.endsWith('.')) {
      fullStopIndices.push(idx);
    }
    // Check if starting with subject pronoun (She took, He was, It is)
    if (/^(she|he|they|it|we|i)\s+[a-z]+/i.test(t)) {
      fullSentenceIndices.push(idx);
    }
  });

  if (fullStopIndices.length === 0 && fullSentenceIndices.length === 0) {
    rules.push({
      ruleId: 'rule-notes',
      ruleTitle: '3. Note Format (No Full Stops or Sentences)',
      description: 'Boxes must contain concise notes/phrases, not full sentences with subjects, and no periods at the end.',
      status: 'pass',
      details: 'All boxes are written as clean note phrases without trailing periods.',
    });
  } else {
    const issues: string[] = [];
    if (fullStopIndices.length > 0) {
      issues.push(`Trailing period found in ${fullStopIndices.map((i) => `Box ${i + 1}`).join(', ')}`);
    }
    if (fullSentenceIndices.length > 0) {
      issues.push(`Full subject clause found in ${fullSentenceIndices.map((i) => `Box ${i + 1}`).join(', ')}`);
    }
    rules.push({
      ruleId: 'rule-notes',
      ruleTitle: '3. Note Format (No Full Stops or Sentences)',
      description: 'Boxes must contain concise notes/phrases, not full sentences with subjects, and no periods at the end.',
      status: 'fail',
      details: issues.join('. ') + '.',
      violatingIndices: [...new Set([...fullStopIndices, ...fullSentenceIndices])],
      suggestion: 'Remove trailing full stops and delete explicit subject pronouns (He/She/They).',
    });
  }

  // 4. Initial Capitalization
  const uncapitalizedIndices: number[] = [];
  boxes.forEach((box, idx) => {
    const t = box.trim();
    if (t.length > 0 && t[0] !== t[0].toUpperCase()) {
      uncapitalizedIndices.push(idx);
    }
  });

  if (uncapitalizedIndices.length === 0) {
    rules.push({
      ruleId: 'rule-caps',
      ruleTitle: '4. Capitalization of First Letter',
      description: 'Every box must start with a Capital letter.',
      status: 'pass',
      details: 'All box entries begin with a capital letter.',
    });
  } else {
    rules.push({
      ruleId: 'rule-caps',
      ruleTitle: '4. Capitalization of First Letter',
      description: 'Every box must start with a Capital letter.',
      status: 'fail',
      details: `${uncapitalizedIndices.map((i) => `Box ${i + 1}`).join(', ')} start with lowercase.`,
      violatingIndices: uncapitalizedIndices,
      suggestion: 'Capitalize the first letter of each box.',
    });
  }

  // 5. Six Sequential Boxes
  if (boxes.length === 6) {
    rules.push({
      ruleId: 'rule-count',
      ruleTitle: '5. Exactly Six Sequential Boxes',
      description: 'Standard HSC Board examination requires exactly 6 boxes (Box 1 provided + 5 student answers).',
      status: 'pass',
      details: 'Exactly 6 boxes are present in sequential order.',
    });
  } else {
    rules.push({
      ruleId: 'rule-count',
      ruleTitle: '5. Exactly Six Sequential Boxes',
      description: 'Standard HSC Board examination requires exactly 6 boxes (Box 1 provided + 5 student answers).',
      status: 'warning',
      details: `Currently contains ${boxes.length} boxes (standard is 6).`,
      suggestion: 'Adjust box count to 6 for standard HSC examination marking.',
    });
  }

  const passedCount = rules.filter((r) => r.status === 'pass').length;
  const overallScore = Math.round((passedCount / rules.length) * 100);

  // Generate Auto-Fixes
  let fixedTitle = trimmedTitle;
  if (!startsWithFlowchart) {
    fixedTitle = `A flow-chart showing ${trimmedTitle.replace(/^a\s+flow-?chart\s+showing\s*/i, '')}`;
  }
  if (!fixedTitle.toLowerCase().includes('is given below')) {
    fixedTitle = fixedTitle.replace(/:$/, '') + ' is given below:';
  } else if (!fixedTitle.endsWith(':')) {
    fixedTitle = fixedTitle.replace(/:+$/, '') + ':';
  }

  // Fix boxes
  const targetPattern = box1Pattern !== 'unknown' ? box1Pattern : 'participle';
  const fixedBoxes = boxes.map((box, idx) => {
    let clean = box.trim().replace(/\.+$/, ''); // strip full stop
    // Remove subject pronoun if at start
    clean = clean.replace(/^(she|he|they|it|we)\s+/i, '');
    if (idx === 0) {
      return capitalize(clean);
    }
    return convertToPattern(clean, targetPattern);
  });

  return {
    overallScore,
    totalRules: rules.length,
    passedCount,
    hasErrors: passedCount < rules.length,
    box1Pattern,
    box1PatternLabel: patternLabel,
    rules,
    fixedTitle,
    fixedBoxes,
  };
}
