import { digest } from '../engine.js';

export const SIZE = 64;
export const FIELD_SIZE = 8;
export const CELL_NAMES = ['Empty', 'Sand', 'Water', 'Stone'];
export const CELL_COLORS = ['#0a1625', '#edb959', '#55baf4', '#8390a4'];
const CHECKER = 'groundwork-universe/local-3';
const TOTAL = 2048;
const CONFIGURATION = Object.freeze({ cells: 4, blockCells: 4, directions: 4, phases: 2, total: TOTAL, worldSize: SIZE, engineFixtures: 'world-fixtures-1' });
const ASSUMPTIONS = Object.freeze(['Four cell types; a 2×2 block; direction 0–3 and phase 0–1 are the entire local input.', '64×64 toroidal world; each tick applies the even then odd disjoint partition.', 'The wrapped block anchor selects one of the 8×8 field tiles. Human brushes are outside physics.', 'The JavaScript runtime, canonical source generator, independent interpreter, and checker are trusted.']);
const EXCLUSIONS = Object.freeze(['No Bend or Lean proof ran. Local enumeration is not a machine-checked theorem for all worlds and ticks.', 'Engine fixture tests, browser rendering, user intent, and human acceptance are separate.', 'Browser storage is editable and unsigned.']);
const own = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
function requireValue(condition, message) { if (!condition) throw new Error(message); }
function vector(value, length, min, max, label) {
  requireValue(Array.isArray(value) && value.length === length && Array.from(value).every(item => integer(item, min, max)), `Invalid ${label}`);
  return [...value];
}
function record(value, label) { requireValue(value && typeof value === 'object' && !Array.isArray(value), `Invalid ${label}`); }
export function defaultProgram() { return { rules: [], field: Array(64).fill(0) }; }
export function validateProgram(program) {
  record(program, 'program');
  requireValue(Array.isArray(program.rules) && program.rules.length <= 8, 'Use at most eight rules');
  const ids = new Set();
  const rules = Array.from(program.rules).map(rule => {
    record(rule, 'rule');
    requireValue(typeof rule.id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(rule.id) && !ids.has(rule.id), 'Rule IDs must be unique, nonempty identifiers');
    ids.add(rule.id);
    requireValue(typeof rule.name === 'string' && rule.name.length <= 80, 'Rule names must be at most 80 characters');
    requireValue(typeof rule.enabled === 'boolean' && typeof rule.mirror === 'boolean', 'Invalid rule switches');
    requireValue(integer(rule.direction, -1, 3), 'Invalid direction filter');
    return { id: rule.id, name: rule.name, enabled: rule.enabled, match: vector(rule.match, 4, -1, 3, 'input pattern'), output: vector(rule.output, 4, 0, 7, 'output pattern'), mirror: rule.mirror, direction: rule.direction };
  });
  return { rules, field: vector(program.field, 64, 0, 3, 'field') };
}
export function validateWorld(world) { return vector(world, SIZE * SIZE, 0, 3, 'world'); }
export function validateLaw(law) {
  record(law, 'constitution');
  requireValue(law.matter === true && typeof law.species === 'boolean' && typeof law.stone === 'boolean', 'Constitution must protect matter and specify species and stone promises');
  return { matter: true, species: law.species, stone: law.stone };
}

