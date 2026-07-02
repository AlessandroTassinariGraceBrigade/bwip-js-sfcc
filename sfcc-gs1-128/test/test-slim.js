'use strict';
const slim = require('../dist/gs1-128-svg.js');
const ref = require('../../dist/bwip-js.js');

const cases = [
    { text: '(01)09521101530001(3103)000123', includetext: true },
    { text: '(01)09521101530001', includetext: true },
    { text: '(10)ABC123(11)210101', includetext: true, height: 15 },
    { text: '(00)095210000000000029', includetext: false },
    { text: '(01)09521101530001', includetext: true, rotate: 'N', scale: 3,
      backgroundcolor: 'FFFF00', barcolor: '0000FF' },
];

function bars(svg) {
    // extract the stroked bar paths (the geometry that must match exactly)
    return (svg.match(/<path stroke=[^>]*\/>/g) || []).join('\n');
}

let pass = 0, fail = 0;
for (const opts of cases) {
    let s, r;
    try {
        s = slim.toSVG(Object.assign({ bcid: 'gs1-128' }, opts));
    } catch (e) {
        console.log('SLIM ERROR for', JSON.stringify(opts), '->', e.message);
        fail++; continue;
    }
    try {
        r = ref.toSVG(Object.assign({ bcid: 'gs1-128' }, opts));
    } catch (e) {
        console.log('REF ERROR for', JSON.stringify(opts), '->', e.message);
        continue;
    }
    const same = bars(s) === bars(r);
    console.log((same ? 'BARS-MATCH ' : 'BARS-DIFFER') + '  ' + JSON.stringify(opts));
    if (same) pass++; else {
        fail++;
        console.log('  slim viewBox:', (s.match(/viewBox="[^"]*"/) || [])[0]);
        console.log('  ref  viewBox:', (r.match(/viewBox="[^"]*"/) || [])[0]);
    }
}
console.log('\n' + pass + ' matched, ' + fail + ' failed');

// dump a sample for visual inspection
const path = require('path');
const os = require('os');
const sample = slim.toSVG({ text: '(01)09521101530001(3103)000123', includetext: true });
const out = path.join(os.tmpdir(), 'gs1-128-sample.svg');
require('fs').writeFileSync(out, sample);
console.log('wrote ' + out + ' (' + sample.length + ' bytes)');
