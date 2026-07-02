// ---------------------------------------------------------------------------
// PNG (base64) output - pure JS, no zlib/canvas/Buffer/Java required.
//
// * Renders bars only (grayscale, black on white). Human-readable text is not
//   drawn in PNG mode (use toSVG for the HRI line).
// * Bars are rasterized identically to bwip-js's built-in drawing.
// * The PNG is written by hand as an 8-bit grayscale image whose IDAT is a
//   valid zlib stream built from *uncompressed* DEFLATE blocks (so no
//   compression library is needed). Slightly larger bytes, fully standard.
// ---------------------------------------------------------------------------

// ---- CRC-32 (PNG chunks) --------------------------------------------------
var PNG_CRC_TABLE = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) {
            c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
        }
        t[n] = c >>> 0;
    }
    return t;
})();
function pngCrc32(bytes, start, end) {
    var crc = 0xffffffff;
    for (var i = start; i < end; i++) {
        crc = PNG_CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

// ---- Base64 (pure JS) -----------------------------------------------------
var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64(bytes) {
    var out = '';
    var len = bytes.length;
    var i;
    for (i = 0; i + 2 < len; i += 3) {
        var n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        out += B64[(n >>> 18) & 63] + B64[(n >>> 12) & 63] + B64[(n >>> 6) & 63] + B64[n & 63];
    }
    var rem = len - i;
    if (rem === 1) {
        var a = bytes[i];
        out += B64[(a >>> 2) & 63] + B64[(a << 4) & 63] + '==';
    } else if (rem === 2) {
        var b0 = bytes[i], b1 = bytes[i + 1];
        out += B64[(b0 >>> 2) & 63] + B64[((b0 << 4) | (b1 >>> 4)) & 63] + B64[(b1 << 2) & 63] + '=';
    }
    return out;
}

// ---- Encode an 8-bit grayscale buffer as a PNG (Uint8Array of bytes) ------
// gray[y*width + x] : 0 = black, 255 = white
function encodeGrayPNG(gray, width, height) {
    // 1) Build the raw (filtered) scanline data: each row is prefixed with a
    //    filter-type byte (0 = None).
    var raw = new Uint8Array(height * (width + 1));
    var rp = 0;
    for (var y = 0; y < height; y++) {
        raw[rp++] = 0; // filter: none
        var base = y * width;
        for (var x = 0; x < width; x++) {
            raw[rp++] = gray[base + x];
        }
    }

    // 2) Wrap raw data in a zlib stream using stored (uncompressed) DEFLATE blocks.
    var zlib = deflateStored(raw);

    // 3) Assemble the PNG chunks.
    var sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    var ihdr = new Uint8Array(13);
    writeU32(ihdr, 0, width);
    writeU32(ihdr, 4, height);
    ihdr[8] = 8;   // bit depth
    ihdr[9] = 0;   // color type: grayscale
    ihdr[10] = 0;  // compression
    ihdr[11] = 0;  // filter
    ihdr[12] = 0;  // interlace

    var chunks = [];
    var total = sig.length;
    function addChunk(type, data) {
        var c = buildChunk(type, data);
        chunks.push(c);
        total += c.length;
    }
    addChunk('IHDR', ihdr);
    addChunk('IDAT', zlib);
    addChunk('IEND', new Uint8Array(0));

    var png = new Uint8Array(total);
    var off = 0;
    for (var s = 0; s < sig.length; s++) { png[off++] = sig[s]; }
    for (var c = 0; c < chunks.length; c++) {
        var ck = chunks[c];
        for (var q = 0; q < ck.length; q++) { png[off++] = ck[q]; }
    }
    return png;
}

function writeU32(buf, off, v) {
    buf[off] = (v >>> 24) & 0xff;
    buf[off + 1] = (v >>> 16) & 0xff;
    buf[off + 2] = (v >>> 8) & 0xff;
    buf[off + 3] = v & 0xff;
}

function buildChunk(type, data) {
    var len = data.length;
    var chunk = new Uint8Array(12 + len);
    writeU32(chunk, 0, len);
    chunk[4] = type.charCodeAt(0);
    chunk[5] = type.charCodeAt(1);
    chunk[6] = type.charCodeAt(2);
    chunk[7] = type.charCodeAt(3);
    for (var d = 0; d < len; d++) { chunk[8 + d] = data[d]; }
    var crc = pngCrc32(chunk, 4, 8 + len);
    writeU32(chunk, 8 + len, crc);
    return chunk;
}

// zlib stream = 2-byte header + stored DEFLATE blocks + 4-byte Adler-32.
function deflateStored(data) {
    var len = data.length;
    var MAX = 65535;
    var nblocks = Math.max(1, Math.ceil(len / MAX));
    var out = new Uint8Array(2 + len + nblocks * 5 + 4);
    var o = 0;
    out[o++] = 0x78; // CMF
    out[o++] = 0x01; // FLG (no compression, check bits)

    var pos = 0;
    if (len === 0) {
        out[o++] = 0x01;            // final, stored
        out[o++] = 0; out[o++] = 0; // LEN = 0
        out[o++] = 0xff; out[o++] = 0xff; // NLEN
    } else {
        while (pos < len) {
            var blk = Math.min(MAX, len - pos);
            var last = (pos + blk >= len) ? 1 : 0;
            out[o++] = last;                 // BFINAL + BTYPE(00)
            out[o++] = blk & 0xff;
            out[o++] = (blk >>> 8) & 0xff;
            var nlen = (~blk) & 0xffff;
            out[o++] = nlen & 0xff;
            out[o++] = (nlen >>> 8) & 0xff;
            for (var i = 0; i < blk; i++) {
                out[o++] = data[pos + i];
            }
            pos += blk;
        }
    }

    // Adler-32 of the uncompressed data
    var a = 1, b = 0;
    for (var j = 0; j < len; j++) {
        a = (a + data[j]) % 65521;
        b = (b + a) % 65521;
    }
    out[o++] = (b >>> 8) & 0xff;
    out[o++] = b & 0xff;
    out[o++] = (a >>> 8) & 0xff;
    out[o++] = a & 0xff;

    // `out` was sized exactly, so o === out.length here.
    return out;
}

// ---------------------------------------------------------------------------
// Monochrome raster drawing interface (mirrors bwip-js DrawingBuiltin for the
// primitives a linear barcode uses: line, polygon, fill). Text is ignored.
// ---------------------------------------------------------------------------
function DrawingRaster() {
    var tx0 = 0, tx1 = 0, tx2 = 0, tx3 = 0;
    var ty0 = 0, ty1 = 0, ty2 = 0, ty3 = 0;

    var opts;
    var gray;                    // Uint8Array grayscale buffer
    var gs_width, gs_height;
    var gs_dx, gs_dy;
    var gs_val = 0;              // current ink value (0 = black)
    var xymap;

    function set(x, y, a) {
        x += gs_dx;
        y += gs_dy;
        var px = tx0 * x + tx1 * y + tx2 * (gs_width - 1) + tx3 * (gs_height - 1);
        var py = ty0 * x + ty1 * y + ty2 * (gs_width - 1) + ty3 * (gs_height - 1);
        if (px < 0 || py < 0 || px >= gs_width || py >= gs_height) { return; }
        var idx = py * gs_width + px;
        // black-on-white: darker wins. a is 0..255 coverage of ink `gs_val`.
        var ink = (gs_val * (a / 255) + 255 * (1 - a / 255)) | 0;
        if (ink < gray[idx]) { gray[idx] = ink; }
    }
    function addPoint(x, y) {
        if (xymap.min > y) { xymap.min = y; }
        if (!xymap[y]) { xymap[y] = [x]; } else { xymap[y].push(x); }
    }
    function fillSegment(x0, x1, y) {
        while (x0 <= x1) { set(x0++, y, 255); }
    }
    function evenodd() {
        var ymin = xymap.min;
        var ymax = xymap.length - 1;
        for (var y = ymin; y <= ymax; y++) {
            var pts = xymap[y];
            if (!pts) { continue; }
            pts.sort(function (a, b) { return a - b; });
            var wn = false, xl = 0;
            for (var n = 0; n < pts.length; n++) {
                var x = pts[n];
                if (wn) { fillSegment(xl, x - 1, y); } else { xl = x; }
                wn = !wn;
            }
        }
    }

    return {
        setopts: function (options) { opts = options; },
        // Force integer scaling for crisp bars (like DrawingBuiltin).
        scale: function (sx, sy) { return [(sx | 0) || 1, (sy | 0) || 1]; },
        // No text in PNG mode.
        measure: function () { return { width: 0, ascent: 0, descent: 0 }; },
        init: function (width, height) {
            var padl = opts.paddingleft, padr = opts.paddingright;
            var padt = opts.paddingtop, padb = opts.paddingbottom;
            var rot = opts.rotate || 'N';
            width += padl + padr;
            height += padt + padb;
            switch (rot) {
                case 'R': tx1 = -1; tx2 = 1; ty0 = 1; break;
                case 'I': tx0 = -1; tx2 = 1; ty1 = -1; ty3 = 1; break;
                case 'L': tx1 = 1; ty0 = -1; ty3 = 1; break;
                default: tx0 = ty1 = 1; break;
            }
            var swap = rot == 'L' || rot == 'R';
            gs_width = swap ? height : width;
            gs_height = swap ? width : height;
            gs_dx = padl;
            gs_dy = padt;
            gray = new Uint8Array(gs_width * gs_height);
            var bg = 255;
            if (/^[0-9a-fA-F]{6}$/.test('' + opts.backgroundcolor)) {
                var r = parseInt(opts.backgroundcolor.substr(0, 2), 16);
                var g = parseInt(opts.backgroundcolor.substr(2, 2), 16);
                var b = parseInt(opts.backgroundcolor.substr(4, 2), 16);
                bg = (0.3 * r + 0.59 * g + 0.11 * b) | 0;
            }
            for (var i = 0; i < gray.length; i++) { gray[i] = bg; }
            xymap = []; xymap.min = Infinity;
        },
        line: function (x0, y0, x1, y1, lw, rgb) {
            x0 = x0 | 0; y0 = y0 | 0; x1 = x1 | 0; y1 = y1 | 0;
            lw = Math.round(lw) || 1;
            if (y1 < y0) { var t = y0; y0 = y1; y1 = t; }
            if (x1 < x0) { var u = x0; x0 = x1; x1 = u; }
            gs_val = luminance(rgb);
            var w2 = (lw / 2) | 0;
            if (x0 == x1) {
                x0 = x0 - lw + w2;
                x1 = x1 + w2 - 1;
            } else {
                y0 = y0 - w2;
                y1 = y1 + lw - w2 - 1;
            }
            for (var y = y0; y <= y1; y++) {
                for (var x = x0; x <= x1; x++) { set(x, y, 255); }
            }
        },
        polygon: function (pts) {
            var npts = pts.length;
            for (var j = npts - 1, i = 0; i < npts; j = i++) {
                if (pts[j][0] == pts[i][0]) {
                    var xv = pts[j][0] | 0;
                    var yj = pts[j][1] | 0, yi = pts[i][1] | 0;
                    if (yj > yi) { for (var y = yi + 1; y < yj; y++) { addPoint(xv, y); } }
                    else { for (var y2 = yj + 1; y2 < yi; y2++) { addPoint(xv, y2); } }
                } else {
                    var xj = pts[j][0] | 0, xi = pts[i][0] | 0, yy = pts[j][1] | 0;
                    if (xj < xi) {
                        var yl = pts[j == 0 ? npts - 1 : j - 1][1];
                        var yr = pts[i == npts - 1 ? 0 : i + 1][1];
                        if (yl > yy) { addPoint(xj, yy); }
                        if (yr > yy) { addPoint(xi, yy); }
                    } else {
                        var yl2 = pts[i == npts - 1 ? 0 : i + 1][1];
                        var yr2 = pts[j == 0 ? npts - 1 : j - 1][1];
                        if (yl2 > yy) { addPoint(xi, yy); }
                        if (yr2 > yy) { addPoint(xj, yy); }
                    }
                }
            }
        },
        fill: function (rgb) {
            gs_val = luminance(rgb);
            evenodd();
            xymap = []; xymap.min = Infinity;
        },
        hexagon: function () {},
        ellipse: function () {},
        clip: function () {},
        unclip: function () {},
        text: function () {},
        end: function () {
            return base64(encodeGrayPNG(gray, gs_width, gs_height));
        },
    };

    function luminance(rgb) {
        if (!/^[0-9a-fA-F]{6}$/.test('' + rgb)) { return 0; }
        var r = parseInt(rgb.substr(0, 2), 16);
        var g = parseInt(rgb.substr(2, 2), 16);
        var b = parseInt(rgb.substr(4, 2), 16);
        return (0.3 * r + 0.59 * g + 0.11 * b) | 0;
    }
}

// bwipjs.toPNG(options) -> base64-encoded PNG string (bars only, grayscale)
function ToPNG(opts) {
    // PNG mode renders bars only; never draw the HRI text.
    opts.includetext = false;
    if ('alttext' in opts) { delete opts.alttext; }
    return _Render(bwipp_lookup(opts.bcid), opts, DrawingRaster());
}

api.toPNG = function (options) {
    if (options == null || typeof options !== 'object') {
        throw new Error('bwip-js-slim: an options object with a `text` property is required');
    }
    if (!options.bcid) { options.bcid = 'gs1-128'; }
    return ToPNG(options);
};

// Convenience: returns a data: URL usable directly in <img src=...>
api.toPNGDataURL = function (options) {
    return 'data:image/png;base64,' + api.toPNG(options);
};
