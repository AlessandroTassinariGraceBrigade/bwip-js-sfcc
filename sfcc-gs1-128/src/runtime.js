// ---------------------------------------------------------------------------
// Font-free SVG drawing interface.
//
// Bars are emitted as stroked/filled paths (pixel accurate). The optional
// human-readable line is emitted as an SVG <text> element. Its width is
// pinned with `textLength`/`lengthAdjust` so it stays correctly centered
// regardless of which font the SVG viewer actually has available.
// ---------------------------------------------------------------------------
var SVG_FONT_FAMILY = "OCR-B, OCRB, 'Courier New', monospace";
var OCRB_ADVANCE = 0.6;   // advance width as a fraction of the em (monospace)
var OCRB_ASCENT  = 0.8;   // ascent as a fraction of the font cell height
var OCRB_DESCENT = 0.3;   // descent as a fraction of the font cell height

function svgnum(n) {
    return (n | 0) === n ? '' + n : n.toFixed(2);
}
function xmlesc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function DrawingSVG() {
    // Unrolled x,y rotate/translate matrix
    var tx0 = 0, tx1 = 0, tx2 = 0, tx3 = 0;
    var ty0 = 0, ty1 = 0, ty2 = 0, ty3 = 0;

    var opts;
    var svg = '';
    var path;
    var clipid = '';
    var clips = [];
    var lines = {};
    var scalex, scaley;

    var ELLIPSE_MAGIC = 0.55228475 - 0.00045;

    var gs_width, gs_height;   // image size, in pixels
    var gs_dx, gs_dy;          // x,y translate (padding)

    // translate/rotate a point, returning numeric [x, y]
    function xform(x, y) {
        x += gs_dx;
        y += gs_dy;
        var tx = tx0 * x + tx1 * y + tx2 * (gs_width - 1) + tx3 * (gs_height - 1);
        var ty = ty0 * x + ty1 * y + ty2 * (gs_width - 1) + ty3 * (gs_height - 1);
        return [tx, ty];
    }
    // translate/rotate and return as an SVG coordinate pair string
    function transform(x, y) {
        var p = xform(x, y);
        return svgnum(p[0]) + ' ' + svgnum(p[1]);
    }

    return {
        setopts: function (options) {
            opts = options;
        },
        scale: function (sx, sy) {
            scalex = sx;
            scaley = sy;
        },
        // Approximate OCR-B metrics. The exact rendered width is later pinned
        // in text() via textLength, so centering computed by BWIPP stays valid.
        measure: function (str, font, fwidth, fheight) {
            fwidth = fwidth | 0;
            fheight = fheight | 0;
            var advance = fwidth * OCRB_ADVANCE;
            return {
                width: str.length * advance,
                ascent: fheight * OCRB_ASCENT,
                descent: fheight * OCRB_DESCENT,
            };
        },
        init: function (width, height) {
            var padl = opts.paddingleft;
            var padr = opts.paddingright;
            var padt = opts.paddingtop;
            var padb = opts.paddingbottom;
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
        },
        line: function (x0, y0, x1, y1, lw, rgb) {
            x0 = x0 | 0;
            y0 = y0 | 0;
            x1 = x1 | 0;
            y1 = y1 | 0;
            lw = Math.round(lw) || 1;

            if (lw & 1) {
                if (x0 == x1) {
                    var dx = (scalex & 1) ? -0.5 : 0.5;
                    x0 += dx;
                    x1 += dx;
                }
                if (y0 == y1) {
                    var dy = (scaley & 1) ? -0.5 : 0.5;
                    y0 += dy;
                    y1 += dy;
                }
            }
            if (x0 == x1) {
                y0++;
            } else if (y0 == y1) {
                x0++;
            }

            var key = '' + lw + '#' + rgb;
            if (!lines[key]) {
                lines[key] = '<path stroke="#' + rgb + '" stroke-width="' + lw + '" d="';
            }
            lines[key] += 'M' + transform(x0, y0) + 'L' + transform(x1, y1);
        },
        polygon: function (pts) {
            if (!path) {
                path = '<path d="';
            }
            path += 'M' + transform(pts[0][0], pts[0][1]);
            for (var i = 1, n = pts.length; i < n; i++) {
                var p = pts[i];
                path += 'L' + transform(p[0], p[1]);
            }
            path += 'Z';
        },
        hexagon: function (pts, rgb) {
            this.polygon(pts);
        },
        ellipse: function (x, y, rx, ry, ccw) {
            if (!path) {
                path = '<path d="';
            }
            var dx = rx * ELLIPSE_MAGIC;
            var dy = ry * ELLIPSE_MAGIC;
            path += 'M' + transform(x - rx, y) +
                'C' + transform(x - rx, y - dy) + ' ' +
                transform(x - dx, y - ry) + ' ' +
                transform(x, y - ry) +
                'C' + transform(x + dx, y - ry) + ' ' +
                transform(x + rx, y - dy) + ' ' +
                transform(x + rx, y) +
                'C' + transform(x + rx, y + dy) + ' ' +
                transform(x + dx, y + ry) + ' ' +
                transform(x, y + ry) +
                'C' + transform(x - dx, y + ry) + ' ' +
                transform(x - rx, y + dy) + ' ' +
                transform(x - rx, y) +
                'Z';
        },
        fill: function (rgb) {
            if (path) {
                svg += path + '" fill="#' + rgb + '" fill-rule="evenodd"' +
                    (clipid ? ' clip-path="url(#' + clipid + ')"' : '') +
                    ' />\n';
                path = null;
            }
        },
        clip: function (polys) {
            var p = '<clipPath id="clip' + clips.length + '"><path d="';
            for (var j = 0; j < polys.length; j++) {
                var pts = polys[j];
                p += 'M' + transform(pts[0][0], pts[0][1]);
                for (var i = 1, n = pts.length; i < n; i++) {
                    p += 'L' + transform(pts[i][0], pts[i][1]);
                }
                p += 'Z';
            }
            p += '" clip-rule="nonzero" /></clipPath>';
            clipid = 'clip' + clips.length;
            clips.push(p);
        },
        unclip: function () {
            clipid = '';
        },
        // Human-readable text as a native SVG <text> element.
        text: function (x, y, str, rgb, font) {
            x = x | 0;
            y = y | 0;
            var size = font.height;
            var advance = (font.width | 0) * OCRB_ADVANCE;
            var dx = font.dx | 0;
            var textlen = str.length * advance + (str.length > 1 ? (str.length - 1) * dx : 0);
            var esc = xmlesc(str);
            var p = xform(x, y);
            var attrs = 'font-family="' + SVG_FONT_FAMILY + '"' +
                ' font-size="' + svgnum(size) + '"' +
                ' textLength="' + svgnum(textlen) + '" lengthAdjust="spacingAndGlyphs"' +
                ' fill="#' + rgb + '"';
            if (font.rotate) {
                svg += '<text x="' + svgnum(p[0]) + '" y="' + svgnum(p[1]) + '" ' + attrs +
                    ' transform="rotate(-' + font.rotate + ' ' + svgnum(p[0]) + ' ' + svgnum(p[1]) + ')">' +
                    esc + '</text>\n';
            } else {
                svg += '<text x="' + svgnum(p[0]) + '" y="' + svgnum(p[1]) + '" ' + attrs + '>' +
                    esc + '</text>\n';
            }
        },
        end: function () {
            var linesvg = '';
            for (var key in lines) {
                linesvg += lines[key] + '" />\n';
            }
            var bg = opts.backgroundcolor;
            return '<svg viewBox="0 0 ' + gs_width + ' ' + gs_height + '" xmlns="http://www.w3.org/2000/svg">\n' +
                (clips.length ? '<defs>' + clips.join('') + '</defs>' : '') +
                (/^[0-9A-Fa-f]{6}$/.test('' + bg)
                    ? '<rect width="100%" height="100%" fill="#' + bg + '" />\n'
                    : '') +
                linesvg + svg + '</svg>\n';
        },
    };
}

