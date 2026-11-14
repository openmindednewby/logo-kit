export interface StopTiming {
  at: number;
  opacity: number | null;
  easing: string | null;
}

export interface AnimationTiming {
  durationMs: number;
  delayMs: number;
  stops: StopTiming[];
}

export type TimingMap = Record<string, AnimationTiming[]>;

const NESTING: Readonly<Record<string, number>> = { '(': 1, ')': -1, '{': 1, '}': -1 };
const KEYFRAMES = '@keyframes ';

function splitTop(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    depth += ch === '(' || ch === ')' ? (NESTING[ch] ?? 0) : 0;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  return cur.trim() ? [...out, cur.trim()] : out;
}

function cutKeyframes(css: string): { bodies: Map<string, string>; rest: string } {
  const bodies = new Map<string, string>();
  let rest = '';
  let i = 0;
  while (i < css.length) {
    const at = css.indexOf(KEYFRAMES, i);
    if (at < 0) {
      rest += css.slice(i);
      break;
    }
    rest += css.slice(i, at);
    const open = css.indexOf('{', at);
    let depth = 1;
    let j = open + 1;
    while (depth > 0 && j < css.length) {
      depth += NESTING[css[j] ?? ''] ?? 0;
      j++;
    }
    bodies.set(css.slice(at + KEYFRAMES.length, open).trim(), css.slice(open + 1, j - 1));
    i = j;
  }
  return { bodies, rest };
}

function stopsOf(body: string): StopTiming[] {
  return body
    .split('}')
    .filter((part) => part.includes('%{'))
    .map((part) => {
      const [stop = '', props = ''] = part.split('%{');
      const opacity = /(?:^|;)opacity:([\d.]+)/.exec(props)?.[1];
      const easing = /animation-timing-function:([^;]+)/.exec(props)?.[1];
      return { at: Number(stop.trim()), opacity: opacity !== undefined ? Number(opacity) : null, easing: easing?.trim() ?? null };
    });
}

const targetOf = (selector: string): string | null => /\.(l\d+|lks\d+)\s*$/.exec(selector)?.[1] ?? (/#mark\s*$/.test(selector) ? 'mark' : null);

function animationOf(anim: string, bodies: Map<string, string>): AnimationTiming {
  const words = anim.split(' ').filter((w) => w !== '');
  const ms = words.filter((w) => w.endsWith('ms')).map((w) => Number(w.slice(0, -2)));
  return { durationMs: ms[0] ?? 0, delayMs: ms[1] ?? 0, stops: stopsOf(bodies.get(words[0] ?? '') ?? '') };
}

/** Returns each animated target's animations (duration, delay, keyframe stops) read from an SVG's style. */
export function parseTiming(svg: string): TimingMap {
  const css = /<style>([\s\S]*?)<\/style>/.exec(svg)?.[1] ?? '';
  const { bodies, rest } = cutKeyframes(css);
  const out: TimingMap = {};
  for (const segment of rest.split('}')) {
    const open = segment.lastIndexOf('{');
    const decls = segment.slice(open + 1);
    const at = decls.indexOf('animation:');
    const target = targetOf(segment.slice(segment.lastIndexOf('{', open - 1) + 1, open));
    if (open < 0 || at < 0 || target === null || decls.includes('none')) {
      continue;
    }
    out[target] = splitTop(decls.slice(at + 'animation:'.length)).map((anim) => animationOf(anim, bodies));
  }
  return out;
}
