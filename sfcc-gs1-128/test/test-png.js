'use strict';
const zlib = require('zlib');
const slim = require('../dist/gs1-128-svg.js');
const ref = require('../../dist/bwip-js-node.js');

function parsePNG(buf) {
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('bad signature');
    let off = 8, width, height, colortype, bitdepth, idat = [];
    while (off < buf.length) {
        const len = buf.readUInt32BE(off);
        const type = buf.toString('ascii', off + 4, off + 8);
        const data = buf.slice(off + 8, off + 8 + len);
        if (type === 'IHDR') {
            width = data.readUInt32BE(0);
            height = data.readUInt32BE(4);
            bitdepth = data[8];
            colortype = data[9];
        } else if (type === 'IDAT') {
            idat.push(data);
        } else if (type === 'IEND') break;
        off += 12 + len;
    }
    const raw = zlib.inflateSync(Buffer.concat(idat));
    const channels = colortype === 6 ? 4 : colortype === 2 ? 3 : 1;
    const stride = width * channels;
    // unfilter (support filter 0 and Paeth/Sub/Up just in case)
    const out = Buffer.alloc(height * stride);
    let rp = 0;
    for (let y = 0; y < height; y++) {
        const filter = raw[rp++];
        for (let x = 0; x < stride; x++) {
            const rawb = raw[rp++];
            const a = x >= channels ? out[y * stride + x - channels] : 0;
            const b = y > 0 ? out[(y - 1) * stride + x] : 0;
            const c = (x >= channels && y > 0) ? out[(y - 1) * stride + x - channels] : 0;
            let v;
            switch (filter) {
                case 0: v = rawb; break;
                case 1: v = rawb + a; break;
                case 2: v = rawb + b; break;
                case 3: v = rawb + ((a + b) >> 1); break;
                case 4: {
                    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
                    v = rawb + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break;
                }
                default: throw new Error('filter ' + filter);
            }
            out[y * stride + x] = v & 0xff;
        }
    }
    return { width, height, colortype, bitdepth, channels, data: out };
}

function blackMask(png) {
    const { width, height, channels, data } = png;
    const mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const o = (y * width + x) * channels;
            let lum;
            if (channels === 1) lum = data[o];
            else {
                const alpha = channels === 4 ? data[o + 3] : 255;
                // composite over white
                const r = data[o] * (alpha / 255) + 255 * (1 - alpha / 255);
                const g = data[o + 1] * (alpha / 255) + 255 * (1 - alpha / 255);
                const b = data[o + 2] * (alpha / 255) + 255 * (1 - alpha / 255);
                lum = 0.3 * r + 0.59 * g + 0.11 * b;
            }
            mask[y * width + x] = lum < 128 ? 1 : 0;
        }
    }
    return mask;
}

async function main() {
    const cases = [
        { text: '(01)09521101530001(3103)000123' },
        { text: '(10)ABC123(11)210101', height: 15 },
        { text: '(01)09521101530001', scale: 3 },
    ];
    let pass = 0, fail = 0;
    for (const opts of cases) {
        const o = Object.assign({ bcid: 'gs1-128', includetext: false }, opts);
        const slimB64 = slim.toPNG(Object.assign({}, o));
        const slimPng = parsePNG(Buffer.from(slimB64, 'base64'));
        const refBuf = await ref.toBuffer(Object.assign({}, o));
        const refPng = parsePNG(refBuf);

        let ok = slimPng.width === refPng.width && slimPng.height === refPng.height;
        let diff = 0;
        if (ok) {
            const m1 = blackMask(slimPng), m2 = blackMask(refPng);
            for (let i = 0; i < m1.length; i++) if (m1[i] !== m2[i]) diff++;
            ok = diff === 0;
        }
        console.log((ok ? 'MATCH ' : 'DIFFER') +
            ' slim=' + slimPng.width + 'x' + slimPng.height + ' (ct' + slimPng.colortype + ')' +
            ' ref=' + refPng.width + 'x' + refPng.height + ' (ct' + refPng.colortype + ')' +
            (ok ? '' : ' diffPx=' + diff) + '  ' + JSON.stringify(opts));
        ok ? pass++ : fail++;
    }
    console.log('\n' + pass + ' match, ' + fail + ' differ');
    // dump one for inspection
    const out = require('path').join(require('os').tmpdir(), 'gs1-128-sample.png');
    require('fs').writeFileSync(out,
        Buffer.from(slim.toPNG({ bcid: 'gs1-128', text: '(01)09521101530001(3103)000123' }), 'base64'));
    console.log('wrote ' + out);
}
main().catch((e) => { console.error(e); process.exit(1); });
