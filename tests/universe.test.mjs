import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import { digest } from '../src/engine.js';
import { SIZE, defaultProgram, validateProgram, validateWorld, validateLaw, makeArtifact, executable, makeScene, countCells, capturePatch, matchingCount, checkArtifact, interruptedEvidence, currency, canAdopt } from '../src/universe/engine.js';

const law = { matter: true, species: true, stone: true };
const copy = x => JSON.parse(JSON.stringify(x));
const spec = (id, match, output, extra = {}) => ({ id, name: id, enabled: true, match, output, mirror: false, direction: -1, ...extra });
const artifact = rules => makeArtifact({ ...defaultProgram(), rules });
const up = spec('rise', [0, -1, 2, -1], [2, 1, 0, 3], { mirror: true });
const duplicate = spec('copy', [1, -1, 0, -1], [0, 1, 0, 3]);
const alchemy = spec('melt', [1, -1, -1, -1], [6, 1, 2, 3]);

test('schema bounds own copies and reject malformed authored data', () => {
  const program = defaultProgram(); const result = validateProgram(program);
  result.field[0] = 3; assert.equal(program.field[0], 0);
  for (const bad of [null, {}, { ...program, field: [0] }, { ...program, rules: Array(9).fill(up) }, { ...program, rules: [up, up] }, { ...program, rules: [{ ...up, output: [0, 1, 2, 8] }] }, { ...program, rules: [{ ...up, match: [0, -2, 2, 0] }] }]) assert.throws(() => validateProgram(bad));
  assert.throws(() => validateWorld(new Uint8Array(4096)));
  assert.throws(() => validateWorld(Array(4096)));
  assert.throws(() => validateProgram({ ...program, field: Array(64) }));
  assert.throws(() => validateProgram({ ...program, rules: Array(1) }));
  assert.throws(() => validateWorld(Array(4096).fill(4)));
  assert.throws(() => validateLaw({ matter: false, species: true, stone: true }));
  assert.throws(() => makeArtifact(program, 0));
});