// ---------------------------------------------------------------------------
// Render pipeline (adapted from bwip-js src/exports.js).
// ---------------------------------------------------------------------------
var BWIPJS_OPTIONS = {
    bcid: 1, text: 1, scale: 1, scaleX: 1, scaleY: 1, rotate: 1,
    padding: 1, paddingwidth: 1, paddingheight: 1,
    paddingtop: 1, paddingleft: 1, paddingright: 1, paddingbottom: 1,
    backgroundcolor: 1,
};

function FixupOptions(opts) {
    var scale = opts.scale || 2;
    var scaleX = opts.scaleX || scale;
    var scaleY = opts.scaleY || scaleX;
    opts.scaleX = scaleX < 1 ? 2 : scaleX;
    opts.scaleY = scaleY < 1 ? opts.scaleX : scaleY;

    opts.paddingleft = padding(opts.paddingleft, opts.paddingwidth, opts.padding, opts.scaleX);
    opts.paddingright = padding(opts.paddingright, opts.paddingwidth, opts.padding, opts.scaleX);
    opts.paddingtop = padding(opts.paddingtop, opts.paddingheight, opts.padding, opts.scaleY);
    opts.paddingbottom = padding(opts.paddingbottom, opts.paddingheight, opts.padding, opts.scaleY);

    if (opts.backgroundcolor) {
        var bgc = '' + opts.backgroundcolor;
        if (/^[0-9a-fA-F]{8}$/.test(bgc)) {
            var c = parseInt(bgc.substr(0, 2), 16) / 255;
            var m = parseInt(bgc.substr(2, 2), 16) / 255;
            var y = parseInt(bgc.substr(4, 2), 16) / 255;
            var k = parseInt(bgc.substr(6, 2), 16) / 255;
            var r = Math.floor((1 - c) * (1 - k) * 255).toString(16);
            var g = Math.floor((1 - m) * (1 - k) * 255).toString(16);
            var b = Math.floor((1 - y) * (1 - k) * 255).toString(16);
            opts.backgroundcolor = (r.length == 1 ? '0' : '') + r +
                (g.length == 1 ? '0' : '') + g +
                (b.length == 1 ? '0' : '') + b;
        } else {
            if (bgc[0] == '#') {
                bgc = bgc.substr(1);
            }
            if (/^[0-9a-fA-F]{6}$/.test(bgc)) {
                opts.backgroundcolor = bgc;
            } else if (/^[0-9a-fA-F]{3}$/.test(bgc)) {
                opts.backgroundcolor = bgc[0] + bgc[0] + bgc[1] + bgc[1] + bgc[2] + bgc[2];
            } else {
                throw new Error('bwip-js: invalid backgroundcolor: ' + opts.backgroundcolor);
            }
        }
    }

    return opts;

    function padding(a, b, c, s) {
        var p;
        if (a != null) {
            p = a | 0;
        } else if (b != null) {
            p = b | 0;
        } else {
            p = c | 0;
        }
        p = p < 0 ? 0 : (p > 999 ? 999 : p);
        return p * s | 0;
    }
}