// A literal source template, never Function.toString(): Vite cannot rename this artifact.
// Local rule input/output is in world coordinates. Patterns are in the field's local frame.
const RUNTIME = String.raw`
const SIZE = 64;
const turns = [[0,1,2,3],[1,3,0,2],[3,2,1,0],[2,0,3,1]];
const reflected = [1,0,3,2];
function matches(pattern, cells) {
  return pattern.every((value, index) => value === -1 || value === cells[index]);
}
function applyRule(spec, cells) {
  return spec.output.map(value => value < 4 ? cells[value] : value - 4);
}
function fallback(input, phase) {
  const cells = input.slice();
  function sinks(a,b) { return (a === 1 && (b === 0 || b === 2)) || (a === 2 && b === 0); }
  function swap(a,b) { const held=cells[a]; cells[a]=cells[b]; cells[b]=held; }
  if (sinks(cells[0],cells[2])) swap(0,2);
  if (sinks(cells[1],cells[3])) swap(1,3);
  const a=phase===0?0:1, b=phase===0?3:2;
  if (sinks(cells[a],cells[b])) swap(a,b);
  const left=phase===0?2:0, right=left+1;
  if ((cells[left]===2 && cells[right]===0)||(cells[left]===0 && cells[right]===2)) swap(left,right);
  return cells;
}
export function rule(block, context) {
  if (!Array.isArray(block)||block.length!==4||!Array.from(block).every(c=>Number.isInteger(c)&&c>=0&&c<=3)) throw Error('Invalid block');
  if (!context||!Number.isInteger(context.direction)||context.direction<0||context.direction>3||!Number.isInteger(context.phase)||context.phase<0||context.phase>1) throw Error('Invalid context');
  const order=turns[context.direction];
  const local=order.map(index=>block[index]);
  let result=null, ruleId=null, mirrored=false;
  for (const spec of program.rules) {
    if (!spec.enabled || (spec.direction!==-1 && spec.direction!==context.direction)) continue;
    if (matches(spec.match,local)) { result=applyRule(spec,local); ruleId=spec.id; break; }
    if (spec.mirror) {
      const mirror=reflected.map(index=>local[index]);
      if (matches(spec.match,mirror)) {
        const changed=applyRule(spec,mirror);
        result=reflected.map(index=>changed[index]); ruleId=spec.id; mirrored=true; break;
      }
    }
  }
  if (result===null) result=fallback(local,context.phase);
  const cells=Array(4);
  order.forEach((index,i)=>{cells[index]=result[i];});
  return {cells,ruleId,mirrored};
}
export function step(world) {
  if (!Array.isArray(world)||world.length!==4096||!Array.from(world).every(c=>Number.isInteger(c)&&c>=0&&c<=3)) throw Error('Invalid world');
  let current=world.slice();
  for (let phase=0;phase<2;phase++) {
    const next=Array(4096);
    for (let y=phase;y<64;y+=2) for (let x=phase;x<64;x+=2) {
      const indices=[y*64+x,y*64+(x+1)%64,((y+1)%64)*64+x,((y+1)%64)*64+(x+1)%64];
      const direction=program.field[Math.floor(y/8)*8+Math.floor(x/8)];
      const result=rule(indices.map(i=>current[i]),{direction,phase});
      indices.forEach((index,i)=>{next[index]=result.cells[i];});
    }
    current=next;
  }
  return current;
}
`;
function sourceFor(program) {
  // Artifact bytes are also embedded unchanged in an offline HTML module. Encode
  // HTML delimiters here, at authorship, so export never needs to alter the source.
  const literal = JSON.stringify(program).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `// Groundwork discrete physics / source family 1\nconst program = ${literal};\n${RUNTIME}`;
}
export function makeArtifact(program, revision = 1) {
  requireValue(integer(revision, 1, Number.MAX_SAFE_INTEGER), 'Invalid program revision');
  const normalized = validateProgram(program);
  const source = sourceFor(normalized);
  return freeze({ revision, program: normalized, source, id: digest(source) });
}
const runtimeCache = new Map();
export function executable(artifact) {
  record(artifact, 'artifact');
  requireValue(integer(artifact.revision, 1, Number.MAX_SAFE_INTEGER), 'Invalid artifact revision');
  const expected = sourceFor(validateProgram(artifact.program));
  requireValue(artifact.source === expected && artifact.id === digest(expected), 'Artifact is not the exact supported source family');
  if (!runtimeCache.has(expected)) {
    const code = expected.replace('export function rule(', 'function rule(').replace('export function step(', 'function step(');
    const runtime = new Function(`${code}\nreturn {rule,step};`)();
    if (runtimeCache.size >= 32) runtimeCache.delete(runtimeCache.keys().next().value);
    runtimeCache.set(expected, Object.freeze(runtime));
  }
  return runtimeCache.get(expected);
}