test('exact canonical source is stable, readable, immutable and rejects source injection', () => {
  const program = defaultProgram(), a = makeArtifact(program);
  program.field[0] = 3;
  assert.equal(a.program.field[0], 0);
  assert.equal(a.source, makeArtifact(defaultProgram(), 99).source);
  assert.equal(a.id, digest(a.source));
  assert.deepEqual(Object.keys(executable(a)).sort(), ['rule', 'step']);
  assert.match(a.source, /export function rule\(/);
  assert.match(a.source, /export function step\(/);
  assert.throws(() => a.program.field.push(0));
  const malicious = copy(a); malicious.source += '\nglobalThis.__universeInjected=true'; malicious.id = digest(malicious.source);
  assert.throws(() => executable(malicious)); assert.equal(globalThis.__universeInjected, undefined);
  const changedProgram = copy(a); changedProgram.program.field[0] = 1;
  assert.throws(() => executable(changedProgram));
  const changedHash = copy(a); changedHash.id = 'wrong'; assert.throws(() => executable(changedHash));
  assert.throws(() => executable(a).step(Array(4096)));
  assert.throws(() => executable(a).rule(Array(4), { direction: 0, phase: 0 }));
});

test('Vite minification preserves the exact source artifact bytes', async () => {
  const text = (await readFile(new URL('../src/universe/engine.js', import.meta.url), 'utf8')).replace("'../engine.js'", JSON.stringify(new URL('../src/engine.js', import.meta.url).href));
  const minified = await transformWithEsbuild(text, 'engine.js', { minify: true });
  const built = await import(`data:text/javascript;base64,${Buffer.from(minified.code).toString('base64')}`);
  const program = { rules: [up, duplicate], field: Array.from({ length: 64 }, (_, i) => i % 4) };
  assert.equal(built.makeArtifact(program).source, makeArtifact(program).source);
  assert.deepEqual(built.executable(built.makeArtifact(program)).step(makeScene()), executable(makeArtifact(program)).step(makeScene()));
});

test('canonical source safely encodes HTML delimiters and Unicode separators without changing names or behavior', async () => {
  const name = 'Text </script> <tag> \u2028 \u2029';
  const a = artifact([{ ...up, name }]);
  assert.equal(a.program.rules[0].name, name);
  assert.equal(a.source.includes('</script>'), false);
  assert.equal(a.source.includes('<tag>'), false);
  assert.equal(a.source.includes('\u2028'), false);
  assert.equal(a.source.includes('\u2029'), false);
  assert.ok(a.source.includes('\\u003c/script>'));
  assert.ok(a.source.includes('\\u2028'));
  assert.ok(a.source.includes('\\u2029'));
  assert.deepEqual(executable(a).rule([0, 3, 2, 3], { direction: 0, phase: 0 }).cells, [2, 3, 0, 3]);
  const module = await import(`data:text/javascript;base64,${Buffer.from(a.source).toString('base64')}`);
  assert.deepEqual(module.step(makeScene()), executable(a).step(makeScene()));
  assert.equal(a.source, makeArtifact(copy(a.program)).source);
});

test('actual authored upward-water rule changes motion and its world while conserving material', async () => {
  const a = artifact([up]), runtime = executable(a), baseline = executable(artifact([]));
  const input = [0, 3, 2, 3];
  assert.deepEqual(runtime.rule(input, { direction: 0, phase: 0 }), { cells: [2, 3, 0, 3], ruleId: 'rise', mirrored: false });
  assert.deepEqual(baseline.rule(input, { direction: 0, phase: 0 }).cells, input);
  const world = makeScene('empty'); world[3 * SIZE + 3] = 2;
  assert.notDeepEqual(runtime.step(world), baseline.step(world));
  assert.equal(world[3 * SIZE + 3], 2, 'step owns its output');
  const report = await checkArtifact(a, law);
  assert.equal(report.outcome, 'pass'); assert.equal(report.checked, 2048);
  assert.equal(report.engineTests.checked, 15); assert.equal(report.engineTests.outcome, 'pass');
  assert.equal(canAdopt(report, a, law), true);
});

test('all references read original cells; mirror transforms output slots and references; rule precedence is observable', () => {
  const rotate = artifact([spec('rotate', [-1, -1, -1, -1], [1, 3, 0, 2])]);
  assert.deepEqual(executable(rotate).rule([0, 1, 2, 3], { direction: 0, phase: 0 }).cells, [1, 3, 0, 2]);
  const mirror = executable(artifact([up]));
  assert.deepEqual(mirror.rule([3, 0, 3, 2], { direction: 0, phase: 0 }), { cells: [3, 2, 3, 0], ruleId: 'rise', mirrored: true });
  const first = spec('first', [-1, -1, -1, -1], [0, 1, 2, 3], { mirror: true });
  const both = executable(artifact([first, duplicate]));
  assert.deepEqual(both.rule([1, 0, 0, 0], { direction: 0, phase: 0 }), { cells: [1, 0, 0, 0], ruleId: 'first', mirrored: false });
  const scoped = executable(artifact([{ ...first, direction: 2 }, duplicate]));
  assert.equal(scoped.rule([1, 0, 0, 0], { direction: 0, phase: 0 }).ruleId, 'copy');
  assert.equal(scoped.rule([1, 0, 0, 0], { direction: 2, phase: 0 }).ruleId, 'first');
  const directions = [
    [[0, 3, 2, 3], [2, 3, 0, 3]],
    [[2, 0, 3, 3], [0, 2, 3, 3]],
    [[3, 2, 3, 0], [3, 0, 3, 2]],
    [[3, 3, 0, 2], [3, 3, 2, 0]],
  ];
  directions.forEach(([before, after], direction) => assert.deepEqual(mirror.rule(before, { direction, phase: 1 }).cells, after));
});

test('duplication yields actual replayable matter witness; failure cannot be adopted', async () => {
  const a = artifact([duplicate]); const report = await checkArtifact(a, law);
  assert.equal(report.outcome, 'fail'); assert.equal(report.complete, true);
  const w = report.witnesses.find(w => w.property === 'matter');
  assert.ok(w); assert.equal(w.ruleId, 'copy'); assert.equal(w.observed, w.expected + 1);
  assert.deepEqual(executable(a).rule(w.before, w.context).cells, w.after);
  assert.equal(report.properties.find(p => p.key === 'conformance').outcome, 'pass');
  assert.equal(canAdopt(report, a, law), false);
  const repaired = artifact([{ ...duplicate, output: [4, 1, 0, 3] }]);
  assert.equal((await checkArtifact(repaired, law)).outcome, 'pass');
});

test('alchemy is implementation-conforming but changes species; a law revision needs fresh evidence', async () => {
  const a = artifact([alchemy]); const rejected = await checkArtifact(a, law);
  assert.equal(rejected.properties.find(p => p.key === 'matter').outcome, 'pass');
  assert.equal(rejected.properties.find(p => p.key === 'species').outcome, 'fail');
  const revised = { ...law, species: false };
  assert.equal(currency(rejected, a, revised, 2), 'stale');
  const accepted = await checkArtifact(a, revised, { lawRevision: 2 });
  assert.equal(canAdopt(accepted, a, revised, 2), true);
  assert.equal(currency(accepted, a, revised, 1), 'stale');
  assert.equal(rejected.outcome, 'fail');
});

test('fixed-rock law is per location, distinct from species counts', async () => {
  const a = artifact([spec('spin', [-1, -1, -1, -1], [1, 3, 0, 2])]);
  const r = await checkArtifact(a, law);
  assert.equal(r.properties.find(p => p.key === 'species').outcome, 'pass');
  assert.equal(r.properties.find(p => p.key === 'stone').outcome, 'fail');
  assert.equal((await checkArtifact(a, { ...law, stone: false })).outcome, 'pass');
});

test('local enumeration and integration exercise arbitrary patterns, mirror, direction and mixed fields', async () => {
  const program = { rules: [up, { ...alchemy, direction: 2, mirror: true }, spec('shuffle', [3, -1, -1, 0], [2, 7, 1, 4], { mirror: true })], field: Array.from({ length: 64 }, (_, i) => i % 4) };
  const report = await checkArtifact(makeArtifact(program), law);
  assert.equal(report.checked, 2048);
  assert.equal(report.properties.find(p => p.key === 'conformance').outcome, 'pass');
  assert.equal(report.engineTests.outcome, 'pass');
  assert.ok(report.engineTests.fixtures.some(f => f.name === 'wrap-and-field-seams'));
});

test('partition capture wraps seam correctly, snaps anchors, rotates into local frame and owns data', () => {
  const p = defaultProgram(); p.field[63] = 1; const a = makeArtifact(p);
  const world = makeScene('empty'); world[4095] = 0; world[4032] = 1; world[63] = 2; world[0] = 3;
  const capture = capturePatch(a, world, 0, 0, 1);
  assert.deepEqual(capture.indices, [4095, 4032, 63, 0]);
  assert.deepEqual(capture.context, { direction: 1, phase: 1 });
  assert.deepEqual(capture.before, [0, 1, 2, 3]); assert.deepEqual(capture.local, [1, 3, 0, 2]);
  assert.equal(capture.x, 63); assert.equal(capture.y, 63);
  capture.before[0] = 3; assert.equal(world[4095], 0);
  assert.deepEqual(capturePatch(a, world, 3, 5).indices, [258, 259, 322, 323]);
});

test('match counts reflect actual winning rules, including mirrors and shadowing', () => {
  const world = makeScene('empty'); world[65] = 2;
  assert.equal(matchingCount(artifact([up]), world, 'rise'), 1);
  const shadow = spec('shadow', [-1, -1, -1, -1], [0, 1, 2, 3]);
  assert.equal(matchingCount(artifact([shadow, up]), world, 'rise'), 0);
  assert.equal(matchingCount(artifact([shadow, up]), world, 'shadow'), 1024);
});

test('real yielding allows cancellation, case budgets and callback errors never produce adoption evidence', async () => {
  const a = artifact([]); const controller = new AbortController(); let callbacks = 0;
  const cancelled = await checkArtifact(a, law, { signal: controller.signal, onProgress: progress => { callbacks++; assert.equal(progress.total, 2048); controller.abort(); } });
  assert.equal(callbacks, 1); assert.equal(cancelled.checked, 128); assert.equal(cancelled.outcome, 'inconclusive'); assert.equal(cancelled.complete, false);
  assert.equal(canAdopt(cancelled, a, law), false);
  const timed = new AbortController(); setTimeout(() => timed.abort(), 0);
  assert.equal((await checkArtifact(a, law, { signal: timed.signal })).outcome, 'inconclusive');
  const budget = await checkArtifact(a, law, { budget: 129 });
  assert.equal(budget.checked, 129); assert.equal(budget.engineTests.checked, 0); assert.equal(budget.outcome, 'inconclusive');
  assert.equal(budget.configuration.caseBudget, 129); assert.equal(currency(budget, a, law), 'current');
  assert.equal((await checkArtifact(a, law, { budget: 0 })).checked, 0);
  assert.equal((await checkArtifact(a, law, { budget: -1 })).outcome, 'inconclusive');
  assert.equal((await checkArtifact(a, law, { onProgress: () => { throw Error('UI stopped'); } })).outcome, 'inconclusive');
  const preAborted = new AbortController(); preAborted.abort();
  assert.equal((await checkArtifact(a, law, { signal: preAborted.signal })).checked, 0);
});

test('currency is conservative; historical reports own their source/law/configuration and are immutable', async () => {
  const program = defaultProgram(); const a = makeArtifact(program); const constitution = copy(law);
  const report = await checkArtifact(a, constitution);
  constitution.species = false; program.field[0] = 1;
  assert.equal(report.law.species, true); assert.equal(report.artifact.program.field[0], 0);
  assert.equal(currency(copy(report), copy(a), law), 'current');
  assert.equal(currency(report, makeArtifact(defaultProgram(), 2), law), 'stale');
  assert.equal(currency(report, makeArtifact(program), law), 'stale');
  assert.equal(currency(report, a, law, 2), 'stale');
  const corrupt = copy(report); corrupt.checked = 2047; assert.equal(currency(corrupt, a, law), 'stale');
  const interrupted = interruptedEvidence(a, law, { checked: 400, message: 'Refresh interrupted this check' });
  assert.equal(interrupted.outcome, 'inconclusive'); assert.equal(interrupted.checked, 400); assert.equal(canAdopt(interrupted, a, law), false);
  assert.throws(() => report.artifact.program.field[0] = 1);
  assert.throws(() => report.properties.push({ key: 'fake', outcome: 'pass' }));
});

test('malformed restored evidence fails closed, including rehashed structurally invalid records', async () => {
  const a = artifact([]), original = await checkArtifact(a, law);
  const changes = [
    r => { delete r.properties; },
    r => { r.properties = Array(r.properties.length).fill({ key: 'matter', label: 'Total matter stays constant', outcome: 'pass' }); },
    r => { r.engineTests.fixtures = []; },
    r => { r.engineTests.fixtures[0].name = 'never executed'; },
    r => { r.engineTests.fixtures[0].outcome = 'fail'; },
    r => { r.checked = -1; },
    r => { r.complete = false; },
    r => { r.witnesses = null; },
    r => { r.witnesses.push({ property: 'matter', before: [0, 0, 0, 0], after: [1, 0, 0, 0], context: { direction: 0, phase: 0 }, ruleId: null, mirrored: false }); },
  ];
  for (const change of changes) {
    const altered = copy(original); change(altered); delete altered.id; altered.id = digest(altered);
    assert.equal(currency(altered, a, law), 'stale');
    assert.equal(canAdopt(altered, a, law), false);
  }
  for (const invalid of [null, {}, [], { outcome: 'pass' }]) assert.equal(canAdopt(invalid, a, law), false);
  for (const budget of [NaN, Infinity, '2048', 2048.5, 2049]) {
    const result = await checkArtifact(a, law, { budget });
    assert.equal(result.checked, 0); assert.equal(result.outcome, 'inconclusive'); assert.equal(canAdopt(result, a, law), false);
  }
});

test('assumption and exclusion changes invalidate rehashed evidence without changing executable identity', async () => {
  const a = artifact([]), report = await checkArtifact(a, law);
  assert.equal(report.binding.checker, 'groundwork-universe/local-3');
  assert.equal(report.binding.assumptionsId, digest(report.assumptions));
  assert.equal(report.binding.exclusionsId, digest(report.exclusions));
  assert.equal(currency(copy(report), a, law), 'current');
  assert.equal(canAdopt(copy(report), a, law), true);
  for (const key of ['assumptions', 'exclusions']) {
    for (const rebind of [false, true]) {
      const edited = copy(report); edited[key].push('Different evidence scope');
      if (rebind) edited.binding[`${key}Id`] = digest(edited[key]);
      delete edited.id; edited.id = digest(edited);
      assert.equal(currency(edited, a, law), 'stale');
      assert.equal(canAdopt(edited, a, law), false);
    }
  }
  const historical = copy(report); historical.binding.checker = 'groundwork-universe/local-2';
  delete historical.id; historical.id = digest(historical);
  assert.equal(currency(historical, a, law), 'stale');
  assert.equal(historical.outcome, 'pass', 'Historical result remains inspectable');
  assert.equal(a.id, 'c356b352b0db0b8b31e25115baecfde0f268d7684778e91ee6361d9b0a193209');
});

test('scenes are deterministic and fallback preserves all material through actual whole ticks', () => {
  const runtime = executable(artifact([]));
  for (const name of ['empty', 'basin', 'hourglass']) {
    const seed = makeScene(name); assert.deepEqual(seed, makeScene(name));
    const before = countCells(seed); let world = seed;
    for (let tick = 0; tick < 8; tick++) world = runtime.step(world);
    assert.deepEqual(countCells(world), before);
    assert.equal(world.length, 4096);
    seed.forEach((cell, i) => { if (cell === 3) assert.equal(world[i], 3); });
  }
  assert.throws(() => makeScene('not-a-scene'));
});
