// build-slim.js
// Extracts the minimal GS1-128 encoder dependency-closure from src/bwipp.js
// and assembles a single, RhinoJS (SFCC compat mode >= 21.2) compatible file
// that renders GS1-128 barcodes as SVG text.
'use strict';
const fs = require('fs');
const path = require('path');

// The upstream bwip-js sources live in the repository root; this build folder
// (src/, dist/) sits one level below it.
const REPO = path.join(__dirname, '..');
const HERE = __dirname;
const src = fs.readFileSync(path.join(REPO, 'src', 'bwipp.js'), 'utf8');
const lines = src.split('\n');

// ---------------------------------------------------------------------------
// 1. Split the file into the runtime "header" and the top-level declarations.
// ---------------------------------------------------------------------------
const headerEnd = lines.findIndex((l) => /^function bwipp_/.test(l));
if (headerEnd < 0) throw new Error('could not locate first bwipp_ function');
const header = lines.slice(0, headerEnd).join('\n');

const markerRe = /^(?:function|const|var|let)\s+([A-Za-z0-9_$]+)/;
const markers = [];
for (let i = headerEnd; i < lines.length; i++) {
    const m = markerRe.exec(lines[i]);
    if (m) markers.push({ name: m[1], line: i });
}

const defs = new Map();
const order = [];
for (let i = 0; i < markers.length; i++) {
    const start = markers[i].line;
    const end = i + 1 < markers.length ? markers[i + 1].line : lines.length;
    defs.set(markers[i].name, { body: lines.slice(start, end).join('\n'), deps: null });
    order.push(markers[i].name);
}

// ---------------------------------------------------------------------------
// 2. Compute the dependency closure starting from bwipp_gs1_128.
// ---------------------------------------------------------------------------
const nameRe = /\b(bwipp_[A-Za-z0-9_]+|_text[A-Za-z0-9_]+)\b/g;
function depsOf(name) {
    const d = defs.get(name);
    if (d.deps) return d.deps;
    const set = new Set();
    let m;
    nameRe.lastIndex = 0;
    while ((m = nameRe.exec(d.body))) {
        if (m[1] !== name && defs.has(m[1])) set.add(m[1]);
    }
    d.deps = set;
    return set;
}

const keep = new Set();
const stack = ['bwipp_gs1_128'];
while (stack.length) {
    const n = stack.pop();
    if (keep.has(n) || !defs.has(n)) continue;
    keep.add(n);
    for (const d of depsOf(n)) stack.push(d);
}
keep.add('bwipp_encode'); // entry shim, references only the passed encoder

const kept = order.filter((n) => keep.has(n));
console.error('kept declarations (' + kept.length + '):\n  ' + kept.join('\n  '));

const bwippBody = kept.map((n) => defs.get(n).body).join('\n');

const lookup = [
    'function bwipp_lookup(symbol) {',
    '    var s = String(symbol == null ? "" : symbol).replace(/-/g, "_");',
    '    if (s === "gs1_128") return bwipp_gs1_128;',
    '    throw new Error("bwip-js-slim: only bcid \'gs1-128\' is supported (got: " + symbol + ")");',
    '}',
].join('\n');

// ---------------------------------------------------------------------------
// 3. The graphics engine (verbatim from src/bwipjs.js).
// ---------------------------------------------------------------------------
const engine = fs.readFileSync(path.join(REPO, 'src', 'bwipjs.js'), 'utf8');

// ---------------------------------------------------------------------------
// SFCC/Rhino cannot patch the sealed Uint8Array prototype, and its native
// subarray() is buggy for chained views. Rewrite every `<ident>.subarray(a,b)`
// call into `$sub(<ident>, a, b)` (see $sub in banner.js). All receivers in the
// runtime/engine are Uint8Array views, so this is safe.
// ---------------------------------------------------------------------------
function rewriteSubarray(code) {
    return code.replace(/([A-Za-z_$][A-Za-z0-9_$]*)\.subarray\(\s*\)/g, '$sub($1)')
        .replace(/([A-Za-z_$][A-Za-z0-9_$]*)\.subarray\(/g, function (_, recv) {
            return '$sub(' + recv + ', ';
        });
}

// ---------------------------------------------------------------------------
// 4. Font-free SVG drawing interface + render pipeline + public API.
// ---------------------------------------------------------------------------
const wrapper = fs.readFileSync(path.join(HERE, 'src', 'runtime.js'), 'utf8');
const png = fs.readFileSync(path.join(HERE, 'src', 'png.js'), 'utf8');
const banner = fs.readFileSync(path.join(HERE, 'src', 'banner.js'), 'utf8');
const footer = fs.readFileSync(path.join(HERE, 'src', 'footer.js'), 'utf8');

const out = [
    banner,
    rewriteSubarray(header),
    rewriteSubarray(bwippBody),
    lookup,
    rewriteSubarray(engine),
    wrapper,
    png,
    footer,
].join('\n\n');

const outdir = path.join(HERE, 'dist');
fs.mkdirSync(outdir, { recursive: true });
const outfile = path.join(outdir, 'gs1-128-svg.js');
fs.writeFileSync(outfile, out);
console.error('\nwrote ' + outfile + ' (' + out.length + ' bytes)');
