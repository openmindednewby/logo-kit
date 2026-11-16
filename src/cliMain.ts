import fs from 'node:fs';
import path from 'node:path';

import { brandCommand } from './brand/brandCli';
import { checkVariants, runChecks } from './checks/runChecks';
import { loadBrand } from './config/loadBrand';
import { Mode } from './core/Mode';
import { markSvg } from './core/svg';
import { exportBrand } from './export/exportBrand';
import { generateVariants } from './generate/generate';
import { validateMotion } from './motion/timeline';
import { generatorPalette } from './palette/variants';
import { buildPickPage, buildPickSpec } from './pick/buildPickSpec';

type Out = (line: string) => void;

const USAGE = 'usage: logo-kit <export|generate|pick|check|pull-brand|check-brand-copy> <brand.json> [--out dir] [--seed n] [--count n] [--builder build-pick-page.mjs]';

function flags(args: readonly string[]): Map<string, string> {
  const out = new Map<string, string>();
  args.forEach((a, i) => {
    const next = args[i + 1];
    if (a.startsWith('--') && next !== undefined) {
      out.set(a.slice(2), next);
    }
  });
  return out;
}

function generate(file: string, f: Map<string, string>, out: Out): number {
  const brand = loadBrand(file);
  const seed = Number(f.get('seed') ?? brand.generate.seed);
  const count = Number(f.get('count') ?? brand.generate.count);
  const dir = f.get('out') ?? 'variants';
  const palette = generatorPalette(brand.tokens);
  const variants = generateVariants(seed, count);
  fs.mkdirSync(dir, { recursive: true });
  for (const v of variants) {
    fs.writeFileSync(path.join(dir, `${v.id}.svg`), markSvg(v.mark, palette, Mode.Light, { label: v.recipe }));
  }
  const report = checkVariants(seed, variants, palette);
  fs.writeFileSync(path.join(dir, `checks-${seed}.json`), `${JSON.stringify(report, null, 2)}\n`);
  out(`generated ${count}, passed ${report.passed.length}, dropped ${report.dropped.length} -> ${dir}`);
  return 0;
}

function motionRefusal(file: string): string | null {
  const errors = loadBrand(file).motion.recipeErrors ?? [];
  return errors.length > 0 ? `motion: ${errors.join('; ')}` : null;
}

function check(file: string, out: Out): number {
  const brand = loadBrand(file);
  const result = runChecks(brand.mark, brand.palette);
  const motion = validateMotion(brand.motion, brand.mark.layers.map((l) => l.name));
  out(JSON.stringify({ ...result, motion }, null, 2));
  return result.pass && motion.errors.length === 0 ? 0 : 1;
}

/** Runs the logo-kit command line and returns its exit code. */
export function runCli(args: readonly string[], out: Out = (line) => process.stdout.write(`${line}\n`)): number {
  const [cmd, file] = args;
  const f = flags(args);
  if (file === undefined) {
    out(USAGE);
    return 2;
  }
  const brandExit = brandCommand(cmd, file, f, out);
  if (brandExit !== null) {
    return brandExit;
  }
  const refusal = cmd === 'export' || cmd === 'generate' ? motionRefusal(file) : null;
  if (refusal !== null) {
    out(refusal);
    return 1;
  }
  if (cmd === 'export') {
    const files = exportBrand(loadBrand(file), f.get('out') ?? 'export');
    files.forEach((x) => out(`${x.file} ${x.width}x${x.height}`));
    return 0;
  }
  if (cmd === 'generate') {
    return generate(file, f, out);
  }
  if (cmd === 'pick') {
    const dir = f.get('out') ?? 'pick';
    const spec = buildPickSpec(loadBrand(file), dir);
    const builder = f.get('builder');
    out(builder !== undefined ? `built ${buildPickPage(builder, dir)}` : `wrote ${spec.steps.length} steps -> ${path.join(dir, 'spec.json')}`);
    return 0;
  }
  if (cmd === 'check') {
    return check(file, out);
  }
  out(USAGE);
  return 2;
}