function _Render(encoder, options, drawing) {
    var text = options.text;
    if (!text) {
        throw new ReferenceError('bwip-js: bar code text not specified.');
    }

    FixupOptions(options);
    if (drawing.setopts) {
        drawing.setopts(options);
    }

    var scaleX = options.scaleX;
    var scaleY = options.scaleY;

    var bw = new BWIPJS(drawing);

    var bwippopts = {};
    for (var id in options) {
        if (!BWIPJS_OPTIONS[id]) {
            bwippopts[id] = options[id];
        }
    }

    if (bwippopts.alttext) {
        bwippopts.includetext = true;
    }
    // bwip-js uses mm for height/width; BWIPP wants inches.
    if (+bwippopts.height) {
        bwippopts.height = bwippopts.height / 25.4 || 0.5;
    }
    if (+bwippopts.width) {
        bwippopts.width = bwippopts.width / 25.4 || 0;
    }

    bw.scale(scaleX, scaleY);
    bwipp_encode(bw, encoder, text, bwippopts);
    return bw.render();
}

// bwipjs.toSVG(options) -> SVG string
function ToSVG(opts) {
    return _Render(bwipp_lookup(opts.bcid), opts, DrawingSVG());
}

var api = {
    // toSVG(options)
    //   options.text            : the GS1 element string, e.g. "(01)09521101530001(3103)000123"
    //   options.includetext     : true to render the human readable line
    //   options.height          : bar height in mm (default 0.5in => ~12.7mm equivalent handled by BWIPP)
    //   options.scale/scaleX/... : integer pixel scale (default 2)
    //   ...plus any other GS1-128 / code128 BWIPP option.
    // Returns an SVG document as a string.
    toSVG: function (options) {
        if (options == null || typeof options !== 'object') {
            throw new Error('bwip-js-slim: an options object with a `text` property is required');
        }
        if (!options.bcid) {
            options.bcid = 'gs1-128';
        }
        return ToSVG(options);
    },
    VERSION: 'bwip-js-slim/gs1-128',
};