// Independent oracle: coordinate transforms and explicit slot evaluation rather than
// runtime permutations, matching helpers, fallback functions, or executable source.
function oracleRule(program, block, context) {
  function worldIndex(u, v) {
    let x, y;
    switch (context.direction) {
      case 0: x = u; y = v; break;
      case 1: x = 1 - v; y = u; break;
      case 2: x = 1 - u; y = 1 - v; break;
      default: x = v; y = 1 - u;
    }
    return y * 2 + x;
  }
  let local = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) local.push(block[worldIndex(col, row)]);
  let changed = null, selected = null, wasMirrored = false;
  for (const spec of program.rules) {
    if (!spec.enabled || (spec.direction >= 0 && spec.direction !== context.direction)) continue;
    for (let mirror = 0; mirror <= Number(spec.mirror); mirror++) {
      let accepted = true;
      for (let index = 0; index < 4; index++) {
        const sourceIndex = mirror ? (Math.floor(index / 2) * 2 + 1 - index % 2) : index;
        if (spec.match[index] !== -1 && spec.match[index] !== local[sourceIndex]) accepted = false;
      }
      if (!accepted) continue;
      changed = [];
      for (let index = 0; index < 4; index++) {
        const outputSlot = mirror ? (Math.floor(index / 2) * 2 + 1 - index % 2) : index;
        const expression = spec.output[outputSlot];
        const inputSlot = mirror ? (Math.floor(expression / 2) * 2 + 1 - expression % 2) : expression;
        changed[index] = expression >= 4 ? expression - 4 : local[inputSlot];
      }
      selected = spec.id; wasMirrored = Boolean(mirror); break;
    }
    if (changed) break;
  }
  if (!changed) {
    const pair = (top, bottom) => {
      const upper = local[top], lower = local[bottom];
      const moves = upper === 1 ? lower === 0 || lower === 2 : upper === 2 && lower === 0;
      if (moves) { local[top] = lower; local[bottom] = upper; }
    };
    pair(0, 2); pair(1, 3);
    if (context.phase) pair(1, 2); else pair(0, 3);
    const row = context.phase ? 0 : 2;
    if (local[row] + local[row + 1] === 2 && local[row] !== 1 && local[row + 1] !== 1) {
      const held = local[row]; local[row] = local[row + 1]; local[row + 1] = held;
    }
    changed = local;
  }
  const result = [];
  for (let row = 0; row < 2; row++) for (let col = 0; col < 2; col++) result[worldIndex(col, row)] = changed[row * 2 + col];
  return { cells: result, ruleId: selected, mirrored: wasMirrored };
}
function oracleStep(program, input) {
  let grid = input.slice();
  for (const offset of [0, 1]) {
    const result = Array(4096), visits = new Uint8Array(4096);
    for (let tile = 0; tile < 1024; tile++) {
      const anchorX = (tile % 32) * 2 + offset, anchorY = Math.floor(tile / 32) * 2 + offset;
      const at = (dx, dy) => ((anchorY + dy) % 64) * 64 + (anchorX + dx) % 64;
      const positions = [at(0, 0), at(1, 0), at(0, 1), at(1, 1)];
      const context = { direction: program.field[(anchorY >> 3) * 8 + (anchorX >> 3)], phase: offset };
      const output = oracleRule(program, positions.map(index => grid[index]), context).cells;
      for (let corner = 0; corner < 4; corner++) { result[positions[corner]] = output[corner]; visits[positions[corner]]++; }
    }
    requireValue(visits.every(n => n === 1), 'Reference partition did not visit each cell exactly once');
    grid = result;
  }
  return grid;
}
export function countCells(world) {
  const counts = { matter: 0, sand: 0, water: 0, stone: 0 };
  for (const cell of world) {
    if (cell !== 0) counts.matter++;
    if (cell === 1) counts.sand++;
    if (cell === 2) counts.water++;
    if (cell === 3) counts.stone++;
  }
  return counts;
}
export function makeScene(name = 'basin') {
  requireValue(['basin', 'hourglass', 'empty'].includes(name), 'Unknown scene');
  const world = Array(4096).fill(0);
  if (name === 'empty') return world;
  for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
    const i = y * 64 + x;
    if (x === 0 || x === 63 || y === 0 || y === 63) world[i] = 3;
    else if (name === 'basin') {
      if (y >= 43 && y <= 54 && x >= 10 && x <= 53) world[i] = 2;
      if (y >= 6 && y <= 17 && x >= 18 && x <= 37 && (x + 3 * y) % 5 !== 0) world[i] = 1;
      if (y === 35 && x >= 7 && x <= 38) world[i] = 3;
    } else {
      const boundary = y < 32 ? 8 + Math.floor(y * .68) : 29 - Math.floor((y - 32) * .68);
      if (x === boundary || x === 63 - boundary) world[i] = 3;
      if (y > 5 && y < 23 && x > boundary && x < 63 - boundary) world[i] = 1;
      if (y > 48 && y < 59 && x > boundary && x < 63 - boundary) world[i] = 2;
    }
  }
  return world;
}
export function capturePatch(artifact, world, x, y, phase = 0) {
  executable(artifact); validateWorld(world);
  requireValue(Number.isInteger(x) && Number.isInteger(y) && integer(phase, 0, 1), 'Invalid capture coordinates');
  const wrap = n => ((n % 64) + 64) % 64;
  const anchorX = wrap(2 * Math.floor((wrap(x) - phase) / 2) + phase);
  const anchorY = wrap(2 * Math.floor((wrap(y) - phase) / 2) + phase);
  const indices = [anchorY * 64 + anchorX, anchorY * 64 + wrap(anchorX + 1), wrap(anchorY + 1) * 64 + anchorX, wrap(anchorY + 1) * 64 + wrap(anchorX + 1)];
  const direction = artifact.program.field[Math.floor(anchorY / 8) * 8 + Math.floor(anchorX / 8)];
  const before = indices.map(i => world[i]);
  const maps = [[0, 1, 2, 3], [1, 3, 0, 2], [3, 2, 1, 0], [2, 0, 3, 1]];
  return { before, local: maps[direction].map(i => before[i]), context: { direction, phase }, indices, x: anchorX, y: anchorY };
}
export function matchingCount(artifact, world, ruleId) {
  const runtime = executable(artifact); validateWorld(world);
  let count = 0;
  for (let y = 0; y < 64; y += 2) for (let x = 0; x < 64; x += 2) {
    const direction = artifact.program.field[(y >> 3) * 8 + (x >> 3)];
    if (runtime.rule([world[y * 64 + x], world[y * 64 + x + 1], world[(y + 1) * 64 + x], world[(y + 1) * 64 + x + 1]], { direction, phase: 0 }).ruleId === ruleId) count++;
  }
  return count;
}
function bindingFor(artifact, law, revision, configuration = CONFIGURATION) {
  return { checker: CHECKER, sourceId: digest(artifact.source), sourceRevision: artifact.revision, lawId: digest(law), lawRevision: revision, configurationId: digest(configuration), assumptionsId: digest(ASSUMPTIONS), exclusionsId: digest(EXCLUSIONS) };
}
function properties(law) {
  return [{ key: 'conformance', label: 'Program matches the independent rule interpreter' }, { key: 'matter', label: 'Total matter stays constant' }, ...(law.species ? [{ key: 'species', label: 'Each material count stays constant' }] : []), ...(law.stone ? [{ key: 'stone', label: 'Stone cells stay fixed' }] : [])].map(p => ({ ...p, outcome: 'inconclusive' }));
}
function baseReport(artifact, law, lawRevision) {
  requireValue(integer(lawRevision, 1, Number.MAX_SAFE_INTEGER), 'Invalid constitution revision');
  const constitution = validateLaw(law);
  return {
    kind: 'exhaustive-local-check', artifact: own(artifact), law: constitution,
    binding: bindingFor(artifact, constitution, lawRevision), configuration: own(CONFIGURATION),
    checked: 0, total: TOTAL, outcome: 'inconclusive', complete: false, message: '',
    properties: properties(constitution), witnesses: [], engineTests: { checked: 0, outcome: 'inconclusive', fixtures: [] },
    assumptions: [...ASSUMPTIONS],
    exclusions: [...EXCLUSIONS],
    startedAt: new Date().toISOString(), finishedAt: null,
  };
}
function finish(report, message) {
  report.message = message;
  report.finishedAt = new Date().toISOString();
  report.id = digest(report);
  return freeze(report);
}
export function interruptedEvidence(artifact, law, { lawRevision = 1, message = 'Check interrupted; run a fresh check.', checked = 0 } = {}) {
  const report = baseReport(artifact, law, lawRevision);
  report.checked = integer(checked, 0, TOTAL) ? checked : 0;
  return finish(report, message);
}
const yieldBrowser = () => new Promise(resolve => setTimeout(resolve, 0));
function fixtureWorlds() {
  const sparse = Array(4096).fill(0);
  for (const [index, value] of [[0, 1], [63, 2], [4032, 3], [4095, 1], [62, 2], [3968, 1], [511, 2], [512, 3]]) sparse[index] = value;
  return [
    ['empty', makeScene('empty')], ['basin', makeScene('basin')], ['hourglass', makeScene('hourglass')],
    ['wrap-and-field-seams', sparse], ['all-local-patterns', Array.from({ length: 4096 }, (_, i) => (Math.floor(i / 64) * 7 + i % 64 + Math.floor(i / 5)) % 4)],
  ];
}
export async function checkArtifact(artifact, law, { lawRevision = 1, budget = TOTAL, signal, onProgress } = {}) {
  const report = baseReport(artifact, law, lawRevision);
  try {
    requireValue(integer(budget, 0, TOTAL), 'Invalid case budget');
    report.configuration.caseBudget = budget;
    report.binding = bindingFor(report.artifact, report.law, lawRevision, report.configuration);
    const runtime = executable(report.artifact);
    const failed = new Set();
    const witness = (property, before, after, context, result, expected, observed) => {
      failed.add(property);
      if (!report.witnesses.some(w => w.property === property)) report.witnesses.push({ property, before: [...before], after: [...after], context: { ...context }, ruleId: result.ruleId, mirrored: result.mirrored, expected: own(expected), observed: own(observed) });
    };
    for (let caseIndex = 0; caseIndex < TOTAL; caseIndex++) {
      if (signal?.aborted) return finish(report, 'Stopped. This partial check cannot support adoption.');
      if (caseIndex >= budget) return finish(report, `Case budget exhausted after ${report.checked} of ${TOTAL}; no complete result.`);
      const encoded = caseIndex % 256;
      const before = [encoded % 4, Math.floor(encoded / 4) % 4, Math.floor(encoded / 16) % 4, Math.floor(encoded / 64) % 4];
      const context = { direction: Math.floor(caseIndex / 256) % 4, phase: Math.floor(caseIndex / 1024) };
      const result = runtime.rule(before, context), expected = oracleRule(report.artifact.program, before, context);
      if (JSON.stringify(result) !== JSON.stringify(expected)) witness('conformance', before, result.cells, context, result, expected, result);
      // Invariant evaluator deliberately does not use the UI's countCells helper.
      const beforeCounts = [0, 0, 0, 0], afterCounts = [0, 0, 0, 0];
      before.forEach(c => beforeCounts[c]++); result.cells.forEach(c => afterCounts[c]++);
      if (beforeCounts[0] !== afterCounts[0]) witness('matter', before, result.cells, context, result, 4 - beforeCounts[0], 4 - afterCounts[0]);
      if (report.law.species && beforeCounts.some((count, type) => count !== afterCounts[type])) witness('species', before, result.cells, context, result, beforeCounts, afterCounts);
      if (report.law.stone && before.some((c, i) => (c === 3) !== (result.cells[i] === 3))) witness('stone', before, result.cells, context, result, before.map(c => c === 3), result.cells.map(c => c === 3));
      report.checked++;
      if (report.checked % 128 === 0) { onProgress?.({ checked: report.checked, total: TOTAL }); await yieldBrowser(); }
    }
    if (signal?.aborted) return finish(report, 'Stopped before engine integration tests completed.');
    for (const [name, initial] of fixtureWorlds()) {
      if (signal?.aborted) return finish(report, 'Stopped during engine integration tests.');
      let actual = initial, expected = initial;
      for (let tick = 0; tick < 3; tick++) {
        actual = runtime.step(actual); expected = oracleStep(report.artifact.program, expected);
        const passed = actual.length === expected.length && actual.every((cell, i) => cell === expected[i]);
        report.engineTests.checked++;
        report.engineTests.fixtures.push({ name, tick: tick + 1, outcome: passed ? 'pass' : 'fail' });
      }
      await yieldBrowser();
    }
    if (signal?.aborted) return finish(report, 'Stopped before finalizing evidence.');
    report.properties.forEach(p => { p.outcome = failed.has(p.key) ? 'fail' : 'pass'; });
    report.engineTests.outcome = report.engineTests.fixtures.every(f => f.outcome === 'pass') ? 'pass' : 'fail';
    report.complete = true;
    report.outcome = failed.size || report.engineTests.outcome === 'fail' ? 'fail' : 'pass';
    return finish(report, report.outcome === 'pass' ? 'All 2,048 local cases passed; 15 whole-engine fixture steps passed separately.' : 'A checked promise or independent execution comparison failed. Inspect the recorded evidence.');
  } catch (error) {
    return finish(report, `Check could not complete: ${error.message}`);
  }
}
export function currency(report, artifact, law, lawRevision = 1) {
  try {
    executable(artifact);
    const normalized = validateLaw(law);
    requireValue(integer(lawRevision, 1, Number.MAX_SAFE_INTEGER), 'Invalid constitution revision');
    const saved = own(report), id = saved.id; delete saved.id;
    if (id !== digest(saved)) return 'stale';
    if (report.kind !== 'exhaustive-local-check' || report.total !== TOTAL) return 'stale';
    const configuration = own(report.configuration);
    if ('caseBudget' in configuration) {
      if (!integer(configuration.caseBudget, 0, TOTAL)) return 'stale';
      delete configuration.caseBudget;
    }
    if (JSON.stringify(configuration) !== JSON.stringify(CONFIGURATION)) return 'stale';
    if (JSON.stringify(report.assumptions) !== JSON.stringify(ASSUMPTIONS) || JSON.stringify(report.exclusions) !== JSON.stringify(EXCLUSIONS)) return 'stale';
    if (JSON.stringify(report.binding) !== JSON.stringify(bindingFor(artifact, normalized, lawRevision, report.configuration))) return 'stale';
    if (report.artifact.source !== artifact.source || report.artifact.id !== artifact.id || report.artifact.revision !== artifact.revision) return 'stale';
    if (JSON.stringify(report.artifact.program) !== JSON.stringify(artifact.program) || JSON.stringify(report.law) !== JSON.stringify(normalized)) return 'stale';
    if (!validReportShape(report, normalized)) return 'stale';
    return 'current';
  } catch { return 'stale'; }
}
function validReportShape(report, law) {
  if (!integer(report.checked, 0, TOTAL) || typeof report.complete !== 'boolean' || !['pass', 'fail', 'inconclusive'].includes(report.outcome)) return false;
  if (report.configuration.caseBudget !== undefined && report.checked > report.configuration.caseBudget) return false;
  const expectedProperties = properties(law);
  if (!Array.isArray(report.properties) || report.properties.length !== expectedProperties.length) return false;
  for (let index = 0; index < expectedProperties.length; index++) {
    const actual = report.properties[index], expected = expectedProperties[index];
    if (!actual || actual.key !== expected.key || actual.label !== expected.label || !['pass', 'fail', 'inconclusive'].includes(actual.outcome)) return false;
  }
  const engine = report.engineTests;
  if (!engine || !integer(engine.checked, 0, 15) || !Array.isArray(engine.fixtures) || engine.fixtures.length !== engine.checked || !['pass', 'fail', 'inconclusive'].includes(engine.outcome)) return false;
  const fixtureNames = ['empty', 'basin', 'hourglass', 'wrap-and-field-seams', 'all-local-patterns'];
  for (let index = 0; index < engine.checked; index++) {
    const fixture = engine.fixtures[index];
    if (!fixture || fixture.name !== fixtureNames[Math.floor(index / 3)] || fixture.tick !== index % 3 + 1 || !['pass', 'fail'].includes(fixture.outcome)) return false;
  }
  if (!Array.isArray(report.witnesses) || report.witnesses.length > expectedProperties.length) return false;
  const seen = new Set();
  for (const witness of report.witnesses) {
    if (!witness || seen.has(witness.property) || !expectedProperties.some(p => p.key === witness.property)) return false;
    seen.add(witness.property);
    vector(witness.before, 4, 0, 3, 'witness input'); vector(witness.after, 4, 0, 3, 'witness output');
    if (!witness.context || !integer(witness.context.direction, 0, 3) || !integer(witness.context.phase, 0, 1)) return false;
    if (witness.ruleId !== null && !report.artifact.program.rules.some(r => r.id === witness.ruleId)) return false;
    if (typeof witness.mirrored !== 'boolean') return false;
  }
  if (!report.complete) return report.outcome === 'inconclusive' && report.properties.every(p => p.outcome === 'inconclusive') && engine.outcome === 'inconclusive';
  if (report.checked !== TOTAL || report.configuration.caseBudget !== TOTAL || engine.checked !== 15 || report.properties.some(p => p.outcome === 'inconclusive')) return false;
  const enginePassed = engine.fixtures.every(f => f.outcome === 'pass');
  if (engine.outcome !== (enginePassed ? 'pass' : 'fail')) return false;
  if (report.properties.some(p => (p.outcome === 'fail') !== seen.has(p.key))) return false;
  return report.outcome === (enginePassed && report.properties.every(p => p.outcome === 'pass') ? 'pass' : 'fail');
}
export function canAdopt(report, artifact, law, lawRevision = 1) {
  return currency(report, artifact, law, lawRevision) === 'current' && report.complete === true && report.outcome === 'pass';
}
