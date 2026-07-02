// =====================================================================
// bwip-js-slim : GS1-128 -> SVG (single file)
//
// A trimmed-down, single-file build of bwip-js that ONLY supports:
//   * input  format : gs1-128  (bcid: "gs1-128")
//   * output format : SVG returned as a string
//
// Target runtime: Salesforce B2C Commerce (SFCC) cartridge code running on
// Rhino. Requires SFCC compatibility mode 21.2 or later (Rhino 1.7.13+,
// VERSION_ES6) which provides Map/Set, typed arrays and arrow functions.
//
// Human-readable text (option `includetext`) is rendered as native SVG
// <text> elements (font-family OCR-B, monospace fallback) instead of
// embedding a font, so the bundle stays small and font-free.
//
// Derived from bwip-js (https://github.com/metafloor/bwip-js), MIT License.
// Copyright (c) 2011-2026 Mark Warren / Copyright (c) 2004-2024 Terry Burton.
// =====================================================================
(function (root, factory) {
    var api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else if (typeof exports !== 'undefined') {
        exports.BwipGs1128 = api;
    } else if (root) {
        root.BwipGs1128 = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {

    // --- Rhino typed-array fix -------------------------------------------
    // Rhino (used by SFCC) has a bug where Uint8Array.prototype.subarray on an
    // already-sliced view ignores the parent view's byteOffset, so chained
    // subarray() calls corrupt the data. SFCC also SEALS the built-in
    // prototypes, so we cannot patch subarray in place. Instead the build step
    // rewrites every `x.subarray(a, b)` call to `$sub(x, a, b)`, using this
    // correct implementation built on the (working) TypedArray constructor.
    // It is correct on every engine, so it is always used.
    function $sub(v, begin, end) {
        var len = v.length;
        if (begin === undefined) { begin = 0; }
        else if (begin < 0) { begin = len + begin; if (begin < 0) { begin = 0; } }
        else if (begin > len) { begin = len; }
        if (end === undefined) { end = len; }
        else if (end < 0) { end = len + end; if (end < 0) { end = 0; } }
        else if (end > len) { end = len; }
        var n = end - begin;
        if (n < 0) { n = 0; }
        return new Uint8Array(v.buffer, v.byteOffset + begin, n);
    }

    // --- tiny polyfill: only needed on pre-21.2 SFCC compatibility modes ---
    if (typeof Object.assign !== 'function') {
        Object.assign = function (target) {
            if (target == null) { throw new TypeError('Object.assign: null target'); }
            var to = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var nextSource = arguments[i];
                if (nextSource == null) { continue; }
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
            return to;
        };
    }


// bwip-js // Barcode Writer in Pure JavaScript
// https://github.com/metafloor/bwip-js
//
// This code was automatically generated from:
// Barcode Writer in Pure PostScript - Version 2026-05-28
//
// Copyright (c) 2011-2026 Mark Warren
// Copyright (c) 2004-2024 Terry Burton
//
// Licensed MIT. See the LICENSE file in the bwip-js root directory.
// bwip-js/barcode-hdr.js
//
// This code is injected above the cross-compiled barcode.js.

var $$ = null; // The BWIPJS object (graphics interface)
var $j = 0; // stack pointer
var $k = []; // operand stack
var $_ = {}; // base of the dictionary stack

// If you add a global variable here, add it to bwippdefs in psc.js replacing the
// bwipp_ prefix with $-sign.
// All globals must be referenced with $-sign prefix in the ps code.  They are handled
// special in the cross-compiler.
var bwipp_enabledontdraw = false; // Used by the BWIPP pstests - always false in production
var bwipp_error = new Map; // The postscript system error dict

// Aliases from Math ops
const $abs = Math.abs;
const $ceil = Math.ceil;
const $flr = Math.floor;
const $log = Math.log;
const $pow = Math.pow
const $rnd = Math.round;
const $sqrt = Math.sqrt;

// Code instrumenting
const $metrics = {};

// Array ctor
//  $a()    : Build a new array up to the Infinity-marker on the stack.
//  $a(arr) : Convert native array to a "view" of the array.
//  $a(len) : Create a new array of length `len`
function $a(a) {
    if (!arguments.length) {
        for (var i = $j - 1; i >= 0 && $k[i] !== Infinity; i--);
        if (i < 0) {
            throw new Error('array-marker-not-found');
        }
        a = $k.splice(i + 1, $j - 1 - i);
        $j = i;
    } else if (!(a instanceof Array)) {
        var len = arguments[0] | 0;
        if (len >= 1 << 24) {
            throw new Error('array-size-limit');
        }
        a = new Array(len);
        for (var i = 0; i < len; i++) {
            a[i] = null;
        }
    }
    a.b = a; // base array
    a.o = 0; // offset into base
    return a;
}

// dict ctor
//  $d() : look for the Infinity marker on the stack
function $d() {
    // Build the dictionary in the order the keys/values were pushed so enumeration
    // occurs in the correct sequence.
    for (var mark = $j - 1; mark >= 0 && $k[mark] !== Infinity; mark -= 2) {
        if ($k[mark - 1] === Infinity) {
            throw new Error('dict-malformed-stack');
        }
    }
    if (mark < 0) {
        throw new Error('dict-marker-not-found');
    }
    var d = new Map;
    for (var i = mark + 1; i < $j; i += 2) {
        // Unlike javascript, postscript dict keys differentiate between
        // numbers and the string representation of a number.
        var k = $k[i]; // "key" into the dict entry
        var t = typeof k;
        if (t == 'number' || t == 'string') {
            d.set(k, $k[i + 1]);
        } else if (k instanceof Uint8Array) {
            d.set($z(k), $k[i + 1]);
        } else {
            throw new Error('dict-not-a-valid-key(' + k + ')');
        }
    }
    $j = mark;
    return d;
}

// string ctor
//  s(number)   : create zero-filled string of number-length
//  s(string)   : make a copy of the string
//  s(uint8[])  : make a copy of the string
//
// Returns a Uint8Array-string.
function $s(v) {
    var t = typeof v;
    if (t === 'number') {
        return new Uint8Array(v);
    }
    if (t !== 'string') {
        v = '' + v;
    }
    var s = new Uint8Array(v.length);
    for (var i = 0, l = v.length; i < l; i++) {
        s[i] = v.charCodeAt(i);
    }
    return s;
}

// ... n c roll
function $r(n, c) {
    if ($j < n) {
        throw new Error('roll: --stack-underflow--');
    }
    if (!c) {
        return;
    }
    if (c < 0) {
        var t = $k.splice($j - n, -c);
    } else {
        var t = $k.splice($j - n, n - c);
    }
    $k.splice.apply($k, [$j - t.length, 0].concat(t));
}

// Primarily designed to convert uint8-string to string, but will call the
// the toString() method on any value.
function $z(s) {
    if (s instanceof Uint8Array) {
        return String.fromCharCode.apply(null, s);
    }
    return '' + s;
}

// Copies source to dest and returns a view of just the copied characters
function $strcpy(dst, src) {
    if (typeof dst === 'string') {
        dst = $s(dst);
    }
    if (src instanceof Uint8Array) {
        for (var i = 0, l = src.length; i < l; i++) {
            dst[i] = src[i];
        }
    } else {
        for (var i = 0, l = src.length; i < l; i++) {
            dst[i] = src.charCodeAt(i);
        }
    }
    return src.length < dst.length ? $sub(dst, 0, src.length) : dst;
}

// Copies source to dest and should (but doesn't) return a view of just the copied elements
function $arrcpy(dst, src) {
    for (var i = 0, l = src.length; i < l; i++) {
        dst[i] = src[i];
    }
    dst.length = src.length;
    return dst;
}

// cvs operator - convert a value to its string representation
//  s : string to store into
//  v : any value
function $cvs(s, v) {
    var t = typeof v;
    if (t == 'number' || t == 'boolean' || v === null) {
        v = '' + v;
    } else if (t !== 'string') {
        v = '--nostringval--';
    }
    for (var i = 0, l = v.length; i < l; i++) {
        s[i] = v.charCodeAt(i);
    }
    return i < s.length ? $sub(s, 0, i) : s;
}
// cvi operator - converts a numeric string value to integer/real.
function $cvi(s) {
    if (s instanceof Uint8Array) {
        // nul-chars on the end of a string are ignored by postscript but cause javascript
        // to return a zero result.
        return $flr(String.fromCharCode.apply(null, s).replace(/\0+$/, ''));
    }
    return $flr('' + s);
}

// cvrs operator - convert a number to a radix string
//  s : string to store into
//  n : number
//  r : radix
function $cvrs(s, n, r) {
    return $strcpy(s, (~~n).toString(r).toUpperCase());
}

// cvx operator
// BWIPP uses this to bind a function to ...args
// The operand must be an array with a function as its last element.
// All other elements get pushed on the stack before invoking the
// function.
function $cvx(a) {
    if (!(a instanceof Array)) {
        throw new Error('cvx: not arraytype');
    }
    if (typeof a[a.length - 1] !== 'function') {
        throw new Error('cvx: last array element not function');
    }
    const last = a.length - 1;
    return function() {
        for (let i = 0; i < last; i++) {
            $k[$j++] = a[i];
        }
        a[last]();
    };
}


// get operator
//  s : source
//  k : key
function $get(s, k) {
    if (s instanceof Uint8Array) {
        return s[k];
    }
    if (typeof s === 'string') {
        return s.charCodeAt(k);
    }
    if (s instanceof Array) {
        return s.b[s.o + k];
    }
    // Map or Object - need a string key
    if (k instanceof Uint8Array) {
        k = $z(k);
    }
    if (s instanceof Map) {
        return s.get(k);
    }
    return s[k];
}

// known operator
function $has(v, k) {
    if (v instanceof Uint8Array) {
        return k < v.length;
    }
    if (typeof v === 'string') {
        return k < v.length;
    }
    if (v instanceof Array) {
        return k < v.length;
    }
    // Map or Object - need a string key
    if (k instanceof Uint8Array) {
        k = $z(k);
    }
    if (v instanceof Map) {
        return v.has(k);
    }
    return k in v;
}

// undef operator
//  d : dict
//  k : key
function $del(d, k) {
    if (d instanceof Map) {
        if (k instanceof Uint8Array) {
            d.delete($z(k));
        } else {
            d.delete(k);
        }
    } else if (typeof d == 'object') {
        if (k instanceof Uint8Array) {
            delete d[$z(k)];
        } else {
            delete d[k];
        }
    } else {
        throw new Error('undef-not-a-dict-' + (typeof d));
    }
}

// put operator
//  d : dest
//  k : key
//  v : value
function $put(d, k, v) {
    if (d instanceof Uint8Array) {
        d[k] = v;
    } else if (d instanceof Array) {
        d.b[d.o + k] = v;
    } else if (d instanceof Map) {
        if (k instanceof Uint8Array) {
            d.set($z(k), v);
        } else {
            d.set(k, v);
        }
    } else if (typeof d == 'object') {
        if (k instanceof Uint8Array) {
            d[$z(k)] = v;
        } else {
            d[k] = v;
        }
    } else {
        throw new Error('put-not-writable-' + (typeof d));
    }
}

// getinterval operator
//  s : src
//  o : offset
//  l : length
function $geti(s, o, l) {
    if (s instanceof Uint8Array) {
        return $sub(s, o, o + l);
    }
    if (s instanceof Array) {
        var a = new Array(l);
        a.b = s.b; // base array
        a.o = s.o + o; // offset into base
        return a;
    }
    // Must be a string
    return s.substr(o, l);
}

// putinterval operator
//  d : dst
//  o : offset
//  s : src
function $puti(d, o, s) {
    if (d instanceof Uint8Array) {
        if (typeof s == 'string') {
            for (var i = 0, l = s.length; i < l; i++) {
                d[o + i] = s.charCodeAt(i);
            }
        } else {
            // When both d and s are the same, we want to copy
            // backwards, which works for the general case as well.
            for (var i = s.length - 1; i >= 0; i--) {
                d[o + i] = s[i];
            }
        }
    } else if (d instanceof Array) {
        // Operate on the base arrays
        var darr = d.b;
        var doff = o + d.o;
        var sarr = s.b;
        var soff = s.o;

        for (var i = 0, l = s.length; i < l; i++) {
            darr[doff + i] = sarr[soff + i];
        }
    } else {
        throw new Error('putinterval-not-writable-' + (typeof d));
    }
}

// see rendertext
function $splay() {
    var map = $k[--$j];
    for (var keys = map.keys(), i = 0, l = map.size; i < l; i++) {
        var id = keys.next().value;
        if (id && typeof id === 'string') {
            $_[id] = map.get(id);
        }
    }
}

// type operator
function $type(v) {
    // null can be mis-typed - get it out of the way
    if (v == null) {
        return 'nulltype';
    }
    var t = typeof v;
    if (t == 'number') {
        if (isFinite(v)) {
            return v % 1 ? 'realtype' : 'integertype';
        }
        return 'marktype';
    }
    if (t == 'boolean') {
        return 'booleantype';
    }
    if (t == 'string' || v instanceof Uint8Array) {
        return 'stringtype';
    }
    if (t == 'function') {
        return 'operatortype';
    }
    if (v instanceof Array) {
        return 'arraytype';
    }
    return 'dicttype';
    // filetype
    // fonttype
    // gstatetype
    // nametype
    // savetype
}

// anchorsearch operator
//      string seek anchorsearch suffix seek true %if-found
//                               string false     %if-not-found
function $anchorsearch(str, seek) {
    if (!(str instanceof Uint8Array)) {
        str = $s(str);
    }
    var i = 0,
        ls = str.length,
        lk = seek.length;

    // Optimize for single characters.
    if (lk == 1) {
        var cd = seek instanceof Uint8Array ? seek[0] : seek.charCodeAt(0);
        i = str[0] == cd ? 1 : ls;
    } else if (seek.length <= ls) {
        // Slow path,
        if (!(seek instanceof Uint8Array)) {
            seek = $s(seek);
        }
        for (; i < lk && str[i] == seek[i]; i++);
    }
    if (i == lk) {
        $k[$j++] = $sub(str, lk);
        $k[$j++] = $sub(str, 0, lk);
        $k[$j++] = true;
    } else {
        $k[$j++] = str;
        $k[$j++] = false;
    }
}

// search operator
//      string seek search suffix match prefix true %if-found
//                         string false             %if-not-found
function $search(str, seek) {
    if (!(str instanceof Uint8Array)) {
        str = $s(str);
    }
    var ls = str.length;

    // Virtually all uses of search in BWIPP are for single-characters.
    // Optimize for that case.
    if (seek.length == 1) {
        var lk = 1;
        var cd = seek instanceof Uint8Array ? seek[0] : seek.charCodeAt(0);
        for (var i = 0; i < ls && str[i] != cd; i++);
    } else {
        // Slow path,
        if (!(seek instanceof Uint8Array)) {
            seek = $s(seek);
        }
        var lk = seek.length;
        var cd = seek[0];
        for (var i = 0; i < ls && str[i] != cd; i++);
        while (i < ls) {
            for (var j = 1; j < lk && str[i + j] === seek[j]; j++);
            if (j === lk) {
                break;
            }
            for (i++; i < ls && str[i] != cd; i++);
        }
    }
    if (i < ls) {
        $k[$j++] = $sub(str, i + lk);
        $k[$j++] = $sub(str, i, i + lk);
        $k[$j++] = $sub(str, 0, i);
        $k[$j++] = true;
    } else {
        $k[$j++] = str;
        $k[$j++] = false;
    }
}

// The callback is omitted when forall is being used just to push onto the
// stack.  The callback normally returns undefined.  A return of true means break.
function $forall(o, cb) {
    if (o instanceof Uint8Array) {
        for (var i = 0, l = o.length; i < l; i++) {
            $k[$j++] = o[i];
            if (cb && cb()) break;
        }
    } else if (o instanceof Array) {
        // The array may be a view.
        for (var a = o.b, i = o.o, l = o.o + o.length; i < l; i++) {
            $k[$j++] = a[i];
            if (cb && cb()) break;
        }
    } else if (typeof o === 'string') {
        for (var i = 0, l = o.length; i < l; i++) {
            $k[$j++] = o.charCodeAt(i);
            if (cb && cb()) break;
        }
    } else if (o instanceof Map) {
        for (var keys = o.keys(), i = 0, l = o.size; i < l; i++) {
            var id = keys.next().value;
            $k[$j++] = id;
            $k[$j++] = o.get(id);
            if (cb && cb()) break;
        }
    } else {
        for (var id in o) {
            $k[$j++] = id;
            $k[$j++] = o[id];
            if (cb && cb()) break;
        }
    }
}

function $cleartomark() {
    while ($j > 0 && $k[--$j] !== Infinity);
}

function $counttomark() {
    for (var i = $j - 1; i >= 0 && $k[i] !== Infinity; i--);
    return $j - i - 1;
}

function $aload(a) {
    for (var i = 0, l = a.length, b = a.b, o = a.o; i < l; i++) {
        $k[$j++] = b[o + i];
    }
    // This push has been optimized out.  See $.aload() in psc.js.
    //$k[$j++] = a;
}

function $astore(a) {
    for (var i = 0, l = a.length, b = a.b, o = a.o + l - 1; i < l; i++) {
        b[o - i] = $k[--$j];
    }
    $k[$j++] = a;
}

function $eq(a, b) {
    if (typeof a === 'string' && typeof b === 'string') {
        return a == b;
    }
    if (a instanceof Uint8Array && b instanceof Uint8Array) {
        if (a.length != b.length) {
            return false;
        }
        for (var i = 0, l = a.length; i < l; i++) {
            if (a[i] != b[i]) {
                return false;
            }
        }
        return true;
    }
    if (a instanceof Uint8Array && typeof b === 'string' ||
        b instanceof Uint8Array && typeof a === 'string') {
        if (a instanceof Uint8Array) {
            a = $z(a);
        } else {
            b = $z(b);
        }
        return a == b;
    }
    return a == b;
}

function $ne(a, b) {
    return !$eq(a, b);
}

function $lt(a, b) {
    if (a instanceof Uint8Array) {
        a = $z(a);
    }
    if (b instanceof Uint8Array) {
        b = $z(b);
    }
    return a < b;
}

function $le(a, b) {
    if (a instanceof Uint8Array) {
        a = $z(a);
    }
    if (b instanceof Uint8Array) {
        b = $z(b);
    }
    return a <= b;
}

function $gt(a, b) {
    if (a instanceof Uint8Array) {
        a = $z(a);
    }
    if (b instanceof Uint8Array) {
        b = $z(b);
    }
    return a > b;
}

function $ge(a, b) {
    if (a instanceof Uint8Array) {
        a = $z(a);
    }
    if (b instanceof Uint8Array) {
        b = $z(b);
    }
    return a >= b;
}

function $an(a, b) { // and
    return (typeof a === 'boolean') ? a && b : a & b;
}

function $or(a, b) { // or
    return (typeof a === 'boolean') ? a || b : a | b;
}

function $xo(a, b) { // xor
    return (typeof a === 'boolean') ? a != b : a ^ b;
}

function $nt(a) {
    return typeof a == 'boolean' ? !a : ~a;
}

function $bs(v, n) {
    // 64-bit shifts
    return n < 0 ? $flr(v / $pow(2, -n)) : v * $pow(2, n);
}
// emulate single-precision floating-point.  This is not Math.fround().
// More like ffloor()...
var $f = (function(fa) {
    return (v) => {
        //return Number.isInteger(v) ? v : (fa[0] = v, fa[0]);
        return (v | 0) == v ? v : (fa[0] = v, fa[0]);
    };
})(new Float32Array(1));

// This is a replacement for the BWIPP raiseerror function.

function bwipp_raiseerror() {
    var info = $k[--$j];
    var name = $k[--$j];
    bwipp_error.set('errorname', name);
    bwipp_error.set('errorinfo', info);

    if (typeof info == 'string' || info instanceof Uint8Array) {
        throw new Error($z(name) + ": " + $z(info));
    } else {
        throw $z(name);
    }
}

// This list was taken from BWIPP 2026-03-31
const _textOptions = new Map([
    ['', ""],
    ['subspace', ""],
    ['split', ""],
    ['linegaps', 1.2],
    ['color', "unset"],
    ['xalign', "left"],
    ['yalign', "above"],
    ['direction', "forward"],
    ['font', "OCR-B"],
    ['size', 10.0],
    ['xoffset', 0.0],
    ['yoffset', 0.0],
    ['gaps', 0.0],
]);


// processoptions.generate
// The BWIPP code uses currentdict as a user dict, which we do not support.
// It also pulls in render.groupoptions which is not visible due to the
// code transforms.
function bwipp_inittextoptions() {
    for (var grp = 1; grp <= 9; grp++) {
        var map = _textOptions;
        for (var keys = map.keys(), i = 0, l = map.size; i < l; i++) {
            var id = keys.next().value;
            $_['text' + grp + id] = map.get(id);
        }
    }
}

// processoptions.collectgroup
function bwipp_grouptextoptions() {
    var a = $a(9);
    var map = _textOptions;
    for (var grp = 1; grp <= 9; grp++) {
        var dict = new Map;
        var pfx = 'text' + grp;
        for (var keys = map.keys(), i = 0, l = map.size; i < l; i++) {
            var id = keys.next().value;
            dict.set(id, $_[pfx + id]);
        }
        $put(a, grp - 1, dict);
    }
    $k[$j++] = a;
}

// This list was taken from BWIPP 2026-03-31
const _textAliases = {
    alttext: 'text1',
    alttextsubspace: 'text1subspace',
    alttextsplit: 'text1split',
    textsubspace: 'text1subspace',
    textsplit: 'text1split',
    textlinegaps: 'text1linegaps',
    textcolor: 'text1color',
    textxalign: 'text1xalign',
    textyalign: 'text1yalign',
    textdirection: 'text1direction',
    textfont: 'text1font',
    textsize: 'text1size',
    textxoffset: 'text1xoffset',
    textyoffset: 'text1yoffset',
    textgaps: 'text1gaps',

    extratext: 'text2',
    extratextsubspace: 'text2subspace',
    extratextsplit: 'text2split',
    extratextlinegaps: 'text2linegaps',
    extratextcolor: 'text2color',
    extratextxalign: 'text2xalign',
    extratextyalign: 'text2yalign',
    extratextdirection: 'text2direction',
    extratextfont: 'text2font',
    extratextsize: 'text2size',
    extratextxoffset: 'text2xoffset',
    extratextyoffset: 'text2yoffset',
    extratextgaps: 'text2gaps',
};

// This is a replacement for the BWIPP processoptions function.
// We cannot use the BWIPP version for several reasons:
// - legacy code allows strings to be numbers and numbers to be strings
// - in javascript, there is no way to tell the difference between a real
//   number that is an integer, and an actual integer.
// - (alt|extra)text must be uint8array due to the bwipp option 
//   (alt|extra)subspace, which requires the text to be writable.
//
// Invoked as:
//      options supaliases //processoptions exec -> options
//
// supaliases is often null
function bwipp_processoptions() {
    var sups = $k[--$j];
    var opts = $k[$j - 1];
    if (opts instanceof Uint8Array) {
        opts = $z(opts);
    }
    if (typeof opts === 'string') {
        let vals = opts.trim().split(/ +/g)
        $k[$j - 1] = opts = new Map();
        for (let i = 0; i < vals.length; i++) {
            let pair = vals[i].split('=');
            if (pair.length === 1) {
                opts.set(pair[0], true);
            } else {
                opts.set(pair[0], pair[1]);
            }
        }
    }
    // BWIPP does not raiseerror on these (text1* and text2* override alttext* and extratext*)
    if (opts.has('alttext') && opts.has('text1')) {
        throw new Error('bwipp.invalidTextOptions: alttext and text1 are mutually exclusive');
    }
    if (opts.has('extratext') && opts.has('text2')) {
        throw new Error('bwipp.invalidTextOptions: extratext and text2 are mutually exclusive');
    }
    // alttext* -> text1*, extratext* -> text2*
    for (var keys = opts.keys(), i = 0, l = opts.size; i < l; i++) {
        var id = keys.next().value;
        if (sups && sups[id]) {
            opts.set(sups[id], opts.get(id));
        } else if (_textAliases[id]) {
            opts.set(_textAliases[id], opts.get(id));
            if (/^(?:alt|extra)text/.test(id)) {
                opts.delete(id);
            }
        }
    }
    for (var id in $_) {
        if (!opts.has(id)) {
            continue;
        }
        var val = opts.get(id);
        var def = $_[id];
        var typ = typeof def;

        // null is a placeholder for realtype
        if (def === null || typ == 'number') {
            // Allow numeric strings to be numbers
            if (!isFinite(+val)) {
                throw new Error('bwipp.invalidOptionType: ' + id +
                    ': not a realtype: ' + val);
            }
            if (typeof val == 'string') {
                val = +val;
                opts.set(id, val);
            }
        } else if (typ == 'boolean') {
            if (val !== true && val !== false) {
                // In keeping with the ethos of javascript, allow a more relaxed
                // interpretation of boolean.
                if (val == null || (val | 0) === val) {
                    val = !!val;
                } else if (val === 'true') {
                    val = true;
                } else if (val === 'false') {
                    val = false;
                } else {
                    throw new Error('bwipp.invalidOptionType: ' + id +
                        ': not a booleantype: ' + val);
                }
                opts.set(id, val);
            }
        } else if (typ == 'string' || def instanceof Uint8Array) {
            // Allow numbers to be strings
            if (typeof val == 'number') {
                val = '' + val;
                opts.set(id, val);
            } else if (/^text\d$/.test(id) && typeof val === 'string') {
                // BWIPP 2025-06-13 introduced textsubspace which allows replacing
                // a marker character with space.  This requires the text to be a
                // uint8array otherwise we get
                //      Error: put-not-writable-string
                val = $s(val);
                opts.set(id, val);
            } else if (typeof val != 'string' && !(val instanceof Uint8Array)) {
                throw new Error('bwipp.invalidOptionType: ' + id +
                    ': not a stringtype: ' + val);
            }
        } else if (Object.prototype.toString.call(val) !== Object.prototype.toString.call(def)) {
            var m = /\[object (\w+)\]/.exec(Object.prototype.toString.call(def)) || [, 'unknown'];
            throw new Error('bwipp.invalidOptionType: ' + id + ': expected ' + m[1].toLowerCase() + 'type');
        }
        // Set the option into the dictionary
        $_[id] = val;
    }
}

// Replacement for fifocache constructor.  We can't use the postscript version
// because it creates a user defined dict << ... >>> and fetch installs it as
// the current dictionary...
//    /fifocache {
//        8 dict begin
//    
//        /limit exch def
//        /max exch def
//        /cache max dict def
//        /fifo max array def
//        /state << /head 0 /cnt 0 /total 0 >> def
//        /fetch currentdict [
//            exch { //fifocache.fetch exec } aload pop
//        ] cvx def
//    
//        currentdict  % Leave this on the stack
//        end
//    } bind def
function bwipp_parseinput() {
    if (!bwipp_parseinput.globals) {
        var $__ = $_;
        $_ = bwipp_parseinput.globals = {};
        //#413
        $k[$j++] = Infinity; //#425
        var _0 = $a(['NUL', 'SOH', 'STX', 'ETX', 'EOT', 'ENQ', 'ACK', 'BEL', 'BS', 'TAB', 'LF', 'VT', 'FF', 'CR', "", "", 'DLE', 'DC1', 'DC2', 'DC3', 'DC4', 'NAK', 'SYN', 'ETB', 'CAN', 'EM', 'SUB', 'ESC', 'FS', 'GS', 'RS', 'US']); //#430
        $k[$j++] = 0; //#434
        for (var _1 = 0, _2 = _0.length; _1 < _2; _1++) { //#434
            var _4 = $k[--$j]; //#433
            $k[$j++] = $get(_0, _1); //#433
            $k[$j++] = _4; //#433
            $k[$j++] = _4 + 1; //#433
        } //#433
        $j--; //#434
        $_.ctrl = $d(); //#434
        $_ = $__;
    }
    //#451
    var $__ = $_; //#453
    $_ = Object.assign({}, $_, bwipp_parseinput.globals); //#453
    var _5 = $k[--$j]; //#456
    $_.fncvals = _5; //#456
    var _6 = $k[--$j]; //#457
    $_.barcode = _6; //#457
    $_.parse = $get($_.fncvals, 'parse'); //#459
    $del($_.fncvals, 'parse') //#459
    $_.parsefnc = $get($_.fncvals, 'parsefnc'); //#460
    $del($_.fncvals, 'parsefnc') //#460
    $_.parseonly = $has($_.fncvals, 'parseonly'); //#461
    $del($_.fncvals, 'parseonly') //#461
    $_.eci = $has($_.fncvals, 'eci'); //#462
    $del($_.fncvals, 'eci') //#462
    $_.msg = $a($_.barcode.length); //#466
    $_.j = 0; //#467
    $k[$j++] = $_.barcode; //#590
    for (;;) { //#590
        var _M = $k[--$j]; //#469
        $search(_M, "^"); //#469
        var _N = $k[--$j]; //#469
        var _O = $k[--$j]; //#469
        var _X = _O.length; //#472
        var _V = $_.msg; //#472
        var _U = $_.j; //#472
        $k[$j++] = Infinity; //#472
        $forall(_O); //#472
        var _T = $a(); //#472
        $puti(_V, _U, _T); //#472
        $_.j = $f(_X + $_.j) //#473
        if (_N) { //#588
            $j--; //#475
            for (var _Z = 0; _Z < 1; _Z++) { //#586
                if (!$_.parse && !$_.parsefnc) { //#482
                    $put($_.msg, $_.j, 94); //#479
                    $_.j = $_.j + 1; //#480
                    break; //#481
                } //#481
                $put($_.msg, $_.j, 94); //#485
                $_.j = $_.j + 1; //#486
                if ($_.parse) { //#529
                    var _j = $k[$j - 1]; //#490
                    if (_j.length >= 3) { //#501
                        var _k = $k[$j - 1]; //#491
                        var _l = $geti(_k, 0, 3); //#491
                        var _m = $_.ctrl; //#491
                        var _n = $has(_m, _l); //#492
                        $k[$j++] = _m; //#500
                        $k[$j++] = _l; //#500
                        if (_n) { //#499
                            $_.j = $_.j - 1; //#493
                            var _p = $k[--$j]; //#494
                            var _q = $k[--$j]; //#494
                            $put($_.msg, $_.j, $get(_q, _p)); //#494
                            $_.j = $_.j + 1; //#495
                            var _v = $k[--$j]; //#496
                            $k[$j++] = $geti(_v, 3, _v.length - 3); //#497
                            break; //#497
                        } else { //#499
                            $j -= 2; //#499
                        } //#499
                    } //#499
                    var _x = $k[$j - 1]; //#502
                    if (_x.length >= 2) { //#513
                        var _y = $k[$j - 1]; //#503
                        var _z = $geti(_y, 0, 2); //#503
                        var _10 = $_.ctrl; //#503
                        var _11 = $has(_10, _z); //#504
                        $k[$j++] = _10; //#512
                        $k[$j++] = _z; //#512
                        if (_11) { //#511
                            $_.j = $_.j - 1; //#505
                            var _13 = $k[--$j]; //#506
                            var _14 = $k[--$j]; //#506
                            $put($_.msg, $_.j, $get(_14, _13)); //#506
                            $_.j = $_.j + 1; //#507
                            var _19 = $k[--$j]; //#508
                            $k[$j++] = $geti(_19, 2, _19.length - 2); //#509
                            break; //#509
                        } else { //#511
                            $j -= 2; //#511
                        } //#511
                    } //#511
                    var _1B = $k[$j - 1]; //#514
                    if (_1B.length >= 3) { //#528
                        var _1C = $k[$j - 1]; //#515
                        var _1D = $geti(_1C, 0, 3); //#515
                        $k[$j++] = true; //#517
                        for (var _1E = 0, _1F = _1D.length; _1E < _1F; _1E++) { //#517
                            var _1G = $get(_1D, _1E); //#517
                            if ((_1G < 48) || (_1G > 57)) { //#516
                                $k[$j - 1] = false; //#516
                            } //#516
                        } //#516
                        var _1H = $k[--$j]; //#527
                        if (_1H) { //#527
                            var _1I = $k[$j - 1]; //#519
                            var _1K = $cvi($geti(_1I, 0, 3)); //#519
                            $k[$j++] = _1K; //#522
                            if (_1K > 255) { //#522
                                $j -= 2; //#520
                                $k[$j++] = "bwipp.invalidOrdinal#521"; //#521
                                $k[$j++] = "Ordinal must be 000 to 255"; //#521
                                bwipp_raiseerror(); //#521
                            } //#521
                            $_.j = $_.j - 1; //#523
                            var _1N = $k[--$j]; //#524
                            $put($_.msg, $_.j, _1N); //#524
                            $_.j = $_.j + 1; //#525
                            var _1Q = $k[--$j]; //#526
                            $k[$j++] = $geti(_1Q, 3, _1Q.length - 3); //#526
                        } //#526
                    } //#526
                } //#526
                if ($_.parseonly || !$_.parsefnc || $get($_.msg, $_.j - 1) != 94) { //#534
                    break; //#534
                } //#534
                $_.j = $_.j - 1; //#537
                var _1Y = $k[$j - 1]; //#538
                if (_1Y.length < 1) { //#541
                    $k[$j - 1] = "bwipp.truncatedCaret#540"; //#540
                    $k[$j++] = "Caret character truncated"; //#540
                    bwipp_raiseerror(); //#540
                } //#540
                var _1Z = $k[$j - 1]; //#542
                if ($get(_1Z, 0) == 94) { //#547
                    $put($_.msg, $_.j, 94); //#543
                    $_.j = $_.j + 1; //#544
                    var _1e = $k[--$j]; //#545
                    $k[$j++] = $geti(_1e, 1, _1e.length - 1); //#546
                    break; //#546
                } //#546
                var _1g = $k[$j - 1]; //#548
                if (_1g.length < 3) { //#551
                    $k[$j - 1] = "bwipp.truncatedFNC#550"; //#550
                    $k[$j++] = "Function character truncated"; //#550
                    bwipp_raiseerror(); //#550
                } //#550
                var _1h = $k[$j - 1]; //#552
                if ($eq($geti(_1h, 0, 3), "ECI") && $_.eci) { //#569
                    var _1k = $k[$j - 1]; //#553
                    if (_1k.length < 9) { //#556
                        $k[$j - 1] = "bwipp.truncatedECI#555"; //#555
                        $k[$j++] = "ECI truncated"; //#555
                        bwipp_raiseerror(); //#555
                    } //#555
                    var _1l = $k[$j - 1]; //#557
                    var _1m = $geti(_1l, 3, 6); //#557
                    $k[$j++] = _1m; //#563
                    for (var _1n = 0, _1o = _1m.length; _1n < _1o; _1n++) { //#563
                        var _1p = $get(_1m, _1n); //#563
                        if ((_1p < 48) || (_1p > 57)) { //#562
                            $j -= 2; //#560
                            $k[$j++] = "bwipp.invalidECI#561"; //#561
                            $k[$j++] = "ECI must be 000000 to 999999"; //#561
                            bwipp_raiseerror(); //#561
                        } //#561
                    } //#561
                    var _1q = $k[--$j]; //#564
                    var _1t = 0; //#564
                    $forall(_1q, function() { //#564
                        var _1r = $k[--$j]; //#564
                        _1t = $f(_1t - (_1r - 48)) * 10 //#564
                    }); //#564
                    $put($_.msg, $_.j, (~~(_1t / 10)) - 1000000); //#565
                    $_.j = $_.j + 1; //#566
                    var _1x = $k[--$j]; //#567
                    $k[$j++] = $geti(_1x, 9, _1x.length - 9); //#568
                    break; //#568
                } //#568
                var _1z = $k[$j - 1]; //#570
                if (_1z.length < 4) { //#573
                    $k[$j - 1] = "bwipp.truncatedFNC#572"; //#572
                    $k[$j++] = "Function character truncated"; //#572
                    bwipp_raiseerror(); //#572
                } //#572
                var _20 = $k[$j - 1]; //#574
                var _21 = $geti(_20, 0, 4); //#574
                var _23 = $has($_.fncvals, _21); //#574
                $k[$j++] = _21; //#579
                if (!_23) { //#579
                    var _24 = $k[--$j]; //#575
                    var _25 = $s(_24.length + 28); //#575
                    $puti(_25, 28, _24); //#575
                    $puti(_25, 0, "Unknown function character: "); //#576
                    $k[$j - 1] = "bwipp.unknownFNC#578"; //#578
                    $k[$j++] = _25; //#578
                    bwipp_raiseerror(); //#578
                } //#578
                var _29 = $k[--$j]; //#580
                $put($_.msg, $_.j, $get($_.fncvals, _29)); //#581
                $_.j = $_.j + 1; //#582
                var _2E = $k[--$j]; //#583
                $k[$j++] = $geti(_2E, 4, _2E.length - 4); //#584
                break; //#584
            } //#584
        } else { //#588
            break; //#588
        } //#588
    } //#588
    if (!$_.parseonly) { //#596
        $k[$j++] = $geti($_.msg, 0, $_.j); //#593
    } else { //#596
        $k[$j++] = $s($_.j); //#596
        for (var _2O = 0, _2N = $_.j - 1; _2O <= _2N; _2O += 1) { //#596
            var _2P = $k[$j - 1]; //#596
            $put(_2P, _2O, $get($_.msg, _2O)); //#596
        } //#596
    } //#596
    $_ = $__; //#600
} //bwipp_parseinput
function bwipp_gs1process() {
    if (!bwipp_gs1process.globals) {
        var $__ = $_;
        $_ = bwipp_gs1process.globals = {};
        //#623
        $_.gs1process_primes = $a([2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83]); //#625
        $_.gs1process_daysinmonth = $a([31, -1, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]); //#630
        var _3 = new Map([
            ["cset", 'N'],
            ["min", 18],
            ["max", 18],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos2'])]
        ]); //#645
        var _6 = new Map([
            ["parts", $a([_3])],
            ["dlpkey", $a([])]
        ]); //#647
        var _8 = new Map([
            ["cset", 'N'],
            ["min", 14],
            ["max", 14],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos2'])]
        ]); //#654
        var _E = new Map([
            ["parts", $a([_8])],
            ["ex", $a(["255", "37"])],
            ["dlpkey", $a([$a(["22", "10", "21"]), $a(["235"])])]
        ]); //#657
        var _G = new Map([
            ["cset", 'N'],
            ["min", 14],
            ["max", 14],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos2'])]
        ]); //#664
        var _M = new Map([
            ["parts", $a([_G])],
            ["ex", $a(["01", "03"])],
            ["req", $a([$a([$a(["37"])])])]
        ]); //#667
        var _O = new Map([
            ["cset", 'N'],
            ["min", 14],
            ["max", 14],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos2'])]
        ]); //#674
        var _R = new Map([
            ["parts", $a([_O])],
            ["ex", $a(["01", "02", "37"])],
            ["dlattr", false]
        ]); //#677
        var _T = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#684
        var _c = new Map([
            ["parts", $a([_T])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["03"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#686
        var _e = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmd0'])]
        ]); //#693
        var _n = new Map([
            ["parts", $a([_e])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["03"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#695
        var _p = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmd0'])]
        ]); //#702
        var _u = new Map([
            ["parts", $a([_p])],
            ["req", $a([$a([$a(["8020"])])])]
        ]); //#704
        var _w = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmd0'])]
        ]); //#711
        var _15 = new Map([
            ["parts", $a([_w])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["03"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#713
        var _17 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmd0'])]
        ]); //#722
        var _1H = new Map([
            ["parts", $a([_17])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["03"]), $a(["255"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#724
        var _1J = new Map([
            ["cset", 'N'],
            ["min", 2],
            ["max", 2],
            ["opt", false],
            ["linters", $a([])]
        ]); //#731
        var _1R = new Map([
            ["parts", $a([_1J])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#733
        var _1T = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#740
        var _1b = new Map([
            ["parts", $a([_1T])],
            ["ex", $a(["235"])],
            ["req", $a([$a([$a(["01"]), $a(["03"]), $a(["8006"])])])],
            ["dlattr", false]
        ]); //#744
        var _1d = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#751
        var _1i = new Map([
            ["parts", $a([_1d])],
            ["req", $a([$a([$a(["01"])])])],
            ["dlattr", false]
        ]); //#754
        var _1k = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 28],
            ["opt", false],
            ["linters", $a([])]
        ]); //#761
        var _1p = new Map([
            ["parts", $a([_1k])],
            ["req", $a([$a([$a(["01"])])])],
            ["dlattr", false]
        ]); //#764
        var _1r = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#771
        var _1z = new Map([
            ["parts", $a([_1r])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#773
        var _21 = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#781
        var _29 = new Map([
            ["parts", $a([_21])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#783
        var _2B = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#790
        var _2G = new Map([
            ["parts", $a([_2B])],
            ["req", $a([$a([$a(["01"])])])]
        ]); //#792
        var _2I = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#799
        var _2Q = new Map([
            ["parts", $a([_2I])],
            ["req", $a([$a([$a(["01"]), $a(["8006"])]), $a([$a(["21"])])])]
        ]); //#801
        var _2S = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#808
        var _2Y = new Map([
            ["parts", $a([_2S])],
            ["req", $a([$a([$a(["01"]), $a(["8006"])])])]
        ]); //#810
        var _2a = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#817
        var _2c = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 17],
            ["opt", true],
            ["linters", $a([])]
        ]); //#818
        var _2f = new Map([
            ["parts", $a([_2a, _2c])],
            ["dlpkey", $a([])]
        ]); //#820
        var _2h = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#827
        var _2m = new Map([
            ["parts", $a([_2h])],
            ["req", $a([$a([$a(["414"])])])],
            ["dlattr", false]
        ]); //#830
        var _2o = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#837
        var _2q = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 12],
            ["opt", true],
            ["linters", $a([])]
        ]); //#838
        var _2u = new Map([
            ["parts", $a([_2o, _2q])],
            ["ex", $a(["01", "02", "415", "8006", "8020", "8026"])],
            ["dlpkey", $a([])]
        ]); //#841
        var _2w = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 8],
            ["opt", false],
            ["linters", $a([])]
        ]); //#848
        var _32 = new Map([
            ["parts", $a([_2w])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#850
        var _34 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#857
        var _3B = new Map([
            ["parts", $a([_34])],
            ["ex", $a(["310n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#860
        var _3D = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#872
        var _3K = new Map([
            ["parts", $a([_3D])],
            ["ex", $a(["311n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#875
        var _3M = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#887
        var _3T = new Map([
            ["parts", $a([_3M])],
            ["ex", $a(["312n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#890
        var _3V = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#902
        var _3c = new Map([
            ["parts", $a([_3V])],
            ["ex", $a(["313n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#905
        var _3e = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#917
        var _3l = new Map([
            ["parts", $a([_3e])],
            ["ex", $a(["314n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#920
        var _3n = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#932
        var _3u = new Map([
            ["parts", $a([_3n])],
            ["ex", $a(["315n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#935
        var _3w = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#947
        var _43 = new Map([
            ["parts", $a([_3w])],
            ["ex", $a(["316n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#950
        var _45 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#962
        var _4C = new Map([
            ["parts", $a([_45])],
            ["ex", $a(["320n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#965
        var _4E = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#977
        var _4L = new Map([
            ["parts", $a([_4E])],
            ["ex", $a(["321n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#980
        var _4N = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#992
        var _4U = new Map([
            ["parts", $a([_4N])],
            ["ex", $a(["322n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#995
        var _4W = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1007
        var _4d = new Map([
            ["parts", $a([_4W])],
            ["ex", $a(["323n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1010
        var _4f = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1022
        var _4m = new Map([
            ["parts", $a([_4f])],
            ["ex", $a(["324n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1025
        var _4o = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1037
        var _4v = new Map([
            ["parts", $a([_4o])],
            ["ex", $a(["325n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1040
        var _4x = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1052
        var _54 = new Map([
            ["parts", $a([_4x])],
            ["ex", $a(["326n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1055
        var _56 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1067
        var _5D = new Map([
            ["parts", $a([_56])],
            ["ex", $a(["327n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1070
        var _5F = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1082
        var _5M = new Map([
            ["parts", $a([_5F])],
            ["ex", $a(["328n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1085
        var _5O = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1097
        var _5V = new Map([
            ["parts", $a([_5O])],
            ["ex", $a(["329n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1100
        var _5X = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1112
        var _5e = new Map([
            ["parts", $a([_5X])],
            ["ex", $a(["330n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1115
        var _5g = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1127
        var _5n = new Map([
            ["parts", $a([_5g])],
            ["ex", $a(["331n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1130
        var _5p = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1142
        var _5w = new Map([
            ["parts", $a([_5p])],
            ["ex", $a(["332n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1145
        var _5y = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1157
        var _65 = new Map([
            ["parts", $a([_5y])],
            ["ex", $a(["333n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1160
        var _67 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1172
        var _6E = new Map([
            ["parts", $a([_67])],
            ["ex", $a(["334n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1175
        var _6G = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1187
        var _6N = new Map([
            ["parts", $a([_6G])],
            ["ex", $a(["335n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1190
        var _6P = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1202
        var _6W = new Map([
            ["parts", $a([_6P])],
            ["ex", $a(["336n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1205
        var _6Y = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1217
        var _6e = new Map([
            ["parts", $a([_6Y])],
            ["ex", $a(["337n"])],
            ["req", $a([$a([$a(["01"])])])]
        ]); //#1220
        var _6g = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1232
        var _6n = new Map([
            ["parts", $a([_6g])],
            ["ex", $a(["340n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1235
        var _6p = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1247
        var _6w = new Map([
            ["parts", $a([_6p])],
            ["ex", $a(["341n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1250
        var _6y = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1262
        var _75 = new Map([
            ["parts", $a([_6y])],
            ["ex", $a(["342n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1265
        var _77 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1277
        var _7E = new Map([
            ["parts", $a([_77])],
            ["ex", $a(["343n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1280
        var _7G = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1292
        var _7N = new Map([
            ["parts", $a([_7G])],
            ["ex", $a(["344n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1295
        var _7P = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1307
        var _7W = new Map([
            ["parts", $a([_7P])],
            ["ex", $a(["345n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1310
        var _7Y = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1322
        var _7f = new Map([
            ["parts", $a([_7Y])],
            ["ex", $a(["346n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1325
        var _7h = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1337
        var _7o = new Map([
            ["parts", $a([_7h])],
            ["ex", $a(["347n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1340
        var _7q = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1352
        var _7x = new Map([
            ["parts", $a([_7q])],
            ["ex", $a(["348n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1355
        var _7z = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1367
        var _86 = new Map([
            ["parts", $a([_7z])],
            ["ex", $a(["349n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1370
        var _88 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1382
        var _8F = new Map([
            ["parts", $a([_88])],
            ["ex", $a(["350n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1385
        var _8H = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1397
        var _8O = new Map([
            ["parts", $a([_8H])],
            ["ex", $a(["351n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1400
        var _8Q = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1412
        var _8X = new Map([
            ["parts", $a([_8Q])],
            ["ex", $a(["352n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1415
        var _8Z = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1427
        var _8g = new Map([
            ["parts", $a([_8Z])],
            ["ex", $a(["353n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1430
        var _8i = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1442
        var _8p = new Map([
            ["parts", $a([_8i])],
            ["ex", $a(["354n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1445
        var _8r = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1457
        var _8y = new Map([
            ["parts", $a([_8r])],
            ["ex", $a(["355n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1460
        var _90 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1472
        var _97 = new Map([
            ["parts", $a([_90])],
            ["ex", $a(["356n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1475
        var _99 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1487
        var _9G = new Map([
            ["parts", $a([_99])],
            ["ex", $a(["357n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1490
        var _9I = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1502
        var _9P = new Map([
            ["parts", $a([_9I])],
            ["ex", $a(["360n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1505
        var _9R = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1517
        var _9Y = new Map([
            ["parts", $a([_9R])],
            ["ex", $a(["361n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1520
        var _9a = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1532
        var _9h = new Map([
            ["parts", $a([_9a])],
            ["ex", $a(["362n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1535
        var _9j = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1547
        var _9q = new Map([
            ["parts", $a([_9j])],
            ["ex", $a(["363n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1550
        var _9s = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1562
        var _9z = new Map([
            ["parts", $a([_9s])],
            ["ex", $a(["364n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1565
        var _A1 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1577
        var _A8 = new Map([
            ["parts", $a([_A1])],
            ["ex", $a(["365n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1580
        var _AA = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1592
        var _AH = new Map([
            ["parts", $a([_AA])],
            ["ex", $a(["366n"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1595
        var _AJ = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1607
        var _AQ = new Map([
            ["parts", $a([_AJ])],
            ["ex", $a(["367n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1610
        var _AS = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1622
        var _AZ = new Map([
            ["parts", $a([_AS])],
            ["ex", $a(["368n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1625
        var _Ab = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1637
        var _Ai = new Map([
            ["parts", $a([_Ab])],
            ["ex", $a(["369n"])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#1640
        var _Ak = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 8],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1652
        var _As = new Map([
            ["parts", $a([_Ak])],
            ["req", $a([$a([$a(["00"])]), $a([$a(["02"]), $a(["8026"])])])]
        ]); //#1654
        var _Au = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 15],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1661
        var _B1 = new Map([
            ["parts", $a([_Au])],
            ["ex", $a(["390n", "391n", "394n", "8111"])],
            ["req", $a([$a([$a(["255"]), $a(["8020"])])])]
        ]); //#1664
        var _B3 = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso4217'])]
        ]); //#1680
        var _B5 = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 15],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1681
        var _BB = new Map([
            ["parts", $a([_B3, _B5])],
            ["ex", $a(["391n"])],
            ["req", $a([$a([$a(["8020"])])])]
        ]); //#1684
        var _BD = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 15],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1700
        var _BP = new Map([
            ["parts", $a([_BD])],
            ["ex", $a(["392n", "393n"])],
            ["req", $a([$a([$a(["01"])]), $a([$a(["30"]), $a(["31nn"]), $a(["32nn"]), $a(["35nn"]), $a(["36nn"])])])]
        ]); //#1703
        var _BR = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso4217'])]
        ]); //#1719
        var _BT = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 15],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1720
        var _Bd = new Map([
            ["parts", $a([_BR, _BT])],
            ["ex", $a(["393n"])],
            ["req", $a([$a([$a(["30"]), $a(["31nn"]), $a(["32nn"]), $a(["35nn"]), $a(["36nn"])])])]
        ]); //#1723
        var _Bf = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1739
        var _Bl = new Map([
            ["parts", $a([_Bf])],
            ["ex", $a(["394n", "8111"])],
            ["req", $a([$a([$a(["255"])])])]
        ]); //#1742
        var _Bn = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1752
        var _Bx = new Map([
            ["parts", $a([_Bn])],
            ["ex", $a(["392n", "393n", "395n", "8005"])],
            ["req", $a([$a([$a(["30"]), $a(["31nn"]), $a(["32nn"]), $a(["35nn"]), $a(["36nn"])])])]
        ]); //#1755
        var _Bz = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1767
        var _C1 = new Map([
            ["parts", $a([_Bz])]
        ]); //#1767
        var _C3 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a(['lintgcppos1'])]
        ]); //#1775
        var _C6 = new Map([
            ["parts", $a([_C3])],
            ["dlpkey", $a([])]
        ]); //#1777
        var _C8 = new Map([
            ["cset", 'N'],
            ["min", 17],
            ["max", 17],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#1784
        var _CB = new Map([
            ["parts", $a([_C8])],
            ["dlpkey", $a([])]
        ]); //#1786
        var _CD = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1793
        var _CI = new Map([
            ["parts", $a([_CD])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1795
        var _CK = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#1802
        var _CM = new Map([
            ["parts", $a([_CK])]
        ]); //#1802
        var _CO = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#1813
        var _CT = new Map([
            ["parts", $a([_CO])],
            ["dlpkey", $a([$a(["254"]), $a(["7040"])])]
        ]); //#1815
        var _CV = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#1822
        var _Cc = new Map([
            ["parts", $a([_CV])],
            ["req", $a([$a([$a(["8020"])])])],
            ["dlpkey", $a([$a(["8020"])])]
        ]); //#1825
        var _Ce = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#1832
        var _Cg = new Map([
            ["parts", $a([_Ce])]
        ]); //#1832
        var _Ci = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#1840
        var _Cm = new Map([
            ["parts", $a([_Ci])],
            ["dlpkey", $a([$a(["7040"])])]
        ]); //#1842
        var _Co = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1849
        var _Cr = new Map([
            ["parts", $a([_Co])],
            ["ex", $a(["421"])]
        ]); //#1851
        var _Ct = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166'])]
        ]); //#1858
        var _Cv = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 9],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1859
        var _Cy = new Map([
            ["parts", $a([_Ct, _Cv])],
            ["ex", $a(["4307"])]
        ]); //#1861
        var _D0 = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166'])]
        ]); //#1868
        var _D9 = new Map([
            ["parts", $a([_D0])],
            ["ex", $a(["426"])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#1871
        var _DB = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166'])]
        ]); //#1878
        var _DD = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1879
        var _DF = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1880
        var _DH = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1881
        var _DJ = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1882
        var _DQ = new Map([
            ["parts", $a([_DB, _DD, _DF, _DH, _DJ])],
            ["ex", $a(["426"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1885
        var _DS = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166'])]
        ]); //#1892
        var _DZ = new Map([
            ["parts", $a([_DS])],
            ["ex", $a(["426"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1895
        var _Db = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166'])]
        ]); //#1902
        var _Dd = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1903
        var _Df = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1904
        var _Dh = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1905
        var _Dj = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", true],
            ["linters", $a(['lintiso3166'])]
        ]); //#1906
        var _Dq = new Map([
            ["parts", $a([_Db, _Dd, _Df, _Dh, _Dj])],
            ["ex", $a(["426"])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1909
        var _Ds = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166'])]
        ]); //#1916
        var _Dy = new Map([
            ["parts", $a([_Ds])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#1918
        var _E0 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 3],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1925
        var _E8 = new Map([
            ["parts", $a([_E0])],
            ["req", $a([$a([$a(["01"]), $a(["02"])]), $a([$a(["422"])])])]
        ]); //#1927
        var _EA = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 35],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#1934
        var _EF = new Map([
            ["parts", $a([_EA])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1936
        var _EH = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#1944
        var _EM = new Map([
            ["parts", $a([_EH])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1946
        var _EO = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#1953
        var _ET = new Map([
            ["parts", $a([_EO])],
            ["req", $a([$a([$a(["4302"])])])]
        ]); //#1955
        var _EV = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#1962
        var _Ea = new Map([
            ["parts", $a([_EV])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1964
        var _Ec = new Map([
            ["cset", 'X'],
            ["min", 2],
            ["max", 2],
            ["opt", false],
            ["linters", $a(['lintiso3166alpha2'])]
        ]); //#1973
        var _Eh = new Map([
            ["parts", $a([_Ec])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1975
        var _Ej = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#1982
        var _Eo = new Map([
            ["parts", $a([_Ej])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1984
        var _Eq = new Map([
            ["cset", 'N'],
            ["min", 10],
            ["max", 10],
            ["opt", false],
            ["linters", $a(['lintlatitude'])]
        ]); //#1991
        var _Es = new Map([
            ["cset", 'N'],
            ["min", 10],
            ["max", 10],
            ["opt", false],
            ["linters", $a(['lintlongitude'])]
        ]); //#1992
        var _Ex = new Map([
            ["parts", $a([_Eq, _Es])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#1994
        var _Ez = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 35],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2001
        var _F4 = new Map([
            ["parts", $a([_Ez])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2003
        var _F6 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2011
        var _FB = new Map([
            ["parts", $a([_F6])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2013
        var _FD = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2020
        var _FI = new Map([
            ["parts", $a([_FD])],
            ["req", $a([$a([$a(["4312"])])])]
        ]); //#2022
        var _FK = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2029
        var _FP = new Map([
            ["parts", $a([_FK])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2031
        var _FR = new Map([
            ["cset", 'X'],
            ["min", 2],
            ["max", 2],
            ["opt", false],
            ["linters", $a(['lintiso3166alpha2'])]
        ]); //#2040
        var _FW = new Map([
            ["parts", $a([_FR])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2042
        var _FY = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2049
        var _Fd = new Map([
            ["parts", $a([_FY])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2051
        var _Ff = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2058
        var _Fk = new Map([
            ["parts", $a([_Ff])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2060
        var _Fm = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 35],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2067
        var _Fr = new Map([
            ["parts", $a([_Fm])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2069
        var _Ft = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a(['lintyesno'])]
        ]); //#2076
        var _Fy = new Map([
            ["parts", $a([_Ft])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2078
        var _G0 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmd0'])]
        ]); //#2087
        var _G2 = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['linthhmi'])]
        ]); //#2088
        var _G7 = new Map([
            ["parts", $a([_G0, _G2])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2090
        var _G9 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2098
        var _GE = new Map([
            ["parts", $a([_G9])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2100
        var _GG = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2107
        var _GI = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", true],
            ["linters", $a(['linthyphen'])]
        ]); //#2108
        var _GO = new Map([
            ["parts", $a([_GG, _GI])],
            ["ex", $a(["4331"])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2111
        var _GQ = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2118
        var _GS = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", true],
            ["linters", $a(['linthyphen'])]
        ]); //#2119
        var _GY = new Map([
            ["parts", $a([_GQ, _GS])],
            ["ex", $a(["4330"])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2122
        var _Ga = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2129
        var _Gc = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", true],
            ["linters", $a(['linthyphen'])]
        ]); //#2130
        var _Gi = new Map([
            ["parts", $a([_Ga, _Gc])],
            ["ex", $a(["4333"])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2133
        var _Gk = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2140
        var _Gm = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", true],
            ["linters", $a(['linthyphen'])]
        ]); //#2141
        var _Gs = new Map([
            ["parts", $a([_Gk, _Gm])],
            ["ex", $a(["4332"])],
            ["req", $a([$a([$a(["00"])])])]
        ]); //#2144
        var _Gu = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2151
        var _H2 = new Map([
            ["parts", $a([_Gu])],
            ["req", $a([$a([$a(["01"]), $a(["02"]), $a(["8006"]), $a(["8026"])])])]
        ]); //#2153
        var _H4 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2160
        var _HA = new Map([
            ["parts", $a([_H4])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2162
        var _HC = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2169
        var _HE = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['linthhmi'])]
        ]); //#2170
        var _HK = new Map([
            ["parts", $a([_HC, _HE])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2172
        var _HM = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 4],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2179
        var _HR = new Map([
            ["parts", $a([_HM])],
            ["req", $a([$a([$a(["01", "10"])])])]
        ]); //#2181
        var _HT = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 12],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2188
        var _HZ = new Map([
            ["parts", $a([_HT])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2190
        var _Hb = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2197
        var _Hh = new Map([
            ["parts", $a([_Hb])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2199
        var _Hj = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2206
        var _Hl = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", true],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2207
        var _Hr = new Map([
            ["parts", $a([_Hj, _Hl])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2209
        var _Ht = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 3],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2216
        var _Hz = new Map([
            ["parts", $a([_Ht])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2218
        var _I1 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 10],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2225
        var _I7 = new Map([
            ["parts", $a([_I1])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2227
        var _I9 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 2],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2234
        var _IF = new Map([
            ["parts", $a([_I9])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2236
        var _IH = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2243
        var _IJ = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", true],
            ["linters", $a(['linthhmi'])]
        ]); //#2244
        var _IP = new Map([
            ["parts", $a([_IH, _IJ])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2246
        var _IR = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2253
        var _IZ = new Map([
            ["parts", $a([_IR])],
            ["req", $a([$a([$a(["01"]), $a(["8006"])]), $a([$a(["416"])])])]
        ]); //#2255
        var _Ib = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2262
        var _Ih = new Map([
            ["parts", $a([_Ib])],
            ["req", $a([$a([$a(["01"]), $a(["8006"])])])]
        ]); //#2264
        var _Ij = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2271
        var _Io = new Map([
            ["parts", $a([_Ij])],
            ["req", $a([$a([$a(["7021"])])])]
        ]); //#2273
        var _Iq = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a(['lintgcppos1'])]
        ]); //#2280
        var _Is = new Map([
            ["parts", $a([_Iq])]
        ]); //#2280
        var _Iu = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintiso3166999'])]
        ]); //#2288
        var _Iw = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 27],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2289
        var _J2 = new Map([
            ["parts", $a([_Iu, _Iw])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2291
        var _J4 = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2307
        var _J6 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2308
        var _J8 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2309
        var _JA = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a(['lintimporteridx'])]
        ]); //#2310
        var _JC = new Map([
            ["parts", $a([_J4, _J6, _J8, _JA])],
            ["dlattr", false]
        ]); //#2312
        var _JE = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['lintpackagetype'])]
        ]); //#2319
        var _JJ = new Map([
            ["parts", $a([_JE])],
            ["req", $a([$a([$a(["00"])])])],
            ["dlattr", false]
        ]); //#2322
        var _JL = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2329
        var _JQ = new Map([
            ["parts", $a([_JL])],
            ["req", $a([$a([$a(["01"])])])]
        ]); //#2331
        var _JS = new Map([
            ["cset", 'X'],
            ["min", 2],
            ["max", 2],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2345
        var _JU = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 28],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2346
        var _Ja = new Map([
            ["parts", $a([_JS, _JU])],
            ["req", $a([$a([$a(["01"]), $a(["8004"])])])]
        ]); //#2348
        var _Jc = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2364
        var _Ji = new Map([
            ["parts", $a([_Jc])],
            ["req", $a([$a([$a(["01"]), $a(["8006"])])])]
        ]); //#2366
        var _Jk = new Map([
            ["cset", 'N'],
            ["min", 2],
            ["max", 2],
            ["opt", false],
            ["linters", $a(['lintmediatype'])]
        ]); //#2373
        var _Jq = new Map([
            ["parts", $a([_Jk])],
            ["req", $a([$a([$a(["8017"]), $a(["8018"])])])]
        ]); //#2375
        var _Js = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 25],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2382
        var _Jy = new Map([
            ["parts", $a([_Js])],
            ["req", $a([$a([$a(["8017"]), $a(["8018"])])])]
        ]); //#2384
        var _K0 = new Map([
            ["cset", 'N'],
            ["min", 8],
            ["max", 8],
            ["opt", false],
            ["linters", $a(['lintyyyymmdd'])]
        ]); //#2391
        var _K6 = new Map([
            ["parts", $a([_K0])],
            ["ex", $a(["7251"])],
            ["req", $a([$a([$a(["8018"])])])]
        ]); //#2394
        var _K8 = new Map([
            ["cset", 'N'],
            ["min", 8],
            ["max", 8],
            ["opt", false],
            ["linters", $a(['lintyyyymmdd'])]
        ]); //#2401
        var _KA = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['linthhmi'])]
        ]); //#2402
        var _KG = new Map([
            ["parts", $a([_K8, _KA])],
            ["ex", $a(["7250"])],
            ["req", $a([$a([$a(["8018"])])])]
        ]); //#2405
        var _KI = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a(['lintiso5218'])]
        ]); //#2412
        var _KN = new Map([
            ["parts", $a([_KI])],
            ["req", $a([$a([$a(["8018"])])])]
        ]); //#2414
        var _KP = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 40],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2421
        var _KW = new Map([
            ["parts", $a([_KP])],
            ["ex", $a(["7256", "7259"])],
            ["req", $a([$a([$a(["8017"]), $a(["8018"])])])]
        ]); //#2424
        var _KY = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 10],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2432
        var _Kf = new Map([
            ["parts", $a([_KY])],
            ["ex", $a(["7256", "7259"])],
            ["req", $a([$a([$a(["8017"]), $a(["8018"])])])]
        ]); //#2435
        var _Kh = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 90],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2442
        var _Kn = new Map([
            ["parts", $a([_Kh])],
            ["req", $a([$a([$a(["8017"]), $a(["8018"])])])]
        ]); //#2444
        var _Kp = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2451
        var _Ku = new Map([
            ["parts", $a([_Kp])],
            ["req", $a([$a([$a(["8018"])])])]
        ]); //#2453
        var _Kw = new Map([
            ["cset", 'X'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintposinseqslash'])]
        ]); //#2460
        var _L1 = new Map([
            ["parts", $a([_Kw])],
            ["req", $a([$a([$a(["8018", "7259"])])])]
        ]); //#2462
        var _L3 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 40],
            ["opt", false],
            ["linters", $a(['lintpcenc'])]
        ]); //#2469
        var _L9 = new Map([
            ["parts", $a([_L3])],
            ["ex", $a(["7256"])],
            ["req", $a([$a([$a(["8018"])])])]
        ]); //#2472
        var _LB = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['lintnonzero'])]
        ]); //#2479
        var _LD = new Map([
            ["cset", 'N'],
            ["min", 5],
            ["max", 5],
            ["opt", false],
            ["linters", $a(['lintnonzero'])]
        ]); //#2480
        var _LF = new Map([
            ["cset", 'N'],
            ["min", 3],
            ["max", 3],
            ["opt", false],
            ["linters", $a(['lintnonzero'])]
        ]); //#2481
        var _LH = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a(['lintwinding'])]
        ]); //#2482
        var _LJ = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2483
        var _LO = new Map([
            ["parts", $a([_LB, _LD, _LF, _LH, _LJ])],
            ["req", $a([$a([$a(["01"])])])]
        ]); //#2485
        var _LQ = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2492
        var _LS = new Map([
            ["parts", $a([_LQ])]
        ]); //#2492
        var _LU = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 1],
            ["opt", false],
            ["linters", $a(['lintzero'])]
        ]); //#2500
        var _LW = new Map([
            ["cset", 'N'],
            ["min", 13],
            ["max", 13],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#2501
        var _LY = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 16],
            ["opt", true],
            ["linters", $a([])]
        ]); //#2502
        var _Lb = new Map([
            ["parts", $a([_LU, _LW, _LY])],
            ["dlpkey", $a([])]
        ]); //#2504
        var _Ld = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a(['lintgcppos1'])]
        ]); //#2511
        var _Lh = new Map([
            ["parts", $a([_Ld])],
            ["dlpkey", $a([$a(["7040"])])]
        ]); //#2513
        var _Lj = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2520
        var _Lp = new Map([
            ["parts", $a([_Lj])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2522
        var _Lr = new Map([
            ["cset", 'N'],
            ["min", 14],
            ["max", 14],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos2'])]
        ]); //#2529
        var _Lt = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['lintpieceoftotal'])]
        ]); //#2530
        var _Ly = new Map([
            ["parts", $a([_Lr, _Lt])],
            ["ex", $a(["01", "37"])],
            ["dlpkey", $a([$a(["22", "10", "21"])])]
        ]); //#2533
        var _M0 = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 34],
            ["opt", false],
            ["linters", $a(['lintiban'])]
        ]); //#2540
        var _M5 = new Map([
            ["parts", $a([_M0])],
            ["req", $a([$a([$a(["415"])])])]
        ]); //#2542
        var _M7 = new Map([
            ["cset", 'N'],
            ["min", 6],
            ["max", 6],
            ["opt", false],
            ["linters", $a(['lintyymmdd'])]
        ]); //#2549
        var _M9 = new Map([
            ["cset", 'N'],
            ["min", 2],
            ["max", 2],
            ["opt", false],
            ["linters", $a(['linthh'])]
        ]); //#2550
        var _MB = new Map([
            ["cset", 'N'],
            ["min", 2],
            ["max", 2],
            ["opt", true],
            ["linters", $a(['lintmi'])]
        ]); //#2551
        var _MD = new Map([
            ["cset", 'N'],
            ["min", 2],
            ["max", 2],
            ["opt", true],
            ["linters", $a(['lintss'])]
        ]); //#2552
        var _MJ = new Map([
            ["parts", $a([_M7, _M9, _MB, _MD])],
            ["req", $a([$a([$a(["01"]), $a(["02"])])])]
        ]); //#2554
        var _ML = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 50],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2561
        var _MR = new Map([
            ["parts", $a([_ML])],
            ["req", $a([$a([$a(["00"]), $a(["01"])])])]
        ]); //#2563
        var _MT = new Map([
            ["cset", 'Y'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a(['lintgcppos1'])]
        ]); //#2570
        var _MX = new Map([
            ["parts", $a([_MT])],
            ["dlpkey", $a([$a(["8011"])])]
        ]); //#2572
        var _MZ = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 12],
            ["opt", false],
            ["linters", $a(['lintnozeroprefix'])]
        ]); //#2579
        var _Me = new Map([
            ["parts", $a([_MZ])],
            ["req", $a([$a([$a(["8010"])])])],
            ["dlattr", false]
        ]); //#2582
        var _Mg = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 20],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2589
        var _Mm = new Map([
            ["parts", $a([_Mg])],
            ["req", $a([$a([$a(["01"]), $a(["8006"])])])]
        ]); //#2591
        var _Mo = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 25],
            ["opt", false],
            ["linters", $a(['lintcsumalpha', 'lintgcppos1'])]
        ]); //#2598
        var _Mr = new Map([
            ["parts", $a([_Mo])],
            ["dlpkey", $a([])]
        ]); //#2600
        var _Mt = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 25],
            ["opt", false],
            ["linters", $a(['lintcsumalpha', 'lintgcppos1', 'linthasnondigit'])]
        ]); //#2607
        var _My = new Map([
            ["parts", $a([_Mt])],
            ["req", $a([$a([$a(["01"])])])],
            ["dlattr", false]
        ]); //#2610
        var _N0 = new Map([
            ["cset", 'N'],
            ["min", 18],
            ["max", 18],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#2617
        var _N5 = new Map([
            ["parts", $a([_N0])],
            ["ex", $a(["8018"])],
            ["dlpkey", $a([$a(["8019"])])]
        ]); //#2620
        var _N7 = new Map([
            ["cset", 'N'],
            ["min", 18],
            ["max", 18],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos1'])]
        ]); //#2627
        var _NC = new Map([
            ["parts", $a([_N7])],
            ["ex", $a(["8017"])],
            ["dlpkey", $a([$a(["8019"])])]
        ]); //#2630
        var _NE = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 10],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2637
        var _NK = new Map([
            ["parts", $a([_NE])],
            ["req", $a([$a([$a(["8017"]), $a(["8018"])])])],
            ["dlattr", false]
        ]); //#2640
        var _NM = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 25],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2647
        var _NR = new Map([
            ["parts", $a([_NM])],
            ["req", $a([$a([$a(["415"])])])],
            ["dlattr", false]
        ]); //#2650
        var _NT = new Map([
            ["cset", 'N'],
            ["min", 14],
            ["max", 14],
            ["opt", false],
            ["linters", $a(['lintcsum', 'lintgcppos2'])]
        ]); //#2657
        var _NV = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a(['lintpieceoftotal'])]
        ]); //#2658
        var _Nb = new Map([
            ["parts", $a([_NT, _NV])],
            ["ex", $a(["02", "8006"])],
            ["req", $a([$a([$a(["37"])])])]
        ]); //#2661
        var _Nd = new Map([
            ["cset", 'Z'],
            ["min", 1],
            ["max", 90],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2668
        var _Nr = new Map([
            ["parts", $a([_Nd])],
            ["req", $a([$a([$a(["00"]), $a(["01", "21"]), $a(["253"]), $a(["255"]), $a(["8003"]), $a(["8004"]), $a(["8006", "21"]), $a(["8010", "8011"]), $a(["8017"]), $a(["8018"])])])]
        ]); //#2670
        var _Nt = new Map([
            ["cset", 'N'],
            ["min", 15],
            ["max", 15],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2677
        var _Ny = new Map([
            ["parts", $a([_Nt])],
            ["req", $a([$a([$a(["01", "21"])])])],
            ["dlattr", false]
        ]); //#2680
        var _O0 = new Map([
            ["cset", 'N'],
            ["min", 15],
            ["max", 15],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2687
        var _O5 = new Map([
            ["parts", $a([_O0])],
            ["req", $a([$a([$a(["01", "21", "8040"])])])],
            ["dlattr", false]
        ]); //#2690
        var _O7 = new Map([
            ["cset", 'N'],
            ["min", 32],
            ["max", 32],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2697
        var _OC = new Map([
            ["parts", $a([_O7])],
            ["req", $a([$a([$a(["01", "21", "8040"])])])],
            ["dlattr", false]
        ]); //#2700
        var _OE = new Map([
            ["cset", 'N'],
            ["min", 18],
            ["max", 18],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2707
        var _OG = new Map([
            ["cset", 'N'],
            ["min", 1],
            ["max", 2],
            ["opt", true],
            ["linters", $a([])]
        ]); //#2708
        var _OL = new Map([
            ["parts", $a([_OE, _OG])],
            ["req", $a([$a([$a(["01", "21", "8040"])])])],
            ["dlattr", false]
        ]); //#2711
        var _ON = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintcouponcode'])]
        ]); //#2718
        var _OP = new Map([
            ["parts", $a([_ON])]
        ]); //#2718
        var _OR = new Map([
            ["cset", 'N'],
            ["min", 4],
            ["max", 4],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2726
        var _OW = new Map([
            ["parts", $a([_OR])],
            ["req", $a([$a([$a(["255"])])])]
        ]); //#2728
        var _OY = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a(['lintcouponposoffer'])]
        ]); //#2735
        var _Oa = new Map([
            ["parts", $a([_OY])]
        ]); //#2735
        var _Oc = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 70],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2743
        var _Oh = new Map([
            ["parts", $a([_Oc])],
            ["req", $a([$a([$a(["01"])])])],
            ["dlattr", false]
        ]); //#2746
        var _Oj = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 30],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2753
        var _Ol = new Map([
            ["parts", $a([_Oj])]
        ]); //#2753
        var _On = new Map([
            ["cset", 'X'],
            ["min", 1],
            ["max", 90],
            ["opt", false],
            ["linters", $a([])]
        ]); //#2761
        var _Op = new Map([
            ["parts", $a([_On])]
        ]); //#2761
        var _Oq = new Map([
            ["00", _6],
            ["01", _E],
            ["02", _M],
            ["03", _R],
            ["10", _c],
            ["11", _n],
            ["12", _u],
            ["13", _15],
            ["15", _15],
            ["16", _15],
            ["17", _1H],
            ["20", _1R],
            ["21", _1b],
            ["22", _1i],
            ["235", _1p],
            ["240", _1z],
            ["241", _1z],
            ["242", _29],
            ["243", _2G],
            ["250", _2Q],
            ["251", _2Y],
            ["253", _2f],
            ["254", _2m],
            ["255", _2u],
            ["30", _32],
            ["3100", _3B],
            ["3101", _3B],
            ["3102", _3B],
            ["3103", _3B],
            ["3104", _3B],
            ["3105", _3B],
            ["3110", _3K],
            ["3111", _3K],
            ["3112", _3K],
            ["3113", _3K],
            ["3114", _3K],
            ["3115", _3K],
            ["3120", _3T],
            ["3121", _3T],
            ["3122", _3T],
            ["3123", _3T],
            ["3124", _3T],
            ["3125", _3T],
            ["3130", _3c],
            ["3131", _3c],
            ["3132", _3c],
            ["3133", _3c],
            ["3134", _3c],
            ["3135", _3c],
            ["3140", _3l],
            ["3141", _3l],
            ["3142", _3l],
            ["3143", _3l],
            ["3144", _3l],
            ["3145", _3l],
            ["3150", _3u],
            ["3151", _3u],
            ["3152", _3u],
            ["3153", _3u],
            ["3154", _3u],
            ["3155", _3u],
            ["3160", _43],
            ["3161", _43],
            ["3162", _43],
            ["3163", _43],
            ["3164", _43],
            ["3165", _43],
            ["3200", _4C],
            ["3201", _4C],
            ["3202", _4C],
            ["3203", _4C],
            ["3204", _4C],
            ["3205", _4C],
            ["3210", _4L],
            ["3211", _4L],
            ["3212", _4L],
            ["3213", _4L],
            ["3214", _4L],
            ["3215", _4L],
            ["3220", _4U],
            ["3221", _4U],
            ["3222", _4U],
            ["3223", _4U],
            ["3224", _4U],
            ["3225", _4U],
            ["3230", _4d],
            ["3231", _4d],
            ["3232", _4d],
            ["3233", _4d],
            ["3234", _4d],
            ["3235", _4d],
            ["3240", _4m],
            ["3241", _4m],
            ["3242", _4m],
            ["3243", _4m],
            ["3244", _4m],
            ["3245", _4m],
            ["3250", _4v],
            ["3251", _4v],
            ["3252", _4v],
            ["3253", _4v],
            ["3254", _4v],
            ["3255", _4v],
            ["3260", _54],
            ["3261", _54],
            ["3262", _54],
            ["3263", _54],
            ["3264", _54],
            ["3265", _54],
            ["3270", _5D],
            ["3271", _5D],
            ["3272", _5D],
            ["3273", _5D],
            ["3274", _5D],
            ["3275", _5D],
            ["3280", _5M],
            ["3281", _5M],
            ["3282", _5M],
            ["3283", _5M],
            ["3284", _5M],
            ["3285", _5M],
            ["3290", _5V],
            ["3291", _5V],
            ["3292", _5V],
            ["3293", _5V],
            ["3294", _5V],
            ["3295", _5V],
            ["3300", _5e],
            ["3301", _5e],
            ["3302", _5e],
            ["3303", _5e],
            ["3304", _5e],
            ["3305", _5e],
            ["3310", _5n],
            ["3311", _5n],
            ["3312", _5n],
            ["3313", _5n],
            ["3314", _5n],
            ["3315", _5n],
            ["3320", _5w],
            ["3321", _5w],
            ["3322", _5w],
            ["3323", _5w],
            ["3324", _5w],
            ["3325", _5w],
            ["3330", _65],
            ["3331", _65],
            ["3332", _65],
            ["3333", _65],
            ["3334", _65],
            ["3335", _65],
            ["3340", _6E],
            ["3341", _6E],
            ["3342", _6E],
            ["3343", _6E],
            ["3344", _6E],
            ["3345", _6E],
            ["3350", _6N],
            ["3351", _6N],
            ["3352", _6N],
            ["3353", _6N],
            ["3354", _6N],
            ["3355", _6N],
            ["3360", _6W],
            ["3361", _6W],
            ["3362", _6W],
            ["3363", _6W],
            ["3364", _6W],
            ["3365", _6W],
            ["3370", _6e],
            ["3371", _6e],
            ["3372", _6e],
            ["3373", _6e],
            ["3374", _6e],
            ["3375", _6e],
            ["3400", _6n],
            ["3401", _6n],
            ["3402", _6n],
            ["3403", _6n],
            ["3404", _6n],
            ["3405", _6n],
            ["3410", _6w],
            ["3411", _6w],
            ["3412", _6w],
            ["3413", _6w],
            ["3414", _6w],
            ["3415", _6w],
            ["3420", _75],
            ["3421", _75],
            ["3422", _75],
            ["3423", _75],
            ["3424", _75],
            ["3425", _75],
            ["3430", _7E],
            ["3431", _7E],
            ["3432", _7E],
            ["3433", _7E],
            ["3434", _7E],
            ["3435", _7E],
            ["3440", _7N],
            ["3441", _7N],
            ["3442", _7N],
            ["3443", _7N],
            ["3444", _7N],
            ["3445", _7N],
            ["3450", _7W],
            ["3451", _7W],
            ["3452", _7W],
            ["3453", _7W],
            ["3454", _7W],
            ["3455", _7W],
            ["3460", _7f],
            ["3461", _7f],
            ["3462", _7f],
            ["3463", _7f],
            ["3464", _7f],
            ["3465", _7f],
            ["3470", _7o],
            ["3471", _7o],
            ["3472", _7o],
            ["3473", _7o],
            ["3474", _7o],
            ["3475", _7o],
            ["3480", _7x],
            ["3481", _7x],
            ["3482", _7x],
            ["3483", _7x],
            ["3484", _7x],
            ["3485", _7x],
            ["3490", _86],
            ["3491", _86],
            ["3492", _86],
            ["3493", _86],
            ["3494", _86],
            ["3495", _86],
            ["3500", _8F],
            ["3501", _8F],
            ["3502", _8F],
            ["3503", _8F],
            ["3504", _8F],
            ["3505", _8F],
            ["3510", _8O],
            ["3511", _8O],
            ["3512", _8O],
            ["3513", _8O],
            ["3514", _8O],
            ["3515", _8O],
            ["3520", _8X],
            ["3521", _8X],
            ["3522", _8X],
            ["3523", _8X],
            ["3524", _8X],
            ["3525", _8X],
            ["3530", _8g],
            ["3531", _8g],
            ["3532", _8g],
            ["3533", _8g],
            ["3534", _8g],
            ["3535", _8g],
            ["3540", _8p],
            ["3541", _8p],
            ["3542", _8p],
            ["3543", _8p],
            ["3544", _8p],
            ["3545", _8p],
            ["3550", _8y],
            ["3551", _8y],
            ["3552", _8y],
            ["3553", _8y],
            ["3554", _8y],
            ["3555", _8y],
            ["3560", _97],
            ["3561", _97],
            ["3562", _97],
            ["3563", _97],
            ["3564", _97],
            ["3565", _97],
            ["3570", _9G],
            ["3571", _9G],
            ["3572", _9G],
            ["3573", _9G],
            ["3574", _9G],
            ["3575", _9G],
            ["3600", _9P],
            ["3601", _9P],
            ["3602", _9P],
            ["3603", _9P],
            ["3604", _9P],
            ["3605", _9P],
            ["3610", _9Y],
            ["3611", _9Y],
            ["3612", _9Y],
            ["3613", _9Y],
            ["3614", _9Y],
            ["3615", _9Y],
            ["3620", _9h],
            ["3621", _9h],
            ["3622", _9h],
            ["3623", _9h],
            ["3624", _9h],
            ["3625", _9h],
            ["3630", _9q],
            ["3631", _9q],
            ["3632", _9q],
            ["3633", _9q],
            ["3634", _9q],
            ["3635", _9q],
            ["3640", _9z],
            ["3641", _9z],
            ["3642", _9z],
            ["3643", _9z],
            ["3644", _9z],
            ["3645", _9z],
            ["3650", _A8],
            ["3651", _A8],
            ["3652", _A8],
            ["3653", _A8],
            ["3654", _A8],
            ["3655", _A8],
            ["3660", _AH],
            ["3661", _AH],
            ["3662", _AH],
            ["3663", _AH],
            ["3664", _AH],
            ["3665", _AH],
            ["3670", _AQ],
            ["3671", _AQ],
            ["3672", _AQ],
            ["3673", _AQ],
            ["3674", _AQ],
            ["3675", _AQ],
            ["3680", _AZ],
            ["3681", _AZ],
            ["3682", _AZ],
            ["3683", _AZ],
            ["3684", _AZ],
            ["3685", _AZ],
            ["3690", _Ai],
            ["3691", _Ai],
            ["3692", _Ai],
            ["3693", _Ai],
            ["3694", _Ai],
            ["3695", _Ai],
            ["37", _As],
            ["3900", _B1],
            ["3901", _B1],
            ["3902", _B1],
            ["3903", _B1],
            ["3904", _B1],
            ["3905", _B1],
            ["3906", _B1],
            ["3907", _B1],
            ["3908", _B1],
            ["3909", _B1],
            ["3910", _BB],
            ["3911", _BB],
            ["3912", _BB],
            ["3913", _BB],
            ["3914", _BB],
            ["3915", _BB],
            ["3916", _BB],
            ["3917", _BB],
            ["3918", _BB],
            ["3919", _BB],
            ["3920", _BP],
            ["3921", _BP],
            ["3922", _BP],
            ["3923", _BP],
            ["3924", _BP],
            ["3925", _BP],
            ["3926", _BP],
            ["3927", _BP],
            ["3928", _BP],
            ["3929", _BP],
            ["3930", _Bd],
            ["3931", _Bd],
            ["3932", _Bd],
            ["3933", _Bd],
            ["3934", _Bd],
            ["3935", _Bd],
            ["3936", _Bd],
            ["3937", _Bd],
            ["3938", _Bd],
            ["3939", _Bd],
            ["3940", _Bl],
            ["3941", _Bl],
            ["3942", _Bl],
            ["3943", _Bl],
            ["3950", _Bx],
            ["3951", _Bx],
            ["3952", _Bx],
            ["3953", _Bx],
            ["3954", _Bx],
            ["3955", _Bx],
            ["400", _C1],
            ["401", _C6],
            ["402", _CB],
            ["403", _CI],
            ["410", _CM],
            ["411", _CM],
            ["412", _CM],
            ["413", _CM],
            ["414", _CT],
            ["415", _Cc],
            ["416", _Cg],
            ["417", _Cm],
            ["420", _Cr],
            ["421", _Cy],
            ["422", _D9],
            ["423", _DQ],
            ["424", _DZ],
            ["425", _Dq],
            ["426", _Dy],
            ["427", _E8],
            ["4300", _EF],
            ["4301", _EF],
            ["4302", _EM],
            ["4303", _ET],
            ["4304", _Ea],
            ["4305", _Ea],
            ["4306", _Ea],
            ["4307", _Eh],
            ["4308", _Eo],
            ["4309", _Ex],
            ["4310", _F4],
            ["4311", _F4],
            ["4312", _FB],
            ["4313", _FI],
            ["4314", _FP],
            ["4315", _FP],
            ["4316", _FP],
            ["4317", _FW],
            ["4318", _Fd],
            ["4319", _Fk],
            ["4320", _Fr],
            ["4321", _Fy],
            ["4322", _Fy],
            ["4323", _Fy],
            ["4324", _G7],
            ["4325", _G7],
            ["4326", _GE],
            ["4330", _GO],
            ["4331", _GY],
            ["4332", _Gi],
            ["4333", _Gs],
            ["7001", _H2],
            ["7002", _HA],
            ["7003", _HK],
            ["7004", _HR],
            ["7005", _HZ],
            ["7006", _Hh],
            ["7007", _Hr],
            ["7008", _Hz],
            ["7009", _I7],
            ["7010", _IF],
            ["7011", _IP],
            ["7020", _IZ],
            ["7021", _Ih],
            ["7022", _Io],
            ["7023", _Is],
            ["7030", _J2],
            ["7031", _J2],
            ["7032", _J2],
            ["7033", _J2],
            ["7034", _J2],
            ["7035", _J2],
            ["7036", _J2],
            ["7037", _J2],
            ["7038", _J2],
            ["7039", _J2],
            ["7040", _JC],
            ["7041", _JJ],
            ["710", _JQ],
            ["711", _JQ],
            ["712", _JQ],
            ["713", _JQ],
            ["714", _JQ],
            ["715", _JQ],
            ["716", _JQ],
            ["717", _JQ],
            ["7230", _Ja],
            ["7231", _Ja],
            ["7232", _Ja],
            ["7233", _Ja],
            ["7234", _Ja],
            ["7235", _Ja],
            ["7236", _Ja],
            ["7237", _Ja],
            ["7238", _Ja],
            ["7239", _Ja],
            ["7240", _Ji],
            ["7241", _Jq],
            ["7242", _Jy],
            ["7250", _K6],
            ["7251", _KG],
            ["7252", _KN],
            ["7253", _KW],
            ["7254", _KW],
            ["7255", _Kf],
            ["7256", _Kn],
            ["7257", _Ku],
            ["7258", _L1],
            ["7259", _L9],
            ["8001", _LO],
            ["8002", _LS],
            ["8003", _Lb],
            ["8004", _Lh],
            ["8005", _Lp],
            ["8006", _Ly],
            ["8007", _M5],
            ["8008", _MJ],
            ["8009", _MR],
            ["8010", _MX],
            ["8011", _Me],
            ["8012", _Mm],
            ["8013", _Mr],
            ["8014", _My],
            ["8017", _N5],
            ["8018", _NC],
            ["8019", _NK],
            ["8020", _NR],
            ["8026", _Nb],
            ["8030", _Nr],
            ["8040", _Ny],
            ["8041", _O5],
            ["8042", _OC],
            ["8043", _OL],
            ["8110", _OP],
            ["8111", _OW],
            ["8112", _Oa],
            ["8200", _Oh],
            ["90", _Ol],
            ["91", _Op],
            ["92", _Op],
            ["93", _Op],
            ["94", _Op],
            ["95", _Op],
            ["96", _Op],
            ["97", _Op],
            ["98", _Op],
            ["99", _Op]
        ]); //#2773
        $_.gs1syntax = _Oq; //#2775
        $k[$j++] = Infinity; //#2777
        var _Or = $a(["00", "01", "02", "03", "04", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "31", "32", "33", "34", "35", "36", "41"]); //#2782
        for (var _Os = 0, _Ot = _Or.length; _Os < _Ot; _Os++) { //#2783
            var _Ou = $get(_Or, _Os); //#2783
            $k[$j++] = _Ou; //#2783
            $k[$j++] = _Ou; //#2783
        } //#2783
        var _Ov = $d(); //#2783
        $_.aifixed = _Ov; //#2783
        $k[$j++] = Infinity; //#2785
        $k[$j++] = 0; //#2787
        for (var _Ow = 0, _Ox = "!\"%&'\(\)*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz".length; _Ow < _Ox; _Ow++) { //#2787
            var _Oy = $get("!\"%&'\(\)*+,-./0123456789:;<=>?ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz", _Ow); //#2787
            var _Oz = $k[--$j]; //#2787
            $k[$j++] = _Oy; //#2787
            $k[$j++] = _Oz; //#2787
            $k[$j++] = _Oz + 1; //#2787
        } //#2787
        $j--; //#2787
        var _P0 = $d(); //#2787
        $_.cset82 = _P0; //#2788
        $k[$j++] = Infinity; //#2790
        $k[$j++] = 0; //#2792
        for (var _P1 = 0, _P2 = "#-/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".length; _P1 < _P2; _P1++) { //#2792
            var _P4 = $k[--$j]; //#2792
            $k[$j++] = $get("#-/0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", _P1); //#2792
            $k[$j++] = _P4; //#2792
            $k[$j++] = _P4 + 1; //#2792
        } //#2792
        $j--; //#2792
        var _P5 = $d(); //#2792
        $_.cset39 = _P5; //#2793
        $k[$j++] = Infinity; //#2795
        $k[$j++] = 0; //#2797
        for (var _P6 = 0, _P7 = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ".length; _P6 < _P7; _P6++) { //#2797
            var _P9 = $k[--$j]; //#2797
            $k[$j++] = $get("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", _P6); //#2797
            $k[$j++] = _P9; //#2797
            $k[$j++] = _P9 + 1; //#2797
        } //#2797
        $j--; //#2797
        var _PA = $d(); //#2797
        $_.cset32 = _PA; //#2798
        $k[$j++] = Infinity; //#2800
        $k[$j++] = 0; //#2802
        for (var _PB = 0, _PC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".length; _PB < _PC; _PB++) { //#2802
            var _PE = $k[--$j]; //#2802
            $k[$j++] = $get("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_", _PB); //#2802
            $k[$j++] = _PE; //#2802
            $k[$j++] = _PE + 1; //#2802
        } //#2802
        $j--; //#2802
        var _PF = $d(); //#2802
        $_.cset64 = _PF; //#2803
        $k[$j++] = Infinity; //#2805
        var _PG = $a(['004', '008', '010', '012', '016', '020', '024', '028', '031', '032', '036', '040', '044', '048', '050', '051', '052', '056', '060', '064', '068', '070', '072', '074', '076', '084', '086', '090', '092', '096', '100', '104', '108', '112', '116', '120', '124', '132', '136', '140', '144', '148', '152', '156', '158', '162', '166', '170', '174', '175', '178', '180', '184', '188', '191', '192', '196', '203', '204', '208', '212', '214', '218', '222', '226', '231', '232', '233', '234', '238', '239', '242', '246', '248', '250', '254', '258', '260', '262', '266', '268', '270', '275', '276', '288', '292', '296', '300', '304', '308', '312', '316', '320', '324', '328', '332', '334', '336', '340', '344', '348', '352', '356', '360', '364', '368', '372', '376', '380', '384', '388', '392', '398', '400', '404', '408', '410', '414', '417', '418', '422', '426', '428', '430', '434', '438', '440', '442', '446', '450', '454', '458', '462', '466', '470', '474', '478', '480', '484', '492', '496', '498', '499', '500', '504', '508', '512', '516', '520', '524', '528', '531', '533', '534', '535', '540', '548', '554', '558', '562', '566', '570', '574', '578', '580', '581', '583', '584', '585', '586', '591', '598', '600', '604', '608', '612', '616', '620', '624', '626', '630', '634', '638', '642', '643', '646', '652', '654', '659', '660', '662', '663', '666', '670', '674', '678', '682', '686', '688', '690', '694', '702', '703', '704', '705', '706', '710', '716', '724', '728', '729', '732', '740', '744', '748', '752', '756', '760', '762', '764', '768', '772', '776', '780', '784', '788', '792', '795', '796', '798', '800', '804', '807', '818', '826', '831', '832', '833', '834', '840', '850', '854', '858', '860', '862', '876', '882', '887', '894']); //#2823
        for (var _PH = 0, _PI = _PG.length; _PH < _PI; _PH++) { //#2824
            var _PJ = $get(_PG, _PH); //#2824
            $k[$j++] = _PJ; //#2824
            $k[$j++] = _PJ; //#2824
        } //#2824
        var _PK = $d(); //#2824
        $_.iso3166 = _PK; //#2824
        $k[$j++] = Infinity; //#2826
        var _PL = $a(['AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW']); //#2850
        for (var _PM = 0, _PN = _PL.length; _PM < _PN; _PM++) { //#2851
            var _PO = $get(_PL, _PM); //#2851
            $k[$j++] = _PO; //#2851
            $k[$j++] = _PO; //#2851
        } //#2851
        var _PP = $d(); //#2851
        $_.iso3166alpha2 = _PP; //#2851
        $k[$j++] = Infinity; //#2853
        var _PQ = $a(['008', '012', '032', '036', '044', '048', '050', '051', '052', '060', '064', '068', '072', '084', '090', '096', '104', '108', '116', '124', '132', '136', '144', '152', '156', '170', '174', '188', '191', '192', '203', '208', '214', '222', '230', '232', '238', '242', '262', '270', '292', '320', '324', '328', '332', '340', '344', '348', '352', '356', '360', '364', '368', '376', '388', '392', '396', '398', '400', '404', '408', '410', '414', '417', '418', '422', '426', '430', '434', '446', '454', '458', '462', '480', '484', '496', '498', '504', '512', '516', '524', '532', '533', '548', '554', '558', '566', '578', '586', '590', '598', '600', '604', '608', '634', '643', '646', '654', '682', '690', '694', '702', '704', '706', '710', '728', '748', '752', '756', '760', '764', '776', '780', '784', '788', '800', '807', '818', '826', '834', '840', '858', '860', '882', '886', '901', '925', '927', '928', '929', '930', '931', '932', '933', '934', '936', '938', '940', '941', '943', '944', '946', '947', '948', '949', '950', '951', '952', '953', '955', '956', '957', '958', '959', '960', '961', '962', '963', '964', '965', '967', '968', '969', '970', '971', '972', '973', '975', '976', '977', '978', '979', '980', '981', '984', '985', '986', '990', '994', '997', '999']); //#2875
        for (var _PR = 0, _PS = _PQ.length; _PR < _PS; _PR++) { //#2876
            var _PT = $get(_PQ, _PR); //#2876
            $k[$j++] = _PT; //#2876
            $k[$j++] = _PT; //#2876
        } //#2876
        var _PU = $d(); //#2876
        $_.iso4217 = _PU; //#2876
        $k[$j++] = Infinity; //#2878
        var _PV = $a(['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90', '91', '92', '93', '94', '95', '96', '97', '98', '99']); //#2881
        for (var _PW = 0, _PX = _PV.length; _PW < _PX; _PW++) { //#2882
            var _PY = $get(_PV, _PW); //#2882
            $k[$j++] = _PY; //#2882
            $k[$j++] = _PY; //#2882
        } //#2882
        var _PZ = $d(); //#2882
        $_.aidcmediatype = _PZ; //#2882
        $k[$j++] = Infinity; //#2884
        var _Pa = $a(['1A', '1B', '1D', '1F', '1G', '1W', '200', '201', '202', '203', '204', '205', '206', '210', '211', '212', '2C', '3A', '3H', '43', '44', '4A', '4B', '4C', '4D', '4F', '4G', '4H', '5H', '5L', '5M', '6H', '6P', '7A', '7B', '8', '8A', '8B', '8C', '9', 'AA', 'AB', 'AC', 'AD', 'AF', 'AG', 'AH', 'AI', 'AJ', 'AL', 'AM', 'AP', 'APE/AT', 'AV', 'B4', 'BB', 'BC', 'BD', 'BE', 'BF', 'BG', 'BGE', 'BH', 'BI', 'BJ', 'BK', 'BL', 'BM', 'BME', 'BN', 'BO', 'BP', 'BQ', 'BR', 'BRI', 'BS', 'BT', 'BU', 'BV', 'BW', 'BX', 'BY', 'BZ', 'CA', 'CB', 'CBL', 'CC', 'CCE', 'CD', 'CE', 'CF', 'CG', 'CH', 'CI', 'CJ', 'CK', 'CL', 'CM', 'CN', 'CO', 'CP', 'CQ', 'CR', 'CS', 'CT', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DA', 'DB', 'DC', 'DG', 'DH', 'DI', 'DJ', 'DK', 'DL', 'DM', 'DN', 'DP', 'DPE', 'DR', 'DS', 'DT', 'DU', 'DV', 'DW', 'DX', 'DY', 'E1', 'E2', 'E3', 'EC', 'ED', 'EE', 'EF', 'EG', 'EH', 'EI', 'EN', 'FB', 'FC', 'FD', 'FE', 'FI', 'FL', 'FO', 'FOB', 'FP', 'FPE', 'FR', 'FT', 'FW', 'FX', 'GB', 'GI', 'GL', 'GR', 'GU', 'GY', 'GZ', 'HA', 'HB', 'HC', 'HG', 'HN', 'HR', 'IA', 'IB', 'IC', 'ID', 'IE', 'IF', 'IG', 'IH', 'IK', 'IL', 'IN', 'IZ', 'JB', 'JC', 'JG', 'JR', 'JT', 'JY', 'KG', 'KI', 'LAB', 'LE', 'LG', 'LT', 'LU', 'LV', 'LZ', 'MA', 'MB', 'MC', 'ME', 'MPE', 'MR', 'MS', 'MT', 'MW', 'MX', 'NA', 'NE', 'NF', 'NG', 'NS', 'NT', 'NU', 'NV', 'OA', 'OB', 'OC', 'OD', 'OE', 'OF', 'OK', 'OPE', 'OT', 'OU', 'P2', 'PA', 'PAE', 'PB', 'PC', 'PD', 'PE', 'PF', 'PG', 'PH', 'PI', 'PJ', 'PK', 'PL', 'PLP', 'PN', 'PO', 'POP', 'PP', 'PPE', 'PR', 'PT', 'PU', 'PUE', 'PV', 'PX', 'PY', 'PZ', 'QA', 'QB', 'QC', 'QD', 'QF', 'QG', 'QH', 'QJ', 'QK', 'QL', 'QM', 'QN', 'QP', 'QQ', 'QR', 'QS', 'RB1', 'RB2', 'RB3', 'RCB', 'RD', 'RG', 'RJ', 'RK', 'RL', 'RO', 'RT', 'RZ', 'S1', 'SA', 'SB', 'SC', 'SD', 'SE', 'SEC', 'SH', 'SI', 'SK', 'SL', 'SM', 'SO', 'SP', 'SS', 'ST', 'STL', 'SU', 'SV', 'SW', 'SX', 'SY', 'SZ', 'T1', 'TB', 'TC', 'TD', 'TE', 'TEV', 'TG', 'THE', 'TI', 'TK', 'TL', 'TN', 'TO', 'TR', 'TRE', 'TS', 'TT', 'TTE', 'TU', 'TV', 'TW', 'TWE', 'TY', 'TZ', 'UC', 'UN', 'UUE', 'VA', 'VG', 'VI', 'VK', 'VL', 'VN', 'VO', 'VP', 'VQ', 'VR', 'VS', 'VY', 'WA', 'WB', 'WC', 'WD', 'WF', 'WG', 'WH', 'WJ', 'WK', 'WL', 'WM', 'WN', 'WP', 'WQ', 'WR', 'WRP', 'WS', 'WT', 'WU', 'WV', 'WW', 'WX', 'WY', 'WZ', 'X11', 'X12', 'X15', 'X16', 'X17', 'X18', 'X19', 'X20', 'X3', 'XA', 'XB', 'XC', 'XD', 'XF', 'XG', 'XH', 'XJ', 'XK', 'YA', 'YB', 'YC', 'YD', 'YF', 'YG', 'YH', 'YJ', 'YK', 'YL', 'YM', 'YN', 'YP', 'YQ', 'YR', 'YS', 'YT', 'YV', 'YW', 'YX', 'YY', 'YZ', 'ZA', 'ZB', 'ZC', 'ZD', 'ZF', 'ZG', 'ZH', 'ZJ', 'ZK', 'ZL', 'ZM', 'ZN', 'ZP', 'ZQ', 'ZR', 'ZS', 'ZT', 'ZU', 'ZV', 'ZW', 'ZX', 'ZY', 'ZZ']); //#2919
        for (var _Pb = 0, _Pc = _Pa.length; _Pb < _Pc; _Pb++) { //#2920
            var _Pd = $get(_Pa, _Pb); //#2920
            $k[$j++] = _Pd; //#2920
            $k[$j++] = _Pd; //#2920
        } //#2920
        var _Pe = $d(); //#2920
        $_.packagetype = _Pe; //#2920
        $_ = $__;
    }
    //#2936
    var $__ = $_; //#2938
    $_ = Object.assign({}, $_, bwipp_gs1process.globals); //#2938
    var _Pf = $k[--$j]; //#2945
    if ($eq(_Pf, 'ai')) { //#3179
        var _Pg = $k[--$j]; //#2948
        $anchorsearch(_Pg, "\("); //#2948
        var _Ph = $k[--$j]; //#2948
        if (!_Ph) { //#2950
            $k[$j - 1] = "bwipp.GS1aiMissingOpenParen#2949"; //#2949
            $k[$j++] = "AIs must start with '\('"; //#2949
            bwipp_raiseerror(); //#2949
        } //#2949
        $j--; //#2951
        var _Pj = $k[--$j]; //#2952
        $k[$j++] = Infinity; //#2959
        $k[$j++] = _Pj; //#2959
        for (;;) { //#2959
            var _Pk = $k[$j - 1]; //#2953
            if (_Pk.length == 0) { //#2953
                $j--; //#2953
                break; //#2953
            } //#2953
            var _Pl = $k[--$j]; //#2954
            $search(_Pl, "\)"); //#2954
            var _Pm = $k[--$j]; //#2954
            if (!_Pm) { //#2956
                $cleartomark(); //#2955
                $k[$j++] = "bwipp.GS1aiMissingCloseParen#2955"; //#2955
                $k[$j++] = "AIs must end with '\)'"; //#2955
                bwipp_raiseerror(); //#2955
            } //#2955
            var _Pn = $k[--$j]; //#2957
            $j--; //#2957
            var _Pq = $k[--$j]; //#2957
            $k[$j++] = _Pn; //#2958
            $search(_Pq, "\("); //#2958
            var _Pr = $k[--$j]; //#2958
            if (_Pr) { //#2958
                var _Ps = $k[--$j]; //#2958
                $j--; //#2958
                var _Pv = $k[--$j]; //#2958
                $k[$j++] = _Ps; //#2958
                $k[$j++] = _Pv; //#2958
            } else { //#2958
                $k[$j++] = ""; //#2958
            } //#2958
        } //#2958
        var _Pw = $counttomark(); //#2960
        $k[$j++] = _Pw; //#2960
        if (_Pw > 0) { //#2960
            var _Px = $k[--$j]; //#2960
            for (var _Pz = _Px, _Py = (~~(_Px / 2)) + 1; _Pz >= _Py; _Pz -= 1) { //#2960
                $r(_Pz, -1); //#2960
            } //#2960
        } else { //#2960
            $j--; //#2960
        } //#2960
        $astore($a(~~($counttomark() / 2))); //#2961
        var _Q2 = $k[--$j]; //#2961
        $_.ais = _Q2; //#2961
        $astore($a($counttomark())); //#2962
        var _Q6 = $k[--$j]; //#2962
        $k[$j++] = Infinity; //#2964
        $forall(_Q6, function() { //#2964
            $k[$j++] = new Map([
                ["parse", $_.parse],
                ["parseonly", true],
                ["parsefnc", false]
            ]); //#2963
            bwipp_parseinput(); //#2963
        }); //#2963
        var _Q9 = $a(); //#2963
        $_.vals = _Q9; //#2964
        $j--; //#2965
    } else { //#3179
        var _QA = $k[--$j]; //#2970
        $anchorsearch(_QA, "http://"); //#2970
        var _QB = $k[--$j]; //#2970
        if (!_QB) { //#2975
            var _QC = $k[--$j]; //#2971
            $anchorsearch(_QC, "HTTP://"); //#2971
            var _QD = $k[--$j]; //#2971
            if (!_QD) { //#2975
                var _QE = $k[--$j]; //#2972
                $anchorsearch(_QE, "https://"); //#2972
                var _QF = $k[--$j]; //#2972
                if (!_QF) { //#2975
                    var _QG = $k[--$j]; //#2973
                    $anchorsearch(_QG, "HTTPS://"); //#2973
                    var _QH = $k[--$j]; //#2973
                    if (!_QH) { //#2975
                        $k[$j - 1] = "bwipp.GS1dlURIbadScheme#2974"; //#2974
                        $k[$j++] = "Scheme must be http:// HTTP:// https:// or HTTPS://"; //#2974
                        bwipp_raiseerror(); //#2974
                    } //#2974
                } //#2974
            } //#2974
        } //#2974
        $j--; //#2976
        var _QI = $k[--$j]; //#2979
        $search(_QI, "/"); //#2979
        var _QJ = $k[--$j]; //#2979
        if (!_QJ) { //#2981
            $k[$j - 1] = "bwipp.GS1dlMissingDomainOrPathInfo#2980"; //#2980
            $k[$j++] = "URI must contain a domain and path info"; //#2980
            bwipp_raiseerror(); //#2980
        } //#2980
        $j -= 2; //#2982
        var _QK = $k[--$j]; //#2985
        $search(_QK, "#"); //#2985
        var _QL = $k[--$j]; //#2987
        if (_QL) { //#2987
            var _QM = $k[--$j]; //#2986
            $j--; //#2986
            $k[$j - 1] = _QM; //#2986
        } //#2986
        var _QQ = $k[--$j]; //#2990
        $search(_QQ, "?"); //#2990
        var _QR = $k[--$j]; //#2990
        if (!_QR) { //#2992
            var _QS = $k[--$j]; //#2991
            $k[$j++] = ""; //#2991
            $k[$j++] = null; //#2991
            $k[$j++] = _QS; //#2991
        } //#2991
        var _QT = $k[--$j]; //#2993
        $_.pp = _QT; //#2993
        $j--; //#2994
        var _QU = $k[--$j]; //#2995
        $_.qp = _QU; //#2995
        $k[$j++] = Infinity; //#2998
        $k[$j++] = 0; //#3002
        $k[$j++] = 0; //#3002
        $k[$j++] = $_.pp; //#3002
        for (;;) { //#3002
            var _QW = $k[--$j]; //#3000
            $search(_QW, "/"); //#3000
            var _QX = $k[--$j]; //#3000
            if (!_QX) { //#3000
                $j--; //#3000
                break; //#3000
            } //#3000
            var _QY = $k[--$j]; //#3001
            $j--; //#3001
            var _Qa = _QY.length + 1; //#3001
            var _Qb = $k[--$j]; //#3001
            var _Qc = $k[$j - 1]; //#3001
            $k[$j++] = $f(_Qa + _Qc) //#3001
            $k[$j++] = _Qb; //#3001
        } //#3001
        $astore($a($counttomark() - 1)); //#3003
        var _Qf = $k[--$j]; //#3003
        $_.pipos = _Qf; //#3003
        $j -= 2; //#3003
        if ($_.pipos.length <= 1) { //#3006
            $k[$j++] = "bwipp.GS1dlNoAIinfo#3005"; //#3005
            $k[$j++] = "The path was too short to contain AI info"; //#3005
            bwipp_raiseerror(); //#3005
        } //#3005
        $k[$j++] = false; //#3022
        for (var _Qi = $_.pipos.length - 2; _Qi >= 0; _Qi -= 2) { //#3022
            var _Qk = $get($_.pipos, _Qi); //#3012
            var _Qo = $geti($_.pp, _Qk, $f($get($_.pipos, _Qi + 1) - _Qk) - 1); //#3013
            var _Qq = $has($_.gs1syntax, _Qo); //#3014
            $k[$j++] = _Qi; //#3020
            $k[$j++] = _Qo; //#3020
            if (_Qq) { //#3019
                var _Qs = $k[--$j]; //#3015
                if ($has($get($_.gs1syntax, _Qs), 'dlpkey')) { //#3017
                    var _Qv = $k[--$j]; //#3016
                    $k[$j - 1] = _Qv; //#3016
                    $k[$j++] = true; //#3016
                    break; //#3016
                } //#3016
            } else { //#3019
                $j--; //#3019
            } //#3019
            $j--; //#3021
        } //#3021
        var _Qx = $k[--$j]; //#3023
        if (!_Qx) { //#3025
            $k[$j++] = "bwipp.GS1dlNoAIinfo#3024"; //#3024
            $k[$j++] = "The path does not contain a valid primary key"; //#3024
            bwipp_raiseerror(); //#3024
        } //#3024
        var _Qz = $k[--$j]; //#3026
        var _R0 = $get($_.pipos, _Qz); //#3026
        $_.pp = $geti($_.pp, _R0, $f($_.pp.length - _R0)) //#3026
        $_.uriunescape = function() {
            var _R4 = $k[--$j]; //#3029
            $_.qq = _R4; //#3029
            var _R5 = $k[--$j]; //#3030
            $_.in = _R5; //#3030
            $_.out = $s($_.in.length); //#3031
            $_.badhex = false; //#3032
            $k[$j++] = 0; //#3057
            $k[$j++] = 0; //#3057
            for (;;) { //#3057
                var _R9 = $k[$j - 2]; //#3034
                if (_R9 >= $_.in.length) { //#3034
                    break; //#3034
                } //#3034
                var _RD = $k[$j - 2]; //#3035
                var _RE = $get($_.in, _RD); //#3035
                $k[$j++] = _RE; //#3056
                if ((_RE == 43) && $_.qq) { //#3055
                    $j--; //#3037
                    var _RH = $k[--$j]; //#3037
                    $put($_.out, _RH, 32); //#3037
                    $k[$j - 1] += 1; //#3038
                    $k[$j++] = _RH + 1; //#3038
                } else { //#3055
                    var _RJ = $k[$j - 1]; //#3040
                    var _RL = $k[$j - 3]; //#3040
                    if ((_RJ == 37) && (_RL < ($_.in.length - 2))) { //#3055
                        $j--; //#3041
                        var _RP = $k[$j - 2]; //#3042
                        var _RQ = $geti($_.in, _RP + 1, 2); //#3042
                        $k[$j++] = 0; //#3049
                        for (var _RR = 0, _RS = _RQ.length; _RR < _RS; _RR++) { //#3049
                            var _RT = $get(_RQ, _RR); //#3049
                            $k[$j++] = _RT; //#3047
                            if ((_RT >= 48) && (_RT <= 57)) { //#3046
                                $k[$j - 1] -= 48; //#3043
                            } else { //#3046
                                var _RV = $k[$j - 1]; //#3044
                                if ((_RV >= 65) && (_RV <= 70)) { //#3046
                                    $k[$j - 1] -= 55; //#3044
                                } else { //#3046
                                    var _RX = $k[$j - 1]; //#3045
                                    if ((_RX >= 97) && (_RX <= 102)) { //#3046
                                        $k[$j - 1] -= 87; //#3045
                                    } else { //#3046
                                        $j -= 2; //#3046
                                        $_.badhex = true; //#3046
                                        $k[$j++] = 0; //#3046
                                        break; //#3046
                                    } //#3046
                                } //#3046
                            } //#3046
                            var _RZ = $k[--$j]; //#3048
                            var _Ra = $k[--$j]; //#3048
                            $k[$j++] = $f(_RZ + _Ra * 16) //#3048
                        } //#3048
                        if ($_.badhex) { //#3050
                            $j -= 2; //#3050
                            break; //#3050
                        } //#3050
                        var _Rd = $k[--$j]; //#3051
                        var _Re = $k[--$j]; //#3051
                        $put($_.out, _Re, _Rd); //#3051
                        $k[$j - 1] += 3; //#3052
                        $k[$j++] = _Re + 1; //#3052
                    } else { //#3055
                        var _Rh = $k[--$j]; //#3054
                        var _Ri = $k[--$j]; //#3054
                        $put($_.out, _Ri, _Rh); //#3054
                        $k[$j - 1] += 1; //#3055
                        $k[$j++] = _Ri + 1; //#3055
                    } //#3055
                } //#3055
            } //#3055
            if ($_.badhex) { //#3060
                $cleartomark(); //#3059
                $k[$j++] = "bwipp.GS1dlBadHexCharacter#3059"; //#3059
                $k[$j++] = "Invalid hex character"; //#3059
                bwipp_raiseerror(); //#3059
            } //#3059
            var _Rm = $k[--$j]; //#3061
            $_.out = $geti($_.out, 0, _Rm); //#3061
            $k[$j - 1] = $_.out; //#3063
        }; //#3063
        $_.isvaliddlpkeyseq = function() {
            var _Rp = $k[--$j]; //#3067
            $_.in = _Rp; //#3067
            var _Rt = $get($_.gs1syntax, $get($_.in, 0)); //#3069
            $k[$j++] = false; //#3081
            $forall($get(_Rt, 'dlpkey'), function() { //#3081
                var _Rv = $k[--$j]; //#3070
                $_.seq = _Rv; //#3070
                $_.i = 1; //#3071
                $_.j = 0; //#3071
                for (;;) { //#3079
                    if ($_.i >= $_.in.length) { //#3073
                        break; //#3073
                    } //#3073
                    if ($_.j >= $_.seq.length) { //#3074
                        break; //#3074
                    } //#3074
                    if ($eq($get($_.in, $_.i), $get($_.seq, $_.j))) { //#3077
                        $_.i = $_.i + 1; //#3076
                    } //#3076
                    $_.j = $_.j + 1; //#3078
                } //#3078
                if ($_.i == $_.in.length) { //#3080
                    $k[$j - 1] = true; //#3080
                    return true; //#3080
                } //#3080
            }); //#3080
        }; //#3080
        $_.ais = $a(99); //#3084
        $_.vals = $a(99); //#3085
        $k[$j++] = Infinity; //#3086
        $k[$j++] = 0; //#3099
        $k[$j++] = $_.pp; //#3099
        for (;;) { //#3099
            var _SD = $k[--$j]; //#3090
            $search(_SD, "/"); //#3090
            var _SE = $k[--$j]; //#3097
            if (_SE) { //#3096
                var _SG = $k[--$j]; //#3091
                $j--; //#3091
                var _SI = $k[--$j]; //#3091
                var _SJ = $k[$j - 1]; //#3091
                $put($_.ais, _SJ, _SG); //#3091
                $search(_SI, "/"); //#3093
                var _SK = $k[--$j]; //#3093
                if (_SK) { //#3093
                    var _SL = $k[--$j]; //#3093
                    $k[$j - 1] = _SL; //#3093
                } else { //#3093
                    var _SN = $k[--$j]; //#3093
                    $k[$j++] = ""; //#3093
                    $k[$j++] = _SN; //#3093
                } //#3093
                var _SP = $k[--$j]; //#3094
                var _SR = $k[$j - 2]; //#3094
                $k[$j++] = $_.vals; //#3094
                $k[$j++] = _SR; //#3094
                $k[$j++] = _SP; //#3094
                $k[$j++] = false; //#3094
                $_.uriunescape(); //#3094
                var _SS = $k[--$j]; //#3094
                var _ST = $k[--$j]; //#3094
                var _SU = $k[--$j]; //#3094
                $put(_SU, _ST, _SS); //#3094
            } else { //#3096
                $j--; //#3096
                break; //#3096
            } //#3096
            var _SV = $k[--$j]; //#3098
            $k[$j - 1] += 1; //#3098
            $k[$j++] = _SV; //#3098
        } //#3098
        var _SX = $k[--$j]; //#3100
        $_.plen = _SX; //#3100
        $k[$j++] = _SX; //#3107
        if (_SX > 1) { //#3107
            $k[$j++] = $geti($_.ais, 0, $_.plen); //#3104
            $_.isvaliddlpkeyseq(); //#3104
            var _Sb = $k[--$j]; //#3104
            if (!_Sb) { //#3106
                $cleartomark(); //#3105
                $k[$j++] = "bwipp.GS1dlBadPathInfo#3105"; //#3105
                $k[$j++] = "The AIs in the path are not a valid key-qualifier sequence for the key"; //#3105
                bwipp_raiseerror(); //#3105
            } //#3105
        } //#3105
        $k[$j++] = $_.qp; //#3125
        for (;;) { //#3125
            var _Sd = $k[$j - 1]; //#3111
            if (_Sd.length == 0) { //#3111
                $j--; //#3111
                break; //#3111
            } //#3111
            var _Se = $k[--$j]; //#3112
            $search(_Se, "&"); //#3112
            var _Sf = $k[--$j]; //#3112
            if (_Sf) { //#3112
                var _Sg = $k[--$j]; //#3112
                $k[$j - 1] = _Sg; //#3112
            } else { //#3112
                var _Si = $k[--$j]; //#3112
                $k[$j++] = ""; //#3112
                $k[$j++] = _Si; //#3112
            } //#3112
            var _Sj = $k[--$j]; //#3113
            $search(_Sj, "="); //#3113
            var _Sk = $k[--$j]; //#3124
            if (_Sk) { //#3123
                var _Sl = $k[$j - 1]; //#3114
                var _So = true; //#3114
                $forall(_Sl, function() { //#3114
                    var _Sm = $k[--$j]; //#3114
                    _So = _So && ((_Sm >= 48) && (_Sm <= 57)); //#3114
                }); //#3114
                if (_So) { //#3120
                    var _Sq = $k[--$j]; //#3115
                    $j--; //#3115
                    var _Ss = $k[--$j]; //#3115
                    var _Su = $k[$j - 2]; //#3115
                    $put($_.ais, _Su, _Sq); //#3115
                    $k[$j++] = $_.vals; //#3117
                    $k[$j++] = _Su; //#3117
                    $k[$j++] = _Ss; //#3117
                    $k[$j++] = true; //#3117
                    $_.uriunescape(); //#3117
                    var _Sw = $k[--$j]; //#3117
                    var _Sx = $k[--$j]; //#3117
                    var _Sy = $k[--$j]; //#3117
                    $put(_Sy, _Sx, _Sw); //#3117
                    var _Sz = $k[--$j]; //#3118
                    $k[$j - 1] += 1; //#3118
                    $k[$j++] = _Sz; //#3118
                } else { //#3120
                    $j -= 3; //#3120
                } //#3120
            } else { //#3123
                $j--; //#3123
            } //#3123
        } //#3123
        var _T3 = $k[$j - 1]; //#3128
        var _T5 = $geti($_.ais, $_.plen, $f(_T3 - $_.plen)); //#3128
        for (var _T6 = 0, _T7 = _T5.length; _T6 < _T7; _T6++) { //#3143
            var _T8 = $get(_T5, _T6); //#3143
            var _TA = $has($_.gs1syntax, _T8); //#3129
            $k[$j++] = _T8; //#3133
            if (_TA) { //#3132
                var _TC = $k[$j - 1]; //#3130
                var _TD = $get($_.gs1syntax, _TC); //#3130
                var _TE = $has(_TD, 'dlattr'); //#3130
                $k[$j++] = _TD; //#3130
                $k[$j++] = 'dlattr'; //#3130
                if (_TE) { //#3130
                    var _TF = $k[--$j]; //#3130
                    var _TG = $k[--$j]; //#3130
                    $k[$j++] = $get(_TG, _TF); //#3130
                } else { //#3130
                    $j -= 2; //#3130
                    $k[$j++] = true; //#3130
                } //#3130
            } else { //#3132
                $k[$j++] = $_.dontlint; //#3132
            } //#3132
            var _TJ = $k[--$j]; //#3134
            if (!_TJ) { //#3141
                var _TK = $k[$j - 1]; //#3135
                var _TL = _TK.length; //#3135
                var _TM = $s(_TL + 46); //#3135
                $puti(_TM, 0, "AI \("); //#3136
                $puti(_TM, 4, _TK); //#3137
                $puti(_TM, _TL + 4, "\) is not a valid GS1 DL URI data attribute"); //#3138
                $j--; //#3139
                var _TQ = $counttomark() + 2; //#3140
                $k[$j++] = "bwipp.GS1dlInvalidDataAttribute#3139"; //#3140
                $k[$j++] = _TM; //#3140
                $r(_TQ + 1, 2); //#3140
                $cleartomark(); //#3140
                bwipp_raiseerror(); //#3140
            } //#3140
            $j--; //#3142
        } //#3142
        var _TT = $k[$j - 1]; //#3146
        var _TV = $geti($_.ais, $_.plen, $f(_TT - $_.plen)); //#3146
        for (var _TW = 0, _TX = _TV.length; _TW < _TX; _TW++) { //#3162
            $k[$j++] = $get(_TV, _TW); //#3160
            for (var _Ta = $_.plen; _Ta >= 1; _Ta -= 1) { //#3160
                var _Tb = $k[$j - 1]; //#3148
                $k[$j++] = _Ta; //#3150
                $k[$j++] = _Tb; //#3150
                $k[$j++] = Infinity; //#3148
                $aload($geti($_.ais, 0, $_.plen)); //#3149
                $r($counttomark() + 3, -2); //#3150
                var _Tg = $k[--$j]; //#3150
                var _Th = $k[--$j]; //#3150
                $k[$j++] = _Tg; //#3150
                $r(_Th, 1); //#3150
                var _Ti = $a(); //#3150
                $k[$j++] = _Ti; //#3151
                $_.isvaliddlpkeyseq(); //#3151
                var _Tj = $k[--$j]; //#3159
                if (_Tj) { //#3159
                    var _Tk = $k[--$j]; //#3152
                    $k[$j - 1] = _Tk; //#3152
                    var _Tm = $k[$j - 1]; //#3153
                    var _Tn = _Tm.length; //#3153
                    var _To = $s(_Tn + 50); //#3153
                    $puti(_To, 0, "AI \("); //#3154
                    $puti(_To, 4, _Tm); //#3155
                    $puti(_To, _Tn + 4, "\) from query params should be in the path info"); //#3156
                    $j--; //#3157
                    var _Ts = $counttomark() + 2; //#3158
                    $k[$j++] = "bwipp.GS1dlAttributeMustBeQualifier#3157"; //#3158
                    $k[$j++] = _To; //#3158
                    $r(_Ts + 1, 2); //#3158
                    $cleartomark(); //#3158
                    bwipp_raiseerror(); //#3158
                } //#3158
            } //#3158
            $j--; //#3161
        } //#3161
        var _Tu = $k[--$j]; //#3164
        $_.ais = $geti($_.ais, 0, _Tu); //#3164
        $_.vals = $geti($_.vals, 0, _Tu); //#3165
        $j--; //#3166
        for (var _U0 = 0, _Tz = $_.ais.length - 1; _U0 <= _Tz; _U0 += 1) { //#3180
            $k[$j++] = _U0; //#3178
            if ($eq($get($_.ais, _U0), "01")) { //#3178
                var _U3 = $k[$j - 1]; //#3171
                var _U5 = $get($_.vals, _U3); //#3171
                var _U6 = _U5.length; //#3172
                $k[$j++] = _U5; //#3177
                if ((_U6 == 8) || ((_U6 == 12) || (_U6 == 13))) { //#3176
                    var _U8 = $strcpy($s(14), "00000000000000"); //#3173
                    $k[$j++] = _U8; //#3173
                    $k[$j++] = _U8; //#3173
                    var _U9 = $k[$j - 3]; //#3173
                    var _UA = $k[$j - 1]; //#3173
                    $puti(_UA, 14 - _U9.length, _U9); //#3173
                    var _UC = $k[$j - 2]; //#3174
                    $j -= 3; //#3173
                    var _UD = $k[$j - 1]; //#3174
                    $put($_.vals, _UD, _UC); //#3174
                } else { //#3176
                    $j--; //#3176
                } //#3176
            } //#3176
            $j--; //#3179
        } //#3179
    } //#3179
    $k[$j++] = Infinity; //#3185
    var _UE = $_.ais; //#3186
    for (var _UF = 0, _UG = _UE.length; _UF < _UG; _UF++) { //#3193
        var _UH = $get(_UE, _UF); //#3193
        $k[$j++] = true; //#3192
        $k[$j++] = _UH; //#3192
        if (_UH.length >= 2) { //#3191
            var _UI = $k[--$j]; //#3189
            if ($has($_.aifixed, $geti(_UI, 0, 2))) { //#3189
                $k[$j - 1] = false; //#3189
            } //#3189
        } else { //#3191
            $j--; //#3191
        } //#3191
    } //#3191
    $_.fncs = $a(); //#3191
    $_.lintnumeric = function() {
        var _UM = $k[--$j]; //#3198
        $k[$j++] = true; //#3198
        $forall(_UM, function() { //#3198
            var _UN = $k[--$j]; //#3198
            if ((_UN < 48) || (_UN > 57)) { //#3198
                $k[$j - 1] = false; //#3198
                return true; //#3198
            } //#3198
        }); //#3198
        var _UO = $k[--$j]; //#3199
        if (!_UO) { //#3199
            $k[$j - 1] = "bwipp.GS1notNumeric#3199"; //#3199
            $k[$j++] = "Not numeric"; //#3199
            $k[$j++] = false; //#3199
            return true; //#3199
        } //#3199
    }; //#3199
    $_.lintcset82 = function() {
        var _UP = $k[--$j]; //#3203
        $k[$j++] = true; //#3203
        $forall(_UP, function() { //#3203
            var _UR = $k[--$j]; //#3203
            if (!$has($_.cset82, _UR)) { //#3203
                $k[$j - 1] = false; //#3203
                return true; //#3203
            } //#3203
        }); //#3203
        var _UT = $k[--$j]; //#3204
        if (!_UT) { //#3204
            $k[$j - 1] = "bwipp.GS1badCSET82character#3204"; //#3204
            $k[$j++] = "Invalid CSET 82 character"; //#3204
            $k[$j++] = false; //#3204
            return true; //#3204
        } //#3204
    }; //#3204
    $_.lintcset39 = function() {
        var _UU = $k[--$j]; //#3208
        $k[$j++] = true; //#3208
        $forall(_UU, function() { //#3208
            var _UW = $k[--$j]; //#3208
            if (!$has($_.cset39, _UW)) { //#3208
                $k[$j - 1] = false; //#3208
                return true; //#3208
            } //#3208
        }); //#3208
        var _UY = $k[--$j]; //#3209
        if (!_UY) { //#3209
            $k[$j - 1] = "bwipp.GS1badCSET39character#3209"; //#3209
            $k[$j++] = "Invalid CSET 39 character"; //#3209
            $k[$j++] = false; //#3209
            return true; //#3209
        } //#3209
    }; //#3209
    $_.lintcset64 = function() {
        var _UZ = $k[$j - 1]; //#3214
        $search(_UZ, "="); //#3214
        var _Ua = $k[--$j]; //#3220
        if (_Ua) { //#3220
            var _Ub = $k[--$j]; //#3215
            $k[$j - 1] = _Ub.length % 3; //#3215
            $k[$j++] = _Ub; //#3215
            var _Ue = $k[$j - 2]; //#3216
            var _Uf = $k[$j - 3]; //#3216
            $k[$j - 3] = $k[$j - 1]; //#3215
            $j -= 2; //#3215
            $k[$j++] = _Uf; //#3216
            $k[$j++] = _Ue; //#3216
            $k[$j++] = false; //#3216
            if ((_Ue == 1) && $eq(_Uf, "=")) { //#3216
                $k[$j - 1] = true; //#3216
            } //#3216
            var _Uh = $k[$j - 2]; //#3217
            var _Ui = $k[$j - 3]; //#3217
            if ((_Uh == 2) && (_Ui.length == 0)) { //#3217
                $k[$j - 1] = true; //#3217
            } //#3217
            var _Uj = $k[--$j]; //#3218
            if (!_Uj) { //#3218
                $j -= 5; //#3218
                $k[$j++] = "bwipp.GS1badCSET64padding#3218"; //#3218
                $k[$j++] = "Invalid CSET 64 padding"; //#3218
                $k[$j++] = false; //#3218
                return true; //#3218
            } //#3218
            $j -= 2; //#3219
            var _Uk = $k[--$j]; //#3219
            var _Ul = $k[--$j]; //#3219
            $k[$j++] = _Uk; //#3219
            $k[$j++] = _Ul; //#3219
        } //#3219
        $j--; //#3221
        var _Um = $k[--$j]; //#3223
        $k[$j++] = true; //#3223
        $forall(_Um, function() { //#3223
            var _Uo = $k[--$j]; //#3223
            if (!$has($_.cset64, _Uo)) { //#3223
                $k[$j - 1] = false; //#3223
                return true; //#3223
            } //#3223
        }); //#3223
        var _Uq = $k[--$j]; //#3224
        if (!_Uq) { //#3224
            $k[$j - 1] = "bwipp.GS1badCSET64character#3224"; //#3224
            $k[$j++] = "Invalid CSET 64 character"; //#3224
            $k[$j++] = false; //#3224
            return true; //#3224
        } //#3224
    }; //#3224
    $_.lintgcppos1 = function() {
        var _Ur = $k[$j - 1]; //#3228
        if (_Ur.length < 2) { //#3228
            $j -= 2; //#3228
            $k[$j++] = "bwipp.GS1gcpTooShort#3228"; //#3228
            $k[$j++] = "Value is too short to contain a GS1 Company Prefix"; //#3228
            $k[$j++] = false; //#3228
            return true; //#3228
        } //#3228
        var _Us = $k[--$j]; //#3229
        var _Ut = $get(_Us, 0); //#3229
        var _Uu = $get(_Us, 1); //#3230
        if (((_Ut < 48) || (_Ut > 57)) || ((_Uu < 48) || (_Uu > 57))) { //#3232
            $k[$j - 1] = "bwipp.GS1badGCP#3231"; //#3231
            $k[$j++] = "Non-numeric GS1 Company Prefix"; //#3231
            $k[$j++] = false; //#3231
            return true; //#3231
        } //#3231
    }; //#3231
    $_.lintgcppos2 = function() {
        var _Uv = $k[$j - 1]; //#3236
        if (_Uv.length < 1) { //#3236
            $j -= 2; //#3236
            $k[$j++] = "bwipp.GS1valueTooShortForOffsetGCP#3236"; //#3236
            $k[$j++] = "Value is too short to contain an offset GS1 Company Prefix"; //#3236
            $k[$j++] = false; //#3236
            return true; //#3236
        } //#3236
        var _Uw = $k[--$j]; //#3237
        $k[$j++] = $geti(_Uw, 1, _Uw.length - 1); //#3237
        $_.lintgcppos1(); //#3237
    }; //#3237
    $_.lintimporteridx = function() {
        var _Uy = $k[--$j]; //#3242
        $search("-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz", _Uy); //#3242
        var _Uz = $k[--$j]; //#3242
        if (!_Uz) { //#3242
            $j -= 2; //#3242
            $k[$j++] = "bwipp.GS1badImporterIndex#3242"; //#3242
            $k[$j++] = "Invalid importer index"; //#3242
            $k[$j++] = false; //#3242
            return true; //#3242
        } //#3242
        $j -= 3; //#3243
    }; //#3243
    $_.lintcsum = function() {
        var _V1 = $k[--$j]; //#3247
        var _V2 = ((_V1.length % 2) == 0) ? 3 : 1; //#3248
        $k[$j++] = Infinity; //#3249
        $k[$j++] = _V2; //#3249
        $forall(_V1, function() { //#3249
            var _V3 = $k[--$j]; //#3249
            var _V4 = $k[--$j]; //#3249
            $k[$j++] = (_V3 - 48) * _V4; //#3249
            $k[$j++] = 4 - _V4; //#3249
        }); //#3249
        $j--; //#3249
        var _V5 = $counttomark() + 1; //#3250
        $k[$j++] = 0; //#3250
        for (var _V6 = 0, _V7 = _V5 - 1; _V6 < _V7; _V6++) { //#3250
            var _V8 = $k[--$j]; //#3250
            var _V9 = $k[--$j]; //#3250
            $k[$j++] = $f(_V9 + _V8) //#3250
        } //#3250
        var _VA = $k[--$j]; //#3250
        $j--; //#3250
        if ((_VA % 10) != 0) { //#3251
            $k[$j - 1] = "bwipp.GS1badChecksum#3251"; //#3251
            $k[$j++] = "Bad checksum"; //#3251
            $k[$j++] = false; //#3251
            return true; //#3251
        } //#3251
    }; //#3251
    $_.lintcsumalpha = function() {
        var _VD = $k[$j - 1]; //#3255
        if (_VD.length < 2) { //#3255
            $j -= 2; //#3255
            $k[$j++] = "bwipp.GS1alphaTooShort#3255"; //#3255
            $k[$j++] = "Alphanumeric string is too short to check"; //#3255
            $k[$j++] = false; //#3255
            return true; //#3255
        } //#3255
        var _VE = $k[$j - 1]; //#3256
        $k[$j++] = _VE.length - 2; //#3258
        var _VH = $geti(_VE, 0, _VE.length - 2); //#3258
        $k[$j++] = Infinity; //#3260
        $forall(_VH, function() { //#3260
            var _VI = $k[$j - 1]; //#3259
            var _VK = $has($_.cset82, _VI); //#3259
            if (_VK) { //#3259
                var _VM = $k[--$j]; //#3259
                $k[$j++] = $get($_.cset82, _VM); //#3259
            } else { //#3259
                $k[$j++] = -1; //#3259
                return true; //#3259
            } //#3259
        }); //#3259
        var _VO = $k[$j - 1]; //#3261
        if (_VO == -1) { //#3261
            $cleartomark(); //#3261
            $j -= 3; //#3261
            $k[$j++] = "bwipp.GS1UnknownCSET82Character#3261"; //#3261
            $k[$j++] = "Unknown CSET 82 character"; //#3261
            $k[$j++] = false; //#3261
            return true; //#3261
        } //#3261
        $astore($a($counttomark())); //#3262
        var _VR = $k[--$j]; //#3262
        $k[$j - 1] = _VR; //#3262
        var _VT = $k[$j - 2]; //#3264
        var _VU = $k[$j - 3]; //#3264
        $k[$j - 3] = $k[$j - 1]; //#3263
        $j -= 2; //#3263
        var _VX = $geti(_VU, _VT, 2); //#3264
        $k[$j++] = Infinity; //#3266
        $forall(_VX, function() { //#3266
            var _VY = $k[$j - 1]; //#3265
            var _Va = $has($_.cset32, _VY); //#3265
            if (_Va) { //#3265
                var _Vc = $k[--$j]; //#3265
                $k[$j++] = $get($_.cset32, _Vc); //#3265
            } else { //#3265
                $k[$j++] = -1; //#3265
                return true; //#3265
            } //#3265
        }); //#3265
        var _Ve = $k[$j - 1]; //#3267
        if (_Ve == -1) { //#3267
            $cleartomark(); //#3267
            $j -= 2; //#3267
            $k[$j++] = "bwipp.GS1UnknownCSET32Character#3267"; //#3267
            $k[$j++] = "Unknown CSET 32 character"; //#3267
            $k[$j++] = false; //#3267
            return true; //#3267
        } //#3267
        $astore($a($counttomark())); //#3268
        var _Vh = $k[--$j]; //#3268
        $j--; //#3268
        var _Vm = $k[--$j]; //#3269
        var _Vn = _Vm.length; //#3272
        $k[$j++] = $f($get(_Vh, 0) * 32 + $get(_Vh, 1)) //#3272
        $k[$j++] = _Vm; //#3272
        $k[$j++] = $_.gs1process_primes; //#3272
        $k[$j++] = _Vn; //#3272
        if (_Vn > $_.gs1process_primes.length) { //#3272
            $j -= 5; //#3272
            $k[$j++] = "bwipp.GS1alphaTooLong#3272"; //#3272
            $k[$j++] = "Alphanumeric string is too long to check"; //#3272
            $k[$j++] = false; //#3272
            return true; //#3272
        } //#3272
        var _Vo = $k[--$j]; //#3273
        var _Vp = $k[--$j]; //#3273
        var _Vq = $geti(_Vp, 0, _Vo); //#3273
        for (var _Vr = 0, _Vs = _Vq.length; _Vr < _Vs; _Vr++) { //#3273
            var _Vu = $k[--$j]; //#3273
            $k[$j++] = $get(_Vq, _Vr); //#3273
            $k[$j++] = _Vu; //#3273
        } //#3273
        var _Vv = $k[--$j]; //#3274
        $k[$j++] = 0; //#3274
        $forall(_Vv, function() { //#3274
            var _Vw = $k[$j - 3]; //#3274
            var _Vx = $k[$j - 1]; //#3274
            var _Vy = $k[$j - 2]; //#3274
            $j -= 3; //#3274
            $k[$j++] = $f(_Vy + _Vw * _Vx) //#3274
        }); //#3274
        var _Vz = $k[--$j]; //#3274
        var _W0 = $k[--$j]; //#3275
        if (_W0 != (_Vz % 1021)) { //#3275
            $k[$j - 1] = "bwipp.GS1badAlphaCheckCharacters#3275"; //#3275
            $k[$j++] = "Bad alphanumeric check characters"; //#3275
            $k[$j++] = false; //#3275
            return true; //#3275
        } //#3275
    }; //#3275
    $_.lintiso3166 = function() {
        var _W2 = $k[--$j]; //#3279
        if (!$has($_.iso3166, _W2)) { //#3279
            $k[$j - 1] = "bwipp.GS1UnknownCountry#3279"; //#3279
            $k[$j++] = "Unknown country code"; //#3279
            $k[$j++] = false; //#3279
            return true; //#3279
        } //#3279
    }; //#3279
    $_.lintiso3166999 = function() {
        var _W4 = $k[$j - 1]; //#3283
        if ($ne(_W4, '999')) { //#3286
            var _W6 = $k[--$j]; //#3284
            if (!$has($_.iso3166, _W6)) { //#3284
                $k[$j - 1] = "bwipp.GS1UnknownCountryOr999#3284"; //#3284
                $k[$j++] = "Unknown country code or not 999"; //#3284
                $k[$j++] = false; //#3284
                return true; //#3284
            } //#3284
        } else { //#3286
            $j--; //#3286
        } //#3286
    }; //#3286
    $_.lintiso3166alpha2 = function() {
        var _W9 = $k[--$j]; //#3291
        if (!$has($_.iso3166alpha2, _W9)) { //#3291
            $k[$j - 1] = "bwipp.GS1UnknownCountryAlpha#3291"; //#3291
            $k[$j++] = "Unknown country alpha code"; //#3291
            $k[$j++] = false; //#3291
            return true; //#3291
        } //#3291
    }; //#3291
    $_.lintiso4217 = function() {
        var _WC = $k[--$j]; //#3295
        if (!$has($_.iso4217, _WC)) { //#3295
            $k[$j - 1] = "bwipp.GS1UnknownCurrency#3295"; //#3295
            $k[$j++] = "Unknown currency code"; //#3295
            $k[$j++] = false; //#3295
            return true; //#3295
        } //#3295
    }; //#3295
    $_.lintiso5218 = function() {
        var _WE = $k[--$j]; //#3299
        if ($ne(_WE, "0") && ($ne(_WE, "1") && ($ne(_WE, "2") && $ne(_WE, "9")))) { //#3301
            $k[$j - 1] = "bwipp.GS1biologicalSexCode#3300"; //#3300
            $k[$j++] = "Invalid biological sex code"; //#3300
            $k[$j++] = false; //#3300
            return true; //#3300
        } //#3300
    }; //#3300
    $_.lintiban = function() {
        var _WF = $k[$j - 1]; //#3305
        if (_WF.length <= 4) { //#3305
            $j -= 2; //#3305
            $k[$j++] = "bwipp.GS1tooShort#3305"; //#3305
            $k[$j++] = "IBAN too short"; //#3305
            $k[$j++] = false; //#3305
            return true; //#3305
        } //#3305
        var _WG = $k[$j - 1]; //#3306
        $k[$j++] = true; //#3311
        $forall(_WG, function() { //#3311
            var _WH = $s(1); //#3307
            $k[$j++] = _WH; //#3307
            $k[$j++] = _WH; //#3307
            $k[$j++] = 0; //#3307
            $r(4, -1); //#3307
            var _WI = $k[--$j]; //#3307
            var _WJ = $k[--$j]; //#3307
            var _WK = $k[--$j]; //#3307
            $put(_WK, _WJ, _WI); //#3307
            var _WL = $k[--$j]; //#3309
            $search("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", _WL); //#3309
            var _WM = $k[--$j]; //#3309
            if (!_WM) { //#3309
                $j -= 2; //#3309
                $k[$j++] = false; //#3309
                return true; //#3309
            } //#3309
            $j -= 3; //#3310
        }); //#3310
        var _WN = $k[--$j]; //#3312
        if (!_WN) { //#3312
            $j -= 2; //#3312
            $k[$j++] = "bwipp.GS1badIBANcharacter#3312"; //#3312
            $k[$j++] = "Invalid IBAN character"; //#3312
            $k[$j++] = false; //#3312
            return true; //#3312
        } //#3312
        var _WO = $k[$j - 1]; //#3313
        $k[$j++] = Infinity; //#3313
        $k[$j++] = Infinity; //#3313
        $forall(_WO); //#3313
        $r($counttomark(), -4); //#3313
        $astore($a($counttomark())); //#3313
        var _WW = $k[--$j]; //#3313
        $j--; //#3313
        $forall(_WW, function() { //#3315
            var _WZ = $k[--$j]; //#3314
            var _Wa = _WZ - 48; //#3314
            $k[$j++] = _Wa; //#3314
            if (_Wa > 9) { //#3314
                var _Wb = $k[--$j]; //#3314
                var _Wc = _Wb - 7; //#3314
                $k[$j++] = ~~(_Wc / 10); //#3314
                $k[$j++] = _Wc % 10; //#3314
            } //#3314
        }); //#3314
        $astore($a($counttomark())); //#3315
        var _Wf = $k[--$j]; //#3315
        $j--; //#3315
        var _Wk = 0; //#3316
        $forall(_Wf, function() { //#3316
            var _Wi = $k[--$j]; //#3316
            _Wk = $f(_Wi + _Wk * 10) % 97 //#3316
        }); //#3316
        if (_Wk != 1) { //#3317
            $j -= 2; //#3317
            $k[$j++] = "bwipp.GS1badIBANchecksum#3317"; //#3317
            $k[$j++] = "IBAN checksum incorrect"; //#3317
            $k[$j++] = false; //#3317
            return true; //#3317
        } //#3317
        var _Wl = $k[--$j]; //#3318
        $k[$j++] = $geti(_Wl, 0, 2); //#3318
        $_.lintiso3166alpha2(); //#3318
    }; //#3318
    $_.lintzero = function() {
        var _Wn = $k[--$j]; //#3322
        if ($ne(_Wn, "0")) { //#3322
            $k[$j - 1] = "bwipp.GS1zeroRequired#3322"; //#3322
            $k[$j++] = "Zero is required"; //#3322
            $k[$j++] = false; //#3322
            return true; //#3322
        } //#3322
    }; //#3322
    $_.lintnonzero = function() {
        var _Wo = $k[--$j]; //#3326
        $k[$j++] = false; //#3326
        $forall(_Wo, function() { //#3326
            var _Wp = $k[--$j]; //#3326
            if (_Wp != 48) { //#3326
                $k[$j - 1] = true; //#3326
            } //#3326
        }); //#3326
        var _Wq = $k[--$j]; //#3327
        if (!_Wq) { //#3327
            $k[$j - 1] = "bwipp.GS1zeroNotPermitted#3327"; //#3327
            $k[$j++] = "Zero not permitted"; //#3327
            $k[$j++] = false; //#3327
            return true; //#3327
        } //#3327
    }; //#3327
    $_.lintnozeroprefix = function() {
        var _Wr = $k[--$j]; //#3331
        if ((_Wr.length > 1) && ($get(_Wr, 0) == 48)) { //#3333
            $k[$j - 1] = "bwipp.GS1badZeroPrefix#3332"; //#3332
            $k[$j++] = "Zero prefix is not permitted"; //#3332
            $k[$j++] = false; //#3332
            return true; //#3332
        } //#3332
    }; //#3332
    $_.linthasnondigit = function() {
        var _Wt = $k[--$j]; //#3337
        $k[$j++] = false; //#3337
        $forall(_Wt, function() { //#3337
            var _Wu = $k[--$j]; //#3337
            if ((_Wu < 48) || (_Wu > 57)) { //#3337
                $k[$j - 1] = true; //#3337
                return true; //#3337
            } //#3337
        }); //#3337
        var _Wv = $k[--$j]; //#3338
        if (!_Wv) { //#3338
            $k[$j - 1] = "bwipp.GS1requiresNonDigit#3338"; //#3338
            $k[$j++] = "A non-digit character is required"; //#3338
            $k[$j++] = false; //#3338
            return true; //#3338
        } //#3338
    }; //#3338
    $_.linthyphen = function() {
        var _Ww = $k[--$j]; //#3342
        if ($ne(_Ww, "-")) { //#3342
            $k[$j - 1] = "bwipp.GS1hyphenRequired#3342"; //#3342
            $k[$j++] = "A hyphen is required"; //#3342
            $k[$j++] = false; //#3342
            return true; //#3342
        } //#3342
    }; //#3342
    $_.lintyyyymmd0 = function() {
        var _Wx = $k[$j - 1]; //#3346
        var _Wz = $cvi($geti(_Wx, 4, 2)); //#3346
        $k[$j++] = _Wz; //#3346
        if ((_Wz < 1) || (_Wz > 12)) { //#3346
            $j -= 3; //#3346
            $k[$j++] = "bwipp.GS1badMonth#3346"; //#3346
            $k[$j++] = "Invalid month"; //#3346
            $k[$j++] = false; //#3346
            return true; //#3346
        } //#3346
        var _X0 = $k[--$j]; //#3347
        if (_X0 == 2) { //#3350
            var _X1 = $k[$j - 1]; //#3348
            var _X3 = $cvi($geti(_X1, 0, 4)); //#3348
            $k[$j++] = (((_X3 % 400) == 0) || (((_X3 % 4) == 0) && ((_X3 % 100) != 0))) ? 29 : 28; //#3348
        } else { //#3350
            var _X5 = $k[$j - 1]; //#3350
            $k[$j++] = $get($_.gs1process_daysinmonth, $cvi($geti(_X5, 4, 2)) - 1); //#3350
        } //#3350
        var _X8 = $k[--$j]; //#3352
        var _X9 = $k[--$j]; //#3352
        if (_X8 < $cvi($geti(_X9, 6, 2))) { //#3352
            $k[$j - 1] = "bwipp.GS1badDay#3352"; //#3352
            $k[$j++] = "Invalid day of month"; //#3352
            $k[$j++] = false; //#3352
            return true; //#3352
        } //#3352
    }; //#3352
    $_.lintyyyymmdd = function() {
        var _XB = $k[$j - 1]; //#3356
        if (_XB.length != 8) { //#3356
            $j -= 2; //#3356
            $k[$j++] = "bwipp.GS1badDateLength#3356"; //#3356
            $k[$j++] = "Invalid length for yyyymmdd date"; //#3356
            $k[$j++] = false; //#3356
            return true; //#3356
        } //#3356
        var _XC = $k[$j - 1]; //#3357
        if ($cvi($geti(_XC, 6, 2)) < 1) { //#3357
            $j -= 2; //#3357
            $k[$j++] = "bwipp.GS1badDay#3357"; //#3357
            $k[$j++] = "Invalid day of month"; //#3357
            $k[$j++] = false; //#3357
            return true; //#3357
        } //#3357
        $_.lintyyyymmd0(); //#3358
    }; //#3358
    $_.lintyymmd0 = function() {
        var _XE = $k[$j - 1]; //#3362
        var _XG = $cvi($geti(_XE, 0, 2)); //#3362
        var _XH = _XG - 21; //#3363
        $k[$j++] = _XG; //#3363
        $k[$j++] = _XH; //#3363
        if (_XH >= 51) { //#3363
            $k[$j - 1] = "19"; //#3363
        } else { //#3363
            var _XI = $k[--$j]; //#3363
            if (_XI <= -50) { //#3363
                $k[$j++] = "21"; //#3363
            } else { //#3363
                $k[$j++] = "20"; //#3363
            } //#3363
        } //#3363
        var _XJ = $k[--$j]; //#3363
        $k[$j - 1] = _XJ; //#3363
        var _XL = $s(8); //#3364
        $k[$j++] = _XL; //#3364
        $k[$j++] = _XL; //#3364
        $k[$j++] = 0; //#3364
        $r(4, -1); //#3364
        var _XM = $k[--$j]; //#3364
        var _XN = $k[--$j]; //#3364
        var _XO = $k[--$j]; //#3364
        $puti(_XO, _XN, _XM); //#3364
        var _XP = $k[$j - 1]; //#3364
        $k[$j++] = _XP; //#3364
        $k[$j++] = 2; //#3364
        $r(4, -1); //#3364
        var _XQ = $k[--$j]; //#3364
        var _XR = $k[--$j]; //#3364
        var _XS = $k[--$j]; //#3364
        $puti(_XS, _XR, _XQ); //#3364
        $_.lintyyyymmd0(); //#3365
    }; //#3365
    $_.lintyymmdd = function() {
        var _XT = $k[$j - 1]; //#3369
        if (_XT.length != 6) { //#3369
            $j -= 2; //#3369
            $k[$j++] = "bwipp.GS1badDateLength#3369"; //#3369
            $k[$j++] = "Invalid length for yymmdd date"; //#3369
            $k[$j++] = false; //#3369
            return true; //#3369
        } //#3369
        var _XU = $k[$j - 1]; //#3370
        if ($cvi($geti(_XU, 4, 2)) < 1) { //#3370
            $j -= 2; //#3370
            $k[$j++] = "bwipp.GS1badDay#3370"; //#3370
            $k[$j++] = "Invalid day of month"; //#3370
            $k[$j++] = false; //#3370
            return true; //#3370
        } //#3370
        $_.lintyymmd0(); //#3371
    }; //#3371
    $_.linthh = function() {
        var _XW = $k[--$j]; //#3375
        if ($cvi($geti(_XW, 0, 2)) > 23) { //#3375
            $k[$j - 1] = "bwipp.GS1badHour#3375"; //#3375
            $k[$j++] = "Invalid hour of day"; //#3375
            $k[$j++] = false; //#3375
            return true; //#3375
        } //#3375
    }; //#3375
    $_.lintmi = function() {
        var _XY = $k[--$j]; //#3379
        if ($cvi($geti(_XY, 0, 2)) > 59) { //#3379
            $k[$j - 1] = "bwipp.GS1badMinute#3379"; //#3379
            $k[$j++] = "Invalid minute in the hour"; //#3379
            $k[$j++] = false; //#3379
            return true; //#3379
        } //#3379
    }; //#3379
    $_.lintss = function() {
        var _Xa = $k[--$j]; //#3383
        if ($cvi($geti(_Xa, 0, 2)) > 59) { //#3383
            $k[$j - 1] = "bwipp.GS1badSecond#3383"; //#3383
            $k[$j++] = "Invalid second in the minute"; //#3383
            $k[$j++] = false; //#3383
            return true; //#3383
        } //#3383
    }; //#3383
    $_.linthhmi = function() {
        var _Xc = $k[$j - 1]; //#3387
        if ($cvi($geti(_Xc, 0, 2)) > 23) { //#3387
            $j -= 2; //#3387
            $k[$j++] = "bwipp.GS1badHour#3387"; //#3387
            $k[$j++] = "Invalid hour of day"; //#3387
            $k[$j++] = false; //#3387
            return true; //#3387
        } //#3387
        var _Xe = $k[--$j]; //#3388
        if ($cvi($geti(_Xe, 2, 2)) > 59) { //#3388
            $k[$j - 1] = "bwipp.GS1badMinute#3388"; //#3388
            $k[$j++] = "Invalid minute in the hour"; //#3388
            $k[$j++] = false; //#3388
            return true; //#3388
        } //#3388
    }; //#3388
    $_.lintmmoptss = function() {
        var _Xg = $k[$j - 1]; //#3392
        var _Xh = _Xg.length; //#3392
        if ((_Xh != 2) && (_Xh != 4)) { //#3394
            $k[$j - 1] = "bwipp.GS1badTimeLength#3393"; //#3393
            $k[$j++] = "Invalid length for optional minutes and seconds"; //#3393
            $k[$j++] = false; //#3393
            return true; //#3393
        } //#3393
        var _Xi = $k[$j - 1]; //#3395
        if ($cvi($geti(_Xi, 0, 2)) > 59) { //#3395
            $j -= 2; //#3395
            $k[$j++] = "bwipp.GS1badMinute#3395"; //#3395
            $k[$j++] = "Invalid minute in the hour"; //#3395
            $k[$j++] = false; //#3395
            return true; //#3395
        } //#3395
        var _Xk = $k[$j - 1]; //#3396
        if (_Xk.length >= 4) { //#3398
            var _Xl = $k[$j - 1]; //#3397
            if ($cvi($geti(_Xl, 2, 2)) > 59) { //#3397
                $j -= 2; //#3397
                $k[$j++] = "bwipp.GS1badSecond#3397"; //#3397
                $k[$j++] = "Invalid second in the minute"; //#3397
                $k[$j++] = false; //#3397
                return true; //#3397
            } //#3397
        } //#3397
        $j--; //#3399
    }; //#3399
    $_.lintyesno = function() {
        var _Xn = $k[--$j]; //#3403
        if ($ne(_Xn, "0") && $ne(_Xn, "1")) { //#3405
            $k[$j - 1] = "bwipp.GS1badBoolean#3404"; //#3404
            $k[$j++] = "Neither 0 nor 1 for yes or no"; //#3404
            $k[$j++] = false; //#3404
            return true; //#3404
        } //#3404
    }; //#3404
    $_.lintwinding = function() {
        var _Xo = $k[--$j]; //#3409
        if ($ne(_Xo, "0") && ($ne(_Xo, "1") && $ne(_Xo, "9"))) { //#3411
            $k[$j - 1] = "bwipp.GS1badWinding#3410"; //#3410
            $k[$j++] = "Invalid winding direction"; //#3410
            $k[$j++] = false; //#3410
            return true; //#3410
        } //#3410
    }; //#3410
    $_.lintpieceoftotal = function() {
        var _Xp = $k[$j - 1]; //#3415
        if ((_Xp.length % 2) != 0) { //#3415
            $j -= 2; //#3415
            $k[$j++] = "bwipp.GS1badPieceTotalLength#3415"; //#3415
            $k[$j++] = "Invalid piece/total length"; //#3415
            $k[$j++] = false; //#3415
            return true; //#3415
        } //#3415
        var _Xq = $k[$j - 1]; //#3416
        var _Xs = $cvi($geti(_Xq, 0, ~~(_Xq.length / 2))); //#3417
        $k[$j++] = _Xs; //#3417
        if (_Xs == 0) { //#3417
            $j -= 3; //#3417
            $k[$j++] = "bwipp.GS1badPieceNumber#3417"; //#3417
            $k[$j++] = "Invalid piece number"; //#3417
            $k[$j++] = false; //#3417
            return true; //#3417
        } //#3417
        var _Xt = $k[--$j]; //#3418
        var _Xu = $k[--$j]; //#3418
        var _Xv = ~~(_Xu.length / 2); //#3418
        var _Xx = $cvi($geti(_Xu, _Xv, _Xv)); //#3419
        $k[$j++] = _Xt; //#3419
        $k[$j++] = _Xx; //#3419
        if (_Xx == 0) { //#3419
            $j -= 3; //#3419
            $k[$j++] = "bwipp.GS1badPieceTotal#3419"; //#3419
            $k[$j++] = "Invalid total number"; //#3419
            $k[$j++] = false; //#3419
            return true; //#3419
        } //#3419
        var _Xy = $k[--$j]; //#3420
        var _Xz = $k[--$j]; //#3420
        if ($gt(_Xz, _Xy)) { //#3420
            $k[$j - 1] = "bwipp.GS1pieceExceedsTotal#3420"; //#3420
            $k[$j++] = "Piece number exceeds total"; //#3420
            $k[$j++] = false; //#3420
            return true; //#3420
        } //#3420
    }; //#3420
    $_.lintposinseqslash = function() {
        var _Y0 = $k[--$j]; //#3424
        $search(_Y0, "/"); //#3424
        var _Y1 = $k[--$j]; //#3424
        if (!_Y1) { //#3426
            $j -= 2; //#3425
            $k[$j++] = "bwipp.invalidPosInSeqFormat#3425"; //#3425
            $k[$j++] = "Invalid <pos>/<end> format"; //#3425
            $k[$j++] = false; //#3425
            return true; //#3425
        } //#3425
        var _Y2 = $k[--$j]; //#3427
        $k[$j - 1] = _Y2; //#3427
        var _Y4 = $k[$j - 1]; //#3428
        if (_Y4.length == 0) { //#3430
            $j -= 3; //#3429
            $k[$j++] = "bwipp.invalidPosInSeqFormat#3429"; //#3429
            $k[$j++] = "Invalid <pos>/<end> format"; //#3429
            $k[$j++] = false; //#3429
            return true; //#3429
        } //#3429
        var _Y6 = $k[$j - 2]; //#3431
        if (_Y6.length == 0) { //#3433
            $j -= 3; //#3432
            $k[$j++] = "bwipp.invalidPosInSeqFormat#3432"; //#3432
            $k[$j++] = "Invalid <pos>/<end> format"; //#3432
            $k[$j++] = false; //#3432
            return true; //#3432
        } //#3432
        var _Y7 = $k[$j - 1]; //#3434
        $k[$j++] = true; //#3436
        $forall(_Y7, function() { //#3436
            var _Y8 = $k[--$j]; //#3435
            if ((_Y8 < 48) || (_Y8 > 57)) { //#3435
                $k[$j - 1] = false; //#3435
                return true; //#3435
            } //#3435
        }); //#3435
        var _Y9 = $k[--$j]; //#3437
        if (!_Y9) { //#3437
            $j -= 3; //#3437
            $k[$j++] = "bwipp.positionNotNumeric#3437"; //#3437
            $k[$j++] = "Position is not numeric"; //#3437
            $k[$j++] = false; //#3437
            return true; //#3437
        } //#3437
        var _YB = $k[$j - 2]; //#3438
        $k[$j++] = true; //#3440
        $forall(_YB, function() { //#3440
            var _YC = $k[--$j]; //#3439
            if ((_YC < 48) || (_YC > 57)) { //#3439
                $k[$j - 1] = false; //#3439
                return true; //#3439
            } //#3439
        }); //#3439
        var _YD = $k[--$j]; //#3441
        if (!_YD) { //#3441
            $j -= 3; //#3441
            $k[$j++] = "bwipp.endNotNumeric#3441"; //#3441
            $k[$j++] = "End is not numeric"; //#3441
            $k[$j++] = false; //#3441
            return true; //#3441
        } //#3441
        var _YE = $k[$j - 1]; //#3442
        if ($get(_YE, 0) == 48) { //#3442
            $j -= 3; //#3442
            $k[$j++] = "bwipp.positionZeroPrefix#3442"; //#3442
            $k[$j++] = "Position cannot have zero prefix"; //#3442
            $k[$j++] = false; //#3442
            return true; //#3442
        } //#3442
        var _YH = $k[$j - 2]; //#3443
        if ($get(_YH, 0) == 48) { //#3443
            $j -= 3; //#3443
            $k[$j++] = "bwipp.endZeroPrefix#3443"; //#3443
            $k[$j++] = "End cannot have zero prefix"; //#3443
            $k[$j++] = false; //#3443
            return true; //#3443
        } //#3443
        var _YJ = $k[--$j]; //#3444
        var _YK = $k[--$j]; //#3444
        if ($cvi(_YK) < $cvi(_YJ)) { //#3445
            $k[$j - 1] = "bwipp.positionExceedsEnd#3445"; //#3445
            $k[$j++] = "Position exceeds end"; //#3445
            $k[$j++] = false; //#3445
            return true; //#3445
        } //#3445
    }; //#3445
    $_.lintpcenc = function() {
        for (;;) { //#3459
            var _YL = $k[--$j]; //#3450
            $search(_YL, "%"); //#3450
            var _YM = $k[--$j]; //#3450
            if (!_YM) { //#3450
                $j--; //#3450
                break; //#3450
            } //#3450
            $j -= 2; //#3451
            var _YN = $k[$j - 1]; //#3451
            if (_YN.length < 2) { //#3451
                $j -= 2; //#3451
                $k[$j++] = "bwipp.GS1badPercentEscape#3451"; //#3451
                $k[$j++] = "Invalid % escape"; //#3451
                $k[$j++] = false; //#3451
                break; //#3451
            } //#3451
            var _YO = $k[$j - 1]; //#3452
            var _YP = $geti(_YO, 0, 2); //#3452
            $k[$j++] = true; //#3457
            for (var _YQ = 0, _YR = _YP.length; _YQ < _YR; _YQ++) { //#3457
                var _YT = $s(1); //#3453
                $put(_YT, 0, $get(_YP, _YQ)); //#3453
                $search("0123456789ABCDEFabcdef", _YT); //#3455
                var _YU = $k[--$j]; //#3455
                if (!_YU) { //#3455
                    $j -= 2; //#3455
                    $k[$j++] = false; //#3455
                    break; //#3455
                } //#3455
                $j -= 3; //#3456
            } //#3456
            var _YV = $k[--$j]; //#3458
            if (!_YV) { //#3458
                $j -= 2; //#3458
                $k[$j++] = "bwipp.GS1badPercentChars#3458"; //#3458
                $k[$j++] = "Invalid characters for percent encoding"; //#3458
                $k[$j++] = false; //#3458
                break; //#3458
            } //#3458
        } //#3458
    }; //#3458
    $_.lintcouponcode = function() {
        var _YW = $k[$j - 1]; //#3463
        $k[$j++] = true; //#3465
        $forall(_YW, function() { //#3465
            var _YX = $k[--$j]; //#3464
            if ((_YX < 48) || (_YX > 57)) { //#3464
                $k[$j - 1] = false; //#3464
                return true; //#3464
            } //#3464
        }); //#3464
        var _YY = $k[--$j]; //#3466
        if (!_YY) { //#3466
            $j -= 2; //#3466
            $k[$j++] = "bwipp.GS1couponNotNumeric#3466"; //#3466
            $k[$j++] = "Coupon not numeric"; //#3466
            $k[$j++] = false; //#3466
            return true; //#3466
        } //#3466
        var _YZ = $k[$j - 1]; //#3469
        if (_YZ.length < 1) { //#3471
            $j -= 2; //#3470
            $k[$j++] = "bwipp.GS1couponTooShortGCPVLI#3470"; //#3470
            $k[$j++] = "Coupon too short: Missing GCP VLI"; //#3470
            $k[$j++] = false; //#3470
            return true; //#3470
        } //#3470
        var _Ya = $k[$j - 1]; //#3472
        var _Yc = $cvi($geti(_Ya, 0, 1)); //#3472
        $k[$j++] = _Yc; //#3474
        if (_Yc > 6) { //#3474
            $j -= 3; //#3473
            $k[$j++] = "bwipp.GS1couponBadGCPVLI#3473"; //#3473
            $k[$j++] = "Coupon GCP length indicator must be 0-6"; //#3473
            $k[$j++] = false; //#3473
            return true; //#3473
        } //#3473
        var _Yd = $k[--$j]; //#3475
        var _Ye = $k[$j - 1]; //#3476
        $k[$j++] = (_Yd + 6) + 1; //#3478
        if (((_Yd + 6) + 1) > _Ye.length) { //#3478
            $j -= 3; //#3477
            $k[$j++] = "bwipp.GS1couponTooShortGCP#3477"; //#3477
            $k[$j++] = "Coupon too short: GCP truncated"; //#3477
            $k[$j++] = false; //#3477
            return true; //#3477
        } //#3477
        var _Yf = $k[--$j]; //#3479
        var _Yg = $k[--$j]; //#3479
        var _Yh = $geti(_Yg, _Yf, $f(_Yg.length - _Yf)); //#3479
        $k[$j++] = _Yh; //#3484
        if (_Yh.length < 6) { //#3484
            $j -= 2; //#3483
            $k[$j++] = "bwipp.GS1couponTooShortOfferCode#3483"; //#3483
            $k[$j++] = "Coupon too short: Offer Code truncated"; //#3483
            $k[$j++] = false; //#3483
            return true; //#3483
        } //#3483
        var _Yi = $k[--$j]; //#3485
        var _Yj = $geti(_Yi, 6, _Yi.length - 6); //#3485
        $k[$j++] = _Yj; //#3490
        if (_Yj.length < 1) { //#3490
            $j -= 2; //#3489
            $k[$j++] = "bwipp.GS1couponTooShortSaveValueVLI#3489"; //#3489
            $k[$j++] = "Coupon too short: Missing Save Value VLI"; //#3489
            $k[$j++] = false; //#3489
            return true; //#3489
        } //#3489
        var _Yk = $k[$j - 1]; //#3491
        var _Ym = $cvi($geti(_Yk, 0, 1)); //#3491
        $k[$j++] = _Ym; //#3493
        if ((_Ym < 1) || (_Ym > 5)) { //#3493
            $j -= 3; //#3492
            $k[$j++] = "bwipp.GS1couponBadSaveValueVLI#3492"; //#3492
            $k[$j++] = "Coupon Save Value length indicator must be 1-5"; //#3492
            $k[$j++] = false; //#3492
            return true; //#3492
        } //#3492
        var _Yn = $k[--$j]; //#3494
        var _Yo = $k[$j - 1]; //#3495
        $k[$j++] = _Yn + 1; //#3497
        if ((_Yn + 1) > _Yo.length) { //#3497
            $j -= 3; //#3496
            $k[$j++] = "bwipp.GS1couponTooShortSaveValue#3496"; //#3496
            $k[$j++] = "Coupon too short: Save Value truncated"; //#3496
            $k[$j++] = false; //#3496
            return true; //#3496
        } //#3496
        var _Yp = $k[--$j]; //#3498
        var _Yq = $k[--$j]; //#3498
        var _Yr = $geti(_Yq, _Yp, $f(_Yq.length - _Yp)); //#3498
        $k[$j++] = _Yr; //#3503
        if (_Yr.length < 1) { //#3503
            $j -= 2; //#3502
            $k[$j++] = "bwipp.GS1couponTooShort1stPurchaseRequirementVLI#3502"; //#3502
            $k[$j++] = "Coupon too short: Missing 1st Purchase Requirement VLI"; //#3502
            $k[$j++] = false; //#3502
            return true; //#3502
        } //#3502
        var _Ys = $k[$j - 1]; //#3504
        var _Yu = $cvi($geti(_Ys, 0, 1)); //#3504
        $k[$j++] = _Yu; //#3506
        if ((_Yu < 1) || (_Yu > 5)) { //#3506
            $j -= 3; //#3505
            $k[$j++] = "bwipp.GS1couponBad1stPurchaseRequirementVLI#3505"; //#3505
            $k[$j++] = "Coupon 1st Purchase Requirement length indicator must be 1-5"; //#3505
            $k[$j++] = false; //#3505
            return true; //#3505
        } //#3505
        var _Yv = $k[--$j]; //#3507
        var _Yw = $k[$j - 1]; //#3508
        $k[$j++] = _Yv + 1; //#3510
        if ((_Yv + 1) > _Yw.length) { //#3510
            $j -= 3; //#3509
            $k[$j++] = "bwipp.GS1couponTooShort1stPurchaseRequirement#3509"; //#3509
            $k[$j++] = "Coupon too short: 1st Purchase Requirement truncated"; //#3509
            $k[$j++] = false; //#3509
            return true; //#3509
        } //#3509
        var _Yx = $k[--$j]; //#3511
        var _Yy = $k[--$j]; //#3511
        var _Yz = $geti(_Yy, _Yx, $f(_Yy.length - _Yx)); //#3511
        $k[$j++] = _Yz; //#3516
        if (_Yz.length < 1) { //#3516
            $j -= 2; //#3515
            $k[$j++] = "bwipp.GS1couponTooShort1stPurchaseRequirementCode#3515"; //#3515
            $k[$j++] = "Coupon too short: Missing 1st Purchase Requirement Code"; //#3515
            $k[$j++] = false; //#3515
            return true; //#3515
        } //#3515
        var _Z0 = $k[$j - 1]; //#3517
        var _Z2 = $cvi($geti(_Z0, 0, 1)); //#3517
        if ((_Z2 > 4) && (_Z2 != 9)) { //#3519
            $j -= 2; //#3518
            $k[$j++] = "bwipp.GS1couponBad1stPurchaseRequirementCode#3518"; //#3518
            $k[$j++] = "Coupon 1st Purchase Requirement Code must be 0-4 or 9"; //#3518
            $k[$j++] = false; //#3518
            return true; //#3518
        } //#3518
        var _Z3 = $k[--$j]; //#3520
        var _Z4 = $geti(_Z3, 1, _Z3.length - 1); //#3520
        $k[$j++] = _Z4; //#3525
        if (_Z4.length < 3) { //#3525
            $j -= 2; //#3524
            $k[$j++] = "bwipp.GS1couponTooShort1stPurchaseFamilyCode#3524"; //#3524
            $k[$j++] = "Coupon too short: 1st Purchase Family Code truncated"; //#3524
            $k[$j++] = false; //#3524
            return true; //#3524
        } //#3524
        var _Z5 = $k[--$j]; //#3526
        var _Z6 = $geti(_Z5, 3, _Z5.length - 3); //#3526
        $k[$j++] = _Z6; //#3582
        if (_Z6.length >= 1) { //#3582
            var _Z7 = $k[$j - 1]; //#3529
            if ($cvi($geti(_Z7, 0, 1)) == 1) { //#3582
                var _Z9 = $k[--$j]; //#3530
                var _ZA = $geti(_Z9, 1, _Z9.length - 1); //#3530
                $k[$j++] = _ZA; //#3535
                if (_ZA.length < 1) { //#3535
                    $j -= 2; //#3534
                    $k[$j++] = "bwipp.GS1couponTooShortAdditionalPurchaseRulesCode#3534"; //#3534
                    $k[$j++] = "Coupon too short: Missing Additional Purchase Rules Code"; //#3534
                    $k[$j++] = false; //#3534
                    return true; //#3534
                } //#3534
                var _ZB = $k[$j - 1]; //#3536
                if ($cvi($geti(_ZB, 0, 1)) > 3) { //#3538
                    $j -= 2; //#3537
                    $k[$j++] = "bwipp.GS1couponBadAdditionalPurchaseRulesCode#3537"; //#3537
                    $k[$j++] = "Coupon Additional Purchase Rules Code must be 0-3"; //#3537
                    $k[$j++] = false; //#3537
                    return true; //#3537
                } //#3537
                var _ZD = $k[--$j]; //#3539
                var _ZE = $geti(_ZD, 1, _ZD.length - 1); //#3539
                $k[$j++] = _ZE; //#3544
                if (_ZE.length < 1) { //#3544
                    $j -= 2; //#3543
                    $k[$j++] = "bwipp.GS1couponTooShort2ndPurchaseRequirementVLI#3543"; //#3543
                    $k[$j++] = "Coupon too short: Missing 2nd Purchase Requirement VLI"; //#3543
                    $k[$j++] = false; //#3543
                    return true; //#3543
                } //#3543
                var _ZF = $k[$j - 1]; //#3545
                var _ZH = $cvi($geti(_ZF, 0, 1)); //#3545
                $k[$j++] = _ZH; //#3547
                if ((_ZH < 1) || (_ZH > 5)) { //#3547
                    $j -= 3; //#3546
                    $k[$j++] = "bwipp.GS1couponBad2ndPurchaseRequirementVLI#3546"; //#3546
                    $k[$j++] = "Coupon 2nd Purchase Requirement length indicator must be 1-5"; //#3546
                    $k[$j++] = false; //#3546
                    return true; //#3546
                } //#3546
                var _ZI = $k[--$j]; //#3548
                var _ZJ = $k[$j - 1]; //#3549
                $k[$j++] = _ZI + 1; //#3551
                if ((_ZI + 1) > _ZJ.length) { //#3551
                    $j -= 3; //#3550
                    $k[$j++] = "bwipp.GS1couponTooShort2ndPurchaseRequirement#3550"; //#3550
                    $k[$j++] = "Coupon too short: 2nd Purchase Requirement truncated"; //#3550
                    $k[$j++] = false; //#3550
                    return true; //#3550
                } //#3550
                var _ZK = $k[--$j]; //#3552
                var _ZL = $k[--$j]; //#3552
                var _ZM = $geti(_ZL, _ZK, $f(_ZL.length - _ZK)); //#3552
                $k[$j++] = _ZM; //#3557
                if (_ZM.length < 1) { //#3557
                    $j -= 2; //#3556
                    $k[$j++] = "bwipp.GS1couponTooShort2ndPurchaseRequirementCode#3556"; //#3556
                    $k[$j++] = "Coupon too short: Missing 2nd Purchase Requirement Code"; //#3556
                    $k[$j++] = false; //#3556
                    return true; //#3556
                } //#3556
                var _ZN = $k[$j - 1]; //#3558
                var _ZP = $cvi($geti(_ZN, 0, 1)); //#3558
                if ((_ZP > 4) && (_ZP != 9)) { //#3560
                    $j -= 2; //#3559
                    $k[$j++] = "bwipp.GS1couponBad2ndPurchaseRequirementCode#3559"; //#3559
                    $k[$j++] = "Coupon 2nd Purchase Requirement Code must be 0-4 or 9"; //#3559
                    $k[$j++] = false; //#3559
                    return true; //#3559
                } //#3559
                var _ZQ = $k[--$j]; //#3561
                var _ZR = $geti(_ZQ, 1, _ZQ.length - 1); //#3561
                $k[$j++] = _ZR; //#3566
                if (_ZR.length < 3) { //#3566
                    $j -= 2; //#3565
                    $k[$j++] = "bwipp.GS1couponTooShort2ndPurchaseFamilyCode#3565"; //#3565
                    $k[$j++] = "Coupon too short: 2nd Purchase Family Code truncated"; //#3565
                    $k[$j++] = false; //#3565
                    return true; //#3565
                } //#3565
                var _ZS = $k[--$j]; //#3567
                var _ZT = $geti(_ZS, 3, _ZS.length - 3); //#3567
                $k[$j++] = _ZT; //#3572
                if (_ZT.length < 1) { //#3572
                    $j -= 2; //#3571
                    $k[$j++] = "bwipp.GS1couponTooShort2ndPurchaseGCPVLI#3571"; //#3571
                    $k[$j++] = "Coupon too short: Missing 2nd Purchase GCP VLI"; //#3571
                    $k[$j++] = false; //#3571
                    return true; //#3571
                } //#3571
                var _ZU = $k[$j - 1]; //#3573
                var _ZW = $cvi($geti(_ZU, 0, 1)); //#3573
                $k[$j++] = _ZW; //#3575
                if ((_ZW > 6) && (_ZW != 9)) { //#3575
                    $j -= 3; //#3574
                    $k[$j++] = "bwipp.GS1couponBad2ndPurchaseGCPVLI#3574"; //#3574
                    $k[$j++] = "Coupon 2nd Purchase GCP length indicator must be 0-6 or 9"; //#3574
                    $k[$j++] = false; //#3574
                    return true; //#3574
                } //#3574
                var _ZX = $k[$j - 1]; //#3576
                if (_ZX != 9) { //#3576
                    $k[$j - 1] += 6; //#3576
                } else { //#3576
                    $k[$j - 1] = 0; //#3576
                } //#3576
                var _ZZ = $k[--$j]; //#3576
                var _Za = $k[$j - 1]; //#3577
                $k[$j++] = _ZZ + 1; //#3579
                if ((_ZZ + 1) > _Za.length) { //#3579
                    $j -= 3; //#3578
                    $k[$j++] = "bwipp.GS1couponTooShort2ndPurchaseGCP#3578"; //#3578
                    $k[$j++] = "Coupon too short: 2nd Purchase GCP truncated"; //#3578
                    $k[$j++] = false; //#3578
                    return true; //#3578
                } //#3578
                var _Zb = $k[--$j]; //#3580
                var _Zc = $k[--$j]; //#3580
                $k[$j++] = $geti(_Zc, _Zb, $f(_Zc.length - _Zb)) //#3580
            } //#3580
        } //#3580
        var _Ze = $k[$j - 1]; //#3585
        if (_Ze.length >= 1) { //#3629
            var _Zf = $k[$j - 1]; //#3585
            if ($cvi($geti(_Zf, 0, 1)) == 2) { //#3629
                var _Zh = $k[--$j]; //#3586
                var _Zi = $geti(_Zh, 1, _Zh.length - 1); //#3586
                $k[$j++] = _Zi; //#3591
                if (_Zi.length < 1) { //#3591
                    $j -= 2; //#3590
                    $k[$j++] = "bwipp.GS1couponTooShort3rdPurchaseRequirementVLI#3590"; //#3590
                    $k[$j++] = "Coupon too short: Missing 3rd Purchase Requirement VLI"; //#3590
                    $k[$j++] = false; //#3590
                    return true; //#3590
                } //#3590
                var _Zj = $k[$j - 1]; //#3592
                var _Zl = $cvi($geti(_Zj, 0, 1)); //#3592
                $k[$j++] = _Zl; //#3594
                if ((_Zl < 1) || (_Zl > 5)) { //#3594
                    $j -= 3; //#3593
                    $k[$j++] = "bwipp.GS1couponBad3rdPurchaseRequirementVLI#3593"; //#3593
                    $k[$j++] = "Coupon 3rd Purchase Requirement length indicator must be 1-5"; //#3593
                    $k[$j++] = false; //#3593
                    return true; //#3593
                } //#3593
                var _Zm = $k[--$j]; //#3595
                var _Zn = $k[$j - 1]; //#3596
                $k[$j++] = _Zm + 1; //#3598
                if ((_Zm + 1) > _Zn.length) { //#3598
                    $j -= 3; //#3597
                    $k[$j++] = "bwipp.GS1couponTooShort3rdPurchaseRequirement#3597"; //#3597
                    $k[$j++] = "Coupon too short: 3rd Purchase Requirement truncated"; //#3597
                    $k[$j++] = false; //#3597
                    return true; //#3597
                } //#3597
                var _Zo = $k[--$j]; //#3599
                var _Zp = $k[--$j]; //#3599
                var _Zq = $geti(_Zp, _Zo, $f(_Zp.length - _Zo)); //#3599
                $k[$j++] = _Zq; //#3604
                if (_Zq.length < 1) { //#3604
                    $j -= 2; //#3603
                    $k[$j++] = "bwipp.GS1couponTooShort3rdPurchaseRequirementCode#3603"; //#3603
                    $k[$j++] = "Coupon too short: Missing 3rd Purchase Requirement Code"; //#3603
                    $k[$j++] = false; //#3603
                    return true; //#3603
                } //#3603
                var _Zr = $k[$j - 1]; //#3605
                var _Zt = $cvi($geti(_Zr, 0, 1)); //#3605
                if ((_Zt > 4) && (_Zt != 9)) { //#3607
                    $j -= 2; //#3606
                    $k[$j++] = "bwipp.GS1couponBad3rdPurchaseRequirementCode#3606"; //#3606
                    $k[$j++] = "Coupon 3rd Purchase Requirement Code must be 0-4 or 9"; //#3606
                    $k[$j++] = false; //#3606
                    return true; //#3606
                } //#3606
                var _Zu = $k[--$j]; //#3608
                var _Zv = $geti(_Zu, 1, _Zu.length - 1); //#3608
                $k[$j++] = _Zv; //#3613
                if (_Zv.length < 3) { //#3613
                    $j -= 2; //#3612
                    $k[$j++] = "bwipp.GS1couponTooShort3rdPurchaseFamilyCode#3612"; //#3612
                    $k[$j++] = "Coupon too short: 3rd Purchase Family Code truncated"; //#3612
                    $k[$j++] = false; //#3612
                    return true; //#3612
                } //#3612
                var _Zw = $k[--$j]; //#3614
                var _Zx = $geti(_Zw, 3, _Zw.length - 3); //#3614
                $k[$j++] = _Zx; //#3619
                if (_Zx.length < 1) { //#3619
                    $j -= 2; //#3618
                    $k[$j++] = "bwipp.GS1couponTooShort3rdPurchaseGCPVLI#3618"; //#3618
                    $k[$j++] = "Coupon too short: Missing 3rd Purchase GCP VLI"; //#3618
                    $k[$j++] = false; //#3618
                    return true; //#3618
                } //#3618
                var _Zy = $k[$j - 1]; //#3620
                var _a0 = $cvi($geti(_Zy, 0, 1)); //#3620
                $k[$j++] = _a0; //#3622
                if ((_a0 > 6) && (_a0 != 9)) { //#3622
                    $j -= 3; //#3621
                    $k[$j++] = "bwipp.GS1couponBad3rdPurchaseGCPVLI#3621"; //#3621
                    $k[$j++] = "Coupon 3rd Purchase GCP length indicator must be 0-6 or 9"; //#3621
                    $k[$j++] = false; //#3621
                    return true; //#3621
                } //#3621
                var _a1 = $k[$j - 1]; //#3623
                if (_a1 != 9) { //#3623
                    $k[$j - 1] += 6; //#3623
                } else { //#3623
                    $k[$j - 1] = 0; //#3623
                } //#3623
                var _a3 = $k[--$j]; //#3623
                var _a4 = $k[$j - 1]; //#3624
                $k[$j++] = _a3 + 1; //#3626
                if ((_a3 + 1) > _a4.length) { //#3626
                    $j -= 3; //#3625
                    $k[$j++] = "bwipp.GS1couponTooShort3rdPurchaseGCP#3625"; //#3625
                    $k[$j++] = "Coupon too short: 3rd Purchase GCP truncated"; //#3625
                    $k[$j++] = false; //#3625
                    return true; //#3625
                } //#3625
                var _a5 = $k[--$j]; //#3627
                var _a6 = $k[--$j]; //#3627
                $k[$j++] = $geti(_a6, _a5, $f(_a6.length - _a5)) //#3627
            } //#3627
        } //#3627
        $_.couponexpire = -1; //#3632
        var _a8 = $k[$j - 1]; //#3633
        if (_a8.length >= 1) { //#3653
            var _a9 = $k[$j - 1]; //#3633
            if ($cvi($geti(_a9, 0, 1)) == 3) { //#3653
                var _aB = $k[--$j]; //#3634
                var _aC = $geti(_aB, 1, _aB.length - 1); //#3634
                $k[$j++] = _aC; //#3639
                if (_aC.length < 6) { //#3639
                    $j -= 2; //#3638
                    $k[$j++] = "bwipp.GS1couponTooShortExpirationDate#3638"; //#3638
                    $k[$j++] = "Coupon too short: Expiration date"; //#3638
                    $k[$j++] = false; //#3638
                    return true; //#3638
                } //#3638
                var _aD = $k[$j - 1]; //#3640
                var _aF = $cvi($geti(_aD, 2, 2)); //#3640
                $k[$j++] = _aF; //#3640
                if ((_aF < 1) || (_aF > 12)) { //#3640
                    $j -= 3; //#3640
                    $k[$j++] = "bwipp.GS1couponExpirationDateBadMonth#3640"; //#3640
                    $k[$j++] = "Invalid month in expiration date"; //#3640
                    $k[$j++] = false; //#3640
                    return true; //#3640
                } //#3640
                var _aG = $k[--$j]; //#3641
                if (_aG == 2) { //#3646
                    var _aH = $k[$j - 1]; //#3642
                    var _aJ = $cvi($geti(_aH, 0, 2)); //#3642
                    var _aK = _aJ - 21; //#3643
                    $k[$j++] = _aJ; //#3643
                    $k[$j++] = _aK; //#3643
                    if (_aK >= 51) { //#3643
                        $j--; //#3643
                        $k[$j - 1] += 1900; //#3643
                    } else { //#3643
                        var _aM = $k[--$j]; //#3643
                        if (_aM <= -50) { //#3643
                            $k[$j - 1] += 2100; //#3643
                        } else { //#3643
                            $k[$j - 1] += 2000; //#3643
                        } //#3643
                    } //#3643
                    var _aP = $k[--$j]; //#3644
                    $k[$j++] = (((_aP % 400) == 0) || (((_aP % 4) == 0) && ((_aP % 100) != 0))) ? 29 : 28; //#3644
                } else { //#3646
                    var _aR = $k[$j - 1]; //#3646
                    $k[$j++] = $get($_.gs1process_daysinmonth, $cvi($geti(_aR, 2, 2)) - 1); //#3646
                } //#3646
                var _aU = $k[--$j]; //#3648
                var _aV = $k[$j - 1]; //#3648
                var _aX = $cvi($geti(_aV, 4, 2)); //#3648
                if ((_aU < _aX) || (_aX < 1)) { //#3649
                    $j -= 2; //#3649
                    $k[$j++] = "bwipp.GS1couponExpirationDateBadDay#3649"; //#3649
                    $k[$j++] = "Invalid day of month in expiration date"; //#3649
                    $k[$j++] = false; //#3649
                    return true; //#3649
                } //#3649
                var _aY = $k[--$j]; //#3650
                $_.couponexpire = $cvi($geti(_aY, 0, 6)); //#3650
                $k[$j++] = $geti(_aY, 6, _aY.length - 6); //#3651
            } //#3651
        } //#3651
        var _ab = $k[$j - 1]; //#3656
        if (_ab.length >= 1) { //#3679
            var _ac = $k[$j - 1]; //#3656
            if ($cvi($geti(_ac, 0, 1)) == 4) { //#3679
                var _ae = $k[--$j]; //#3657
                var _af = $geti(_ae, 1, _ae.length - 1); //#3657
                $k[$j++] = _af; //#3662
                if (_af.length < 6) { //#3662
                    $j -= 2; //#3661
                    $k[$j++] = "bwipp.GS1couponTooShortStartDate#3661"; //#3661
                    $k[$j++] = "Coupon too short: Start date"; //#3661
                    $k[$j++] = false; //#3661
                    return true; //#3661
                } //#3661
                var _ag = $k[$j - 1]; //#3663
                var _ai = $cvi($geti(_ag, 2, 2)); //#3663
                $k[$j++] = _ai; //#3663
                if ((_ai < 1) || (_ai > 12)) { //#3663
                    $j -= 3; //#3663
                    $k[$j++] = "bwipp.GS1couponStartDateBadMonth#3663"; //#3663
                    $k[$j++] = "Invalid month in start date"; //#3663
                    $k[$j++] = false; //#3663
                    return true; //#3663
                } //#3663
                var _aj = $k[--$j]; //#3664
                if (_aj == 2) { //#3669
                    var _ak = $k[$j - 1]; //#3665
                    var _am = $cvi($geti(_ak, 0, 2)); //#3665
                    var _an = _am - 21; //#3666
                    $k[$j++] = _am; //#3666
                    $k[$j++] = _an; //#3666
                    if (_an >= 51) { //#3666
                        $j--; //#3666
                        $k[$j - 1] += 1900; //#3666
                    } else { //#3666
                        var _ap = $k[--$j]; //#3666
                        if (_ap <= -50) { //#3666
                            $k[$j - 1] += 2100; //#3666
                        } else { //#3666
                            $k[$j - 1] += 2000; //#3666
                        } //#3666
                    } //#3666
                    var _as = $k[--$j]; //#3667
                    $k[$j++] = (((_as % 400) == 0) || (((_as % 4) == 0) && ((_as % 100) != 0))) ? 29 : 28; //#3667
                } else { //#3669
                    var _au = $k[$j - 1]; //#3669
                    $k[$j++] = $get($_.gs1process_daysinmonth, $cvi($geti(_au, 2, 2)) - 1); //#3669
                } //#3669
                var _ax = $k[--$j]; //#3671
                var _ay = $k[$j - 1]; //#3671
                var _b0 = $cvi($geti(_ay, 4, 2)); //#3671
                if ((_ax < _b0) || (_b0 < 1)) { //#3672
                    $j -= 2; //#3672
                    $k[$j++] = "bwipp.GS1couponStartDateBadDay#3672"; //#3672
                    $k[$j++] = "Invalid day of month in start date"; //#3672
                    $k[$j++] = false; //#3672
                    return true; //#3672
                } //#3672
                var _b1 = $k[--$j]; //#3673
                $_.couponstart = $cvi($geti(_b1, 0, 6)); //#3673
                $k[$j++] = _b1; //#3676
                if (($_.couponexpire != -1) && ($_.couponexpire < $_.couponstart)) { //#3676
                    $j -= 2; //#3675
                    $k[$j++] = "bwipp.GS1couponExpireDateBeforeStartDate#3675"; //#3675
                    $k[$j++] = "Coupon expires before it starts"; //#3675
                    $k[$j++] = false; //#3675
                    return true; //#3675
                } //#3675
                var _b6 = $k[--$j]; //#3677
                $k[$j++] = $geti(_b6, 6, _b6.length - 6); //#3677
            } //#3677
        } //#3677
        var _b8 = $k[$j - 1]; //#3682
        if (_b8.length >= 1) { //#3695
            var _b9 = $k[$j - 1]; //#3682
            if ($cvi($geti(_b9, 0, 1)) == 5) { //#3695
                var _bB = $k[--$j]; //#3683
                var _bC = $geti(_bB, 1, _bB.length - 1); //#3683
                $k[$j++] = _bC; //#3688
                if (_bC.length < 1) { //#3688
                    $j -= 2; //#3687
                    $k[$j++] = "bwipp.GS1couponTooShortSerialNumberVLI#3687"; //#3687
                    $k[$j++] = "Coupon too short: Missing Serial Number VLI"; //#3687
                    $k[$j++] = false; //#3687
                    return true; //#3687
                } //#3687
                var _bD = $k[$j - 1]; //#3689
                var _bE = $geti(_bD, 0, 1); //#3689
                $k[$j++] = ($cvi(_bE) + 6) + 1; //#3692
                if ((($cvi(_bE) + 6) + 1) > _bD.length) { //#3692
                    $j -= 3; //#3691
                    $k[$j++] = "bwipp.GS1couponTooShortSerialNumber#3691"; //#3691
                    $k[$j++] = "Coupon too short: Serial Number truncated"; //#3691
                    $k[$j++] = false; //#3691
                    return true; //#3691
                } //#3691
                var _bF = $k[--$j]; //#3693
                var _bG = $k[--$j]; //#3693
                $k[$j++] = $geti(_bG, _bF, $f(_bG.length - _bF)) //#3693
            } //#3693
        } //#3693
        var _bI = $k[$j - 1]; //#3698
        if (_bI.length >= 1) { //#3714
            var _bJ = $k[$j - 1]; //#3698
            if ($cvi($geti(_bJ, 0, 1)) == 6) { //#3714
                var _bL = $k[--$j]; //#3699
                var _bM = $geti(_bL, 1, _bL.length - 1); //#3699
                $k[$j++] = _bM; //#3704
                if (_bM.length < 1) { //#3704
                    $j -= 2; //#3703
                    $k[$j++] = "bwipp.GS1couponTooShortRetailerGCPGLNVLI#3703"; //#3703
                    $k[$j++] = "Coupon too short: Missing Retailer GCP/GLN VLI"; //#3703
                    $k[$j++] = false; //#3703
                    return true; //#3703
                } //#3703
                var _bN = $k[$j - 1]; //#3705
                var _bP = $cvi($geti(_bN, 0, 1)); //#3705
                $k[$j++] = _bP; //#3707
                if ((_bP < 1) || (_bP > 7)) { //#3707
                    $j -= 3; //#3706
                    $k[$j++] = "bwipp.GS1couponBadRetailerGCPGLNVLI#3706"; //#3706
                    $k[$j++] = "Coupon Retailer GCP/GLN length indicator must be 1-7"; //#3706
                    $k[$j++] = false; //#3706
                    return true; //#3706
                } //#3706
                var _bQ = $k[--$j]; //#3708
                var _bR = $k[$j - 1]; //#3709
                $k[$j++] = (_bQ + 6) + 1; //#3711
                if (((_bQ + 6) + 1) > _bR.length) { //#3711
                    $j -= 3; //#3710
                    $k[$j++] = "bwipp.GS1couponTooShortRetailerGCPGLN#3710"; //#3710
                    $k[$j++] = "Coupon too short: Retailer GCP/GLN truncated"; //#3710
                    $k[$j++] = false; //#3710
                    return true; //#3710
                } //#3710
                var _bS = $k[--$j]; //#3712
                var _bT = $k[--$j]; //#3712
                $k[$j++] = $geti(_bT, _bS, $f(_bT.length - _bS)) //#3712
            } //#3712
        } //#3712
        var _bV = $k[$j - 1]; //#3717
        if (_bV.length >= 1) { //#3753
            var _bW = $k[$j - 1]; //#3717
            if ($cvi($geti(_bW, 0, 1)) == 9) { //#3753
                var _bY = $k[--$j]; //#3718
                var _bZ = $geti(_bY, 1, _bY.length - 1); //#3718
                $k[$j++] = _bZ; //#3723
                if (_bZ.length < 1) { //#3723
                    $j -= 2; //#3722
                    $k[$j++] = "bwipp.GS1couponTooShortSaveValueCode#3722"; //#3722
                    $k[$j++] = "Coupon too short: Missing Save Value Code"; //#3722
                    $k[$j++] = false; //#3722
                    return true; //#3722
                } //#3722
                var _ba = $k[$j - 1]; //#3724
                var _bc = $cvi($geti(_ba, 0, 1)); //#3724
                if ((_bc > 6) || ((_bc == 3) || (_bc == 4))) { //#3726
                    $j -= 2; //#3725
                    $k[$j++] = "bwipp.GS1couponBadSaveValueCode#3725"; //#3725
                    $k[$j++] = "Coupon Save Value Code must be 0,1,2,5 or 6"; //#3725
                    $k[$j++] = false; //#3725
                    return true; //#3725
                } //#3725
                var _bd = $k[--$j]; //#3727
                var _be = $geti(_bd, 1, _bd.length - 1); //#3727
                $k[$j++] = _be; //#3732
                if (_be.length < 1) { //#3732
                    $j -= 2; //#3731
                    $k[$j++] = "bwipp.GS1couponTooShortSaveValueAppliesToItem#3731"; //#3731
                    $k[$j++] = "Coupon too short: Missing Save Value Applies to Item"; //#3731
                    $k[$j++] = false; //#3731
                    return true; //#3731
                } //#3731
                var _bf = $k[$j - 1]; //#3733
                if ($cvi($geti(_bf, 0, 1)) > 2) { //#3735
                    $j -= 2; //#3734
                    $k[$j++] = "bwipp.GS1couponBadSaveValueAppliesToItem#3734"; //#3734
                    $k[$j++] = "Coupon Save Value Applies to Item must be 0-2"; //#3734
                    $k[$j++] = false; //#3734
                    return true; //#3734
                } //#3734
                var _bh = $k[--$j]; //#3736
                var _bi = $geti(_bh, 1, _bh.length - 1); //#3736
                $k[$j++] = _bi; //#3741
                if (_bi.length < 1) { //#3741
                    $j -= 2; //#3740
                    $k[$j++] = "bwipp.GS1couponTooShortStoreCouponFlag#3740"; //#3740
                    $k[$j++] = "Coupon too short: Missing Store Coupon Flag"; //#3740
                    $k[$j++] = false; //#3740
                    return true; //#3740
                } //#3740
                var _bj = $k[--$j]; //#3742
                var _bk = $geti(_bj, 1, _bj.length - 1); //#3742
                $k[$j++] = _bk; //#3747
                if (_bk.length < 1) { //#3747
                    $j -= 2; //#3746
                    $k[$j++] = "bwipp.GS1couponTooShortDontMultiplyFlag#3746"; //#3746
                    $k[$j++] = "Coupon too short: Missing Don't Multiply Flag"; //#3746
                    $k[$j++] = false; //#3746
                    return true; //#3746
                } //#3746
                var _bl = $k[$j - 1]; //#3748
                if ($cvi($geti(_bl, 0, 1)) > 1) { //#3750
                    $j -= 2; //#3749
                    $k[$j++] = "bwipp.GS1couponBadDontMultiplyFlag#3749"; //#3749
                    $k[$j++] = "Don't Multiply Flag must be 0 or 1"; //#3749
                    $k[$j++] = false; //#3749
                    return true; //#3749
                } //#3749
                var _bn = $k[--$j]; //#3751
                $k[$j++] = $geti(_bn, 1, _bn.length - 1); //#3751
            } //#3751
        } //#3751
        var _bp = $k[$j - 1]; //#3755
        if (_bp.length != 0) { //#3757
            $j -= 2; //#3756
            $k[$j++] = "bwipp.GS1couponUnrecognisedOptionalField#3756"; //#3756
            $k[$j++] = "Coupon fields must be 1,2,3,4,5,6 or 9, increasing order"; //#3756
            $k[$j++] = false; //#3756
            return true; //#3756
        } //#3756
        $j--; //#3758
    }; //#3758
    $_.lintcouponposoffer = function() {
        var _bq = $k[$j - 1]; //#3762
        $k[$j++] = true; //#3764
        $forall(_bq, function() { //#3764
            var _br = $k[--$j]; //#3763
            if ((_br < 48) || (_br > 57)) { //#3763
                $k[$j - 1] = false; //#3763
                return true; //#3763
            } //#3763
        }); //#3763
        var _bs = $k[--$j]; //#3765
        if (!_bs) { //#3765
            $j -= 2; //#3765
            $k[$j++] = "bwipp.GS1couponNotNumeric#3765"; //#3765
            $k[$j++] = "Coupon not numeric"; //#3765
            $k[$j++] = false; //#3765
            return true; //#3765
        } //#3765
        var _bt = $k[$j - 1]; //#3767
        if (_bt.length < 1) { //#3769
            $j -= 2; //#3768
            $k[$j++] = "bwipp.GS1couponTooShortFormatCode#3768"; //#3768
            $k[$j++] = "Coupon too short: Missing Format Code"; //#3768
            $k[$j++] = false; //#3768
            return true; //#3768
        } //#3768
        var _bu = $k[$j - 1]; //#3770
        var _bv = $geti(_bu, 0, 1); //#3770
        if ($ne(_bv, "0") && $ne(_bv, "1")) { //#3772
            $j -= 2; //#3771
            $k[$j++] = "bwipp.GS1couponBadFormatCode#3771"; //#3771
            $k[$j++] = "Coupon format must be 0 or 1"; //#3771
            $k[$j++] = false; //#3771
            return true; //#3771
        } //#3771
        var _bw = $k[--$j]; //#3773
        var _bx = $geti(_bw, 1, _bw.length - 1); //#3773
        $k[$j++] = _bx; //#3777
        if (_bx.length < 1) { //#3777
            $j -= 2; //#3776
            $k[$j++] = "bwipp.GS1couponTooShortFunderVLI#3776"; //#3776
            $k[$j++] = "Coupon too short: Missing Funder VLI"; //#3776
            $k[$j++] = false; //#3776
            return true; //#3776
        } //#3776
        var _by = $k[$j - 1]; //#3778
        var _c0 = $cvi($geti(_by, 0, 1)); //#3778
        $k[$j++] = _c0; //#3780
        if (_c0 > 6) { //#3780
            $j -= 3; //#3779
            $k[$j++] = "bwipp.GS1couponBadFunderVLI#3779"; //#3779
            $k[$j++] = "Coupon Funder length indicator must be 0-6"; //#3779
            $k[$j++] = false; //#3779
            return true; //#3779
        } //#3779
        var _c1 = $k[--$j]; //#3781
        var _c2 = $k[$j - 1]; //#3782
        $k[$j++] = (_c1 + 6) + 1; //#3784
        if (((_c1 + 6) + 1) > _c2.length) { //#3784
            $j -= 3; //#3783
            $k[$j++] = "bwipp.GS1couponTooShortFunder#3783"; //#3783
            $k[$j++] = "Coupon too short: Truncated Funder ID"; //#3783
            $k[$j++] = false; //#3783
            return true; //#3783
        } //#3783
        var _c3 = $k[--$j]; //#3785
        var _c4 = $k[--$j]; //#3785
        var _c5 = $geti(_c4, _c3, $f(_c4.length - _c3)); //#3785
        $k[$j++] = _c5; //#3789
        if (_c5.length < 6) { //#3789
            $j -= 2; //#3788
            $k[$j++] = "bwipp.GS1couponTooShortOfferCode#3788"; //#3788
            $k[$j++] = "Coupon too short: Truncated Offer Code"; //#3788
            $k[$j++] = false; //#3788
            return true; //#3788
        } //#3788
        var _c6 = $k[--$j]; //#3790
        var _c7 = $geti(_c6, 6, _c6.length - 6); //#3790
        $k[$j++] = _c7; //#3794
        if (_c7.length < 1) { //#3794
            $j -= 2; //#3793
            $k[$j++] = "bwipp.GS1couponTooShortSnVLI#3793"; //#3793
            $k[$j++] = "Coupon too short: Missing SN VLI"; //#3793
            $k[$j++] = false; //#3793
            return true; //#3793
        } //#3793
        var _c8 = $k[$j - 1]; //#3795
        var _c9 = $geti(_c8, 0, 1); //#3795
        $k[$j++] = ($cvi(_c9) + 6) + 1; //#3799
        if ((($cvi(_c9) + 6) + 1) > _c8.length) { //#3799
            $j -= 3; //#3798
            $k[$j++] = "bwipp.GS1couponTooShortSn#3798"; //#3798
            $k[$j++] = "Coupon too short: Truncated SN"; //#3798
            $k[$j++] = false; //#3798
            return true; //#3798
        } //#3798
        var _cA = $k[--$j]; //#3800
        var _cB = $k[--$j]; //#3800
        var _cC = $geti(_cB, _cA, $f(_cB.length - _cA)); //#3800
        $k[$j++] = _cC; //#3803
        if (_cC.length != 0) { //#3803
            $j -= 2; //#3802
            $k[$j++] = "bwipp.GS1couponTooLong#3802"; //#3802
            $k[$j++] = "Coupon too long"; //#3802
            $k[$j++] = false; //#3802
            return true; //#3802
        } //#3802
        $j--; //#3804
    }; //#3804
    $_.lintlatitude = function() {
        var _cD = $k[$j - 1]; //#3808
        if (_cD.length != 10) { //#3810
            $k[$j - 1] = "bwipp.GS1badLatitudeLength#3809"; //#3809
            $k[$j++] = "Invalid length for a latitude"; //#3809
            $k[$j++] = false; //#3809
            return true; //#3809
        } //#3809
        var _cE = $k[--$j]; //#3812
        if ($gt(_cE, "1800000000")) { //#3812
            $k[$j - 1] = "bwipp.GS1badLatitude#3812"; //#3812
            $k[$j++] = "Invalid value for latitude"; //#3812
            $k[$j++] = false; //#3812
            return true; //#3812
        } //#3812
    }; //#3812
    $_.lintlongitude = function() {
        var _cF = $k[$j - 1]; //#3816
        if (_cF.length != 10) { //#3818
            $k[$j - 1] = "bwipp.GS1badLongitudeLength#3817"; //#3817
            $k[$j++] = "Invalid length for a longitude"; //#3817
            $k[$j++] = false; //#3817
            return true; //#3817
        } //#3817
        var _cG = $k[--$j]; //#3820
        if ($gt(_cG, "3600000000")) { //#3820
            $k[$j - 1] = "bwipp.GS1badLongitude#3820"; //#3820
            $k[$j++] = "Invalid value for longitude"; //#3820
            $k[$j++] = false; //#3820
            return true; //#3820
        } //#3820
    }; //#3820
    $_.lintmediatype = function() {
        var _cI = $k[--$j]; //#3824
        if (!$has($_.aidcmediatype, _cI)) { //#3824
            $k[$j - 1] = "bwipp.GS1UnknownMediaType#3824"; //#3824
            $k[$j++] = "Unknown AIDC media type"; //#3824
            $k[$j++] = false; //#3824
            return true; //#3824
        } //#3824
    }; //#3824
    $_.lintpackagetype = function() {
        var _cL = $k[--$j]; //#3828
        if (!$has($_.packagetype, _cL)) { //#3828
            $k[$j - 1] = "bwipp.GS1unknownPackageType#3828"; //#3828
            $k[$j++] = "Unknown package type"; //#3828
            $k[$j++] = false; //#3828
            return true; //#3828
        } //#3828
    }; //#3828
    if (!$_.dontlint) { //#3976
        $k[$j++] = true; //#3872
        for (var _cQ = 0, _cP = $_.vals.length - 1; _cQ <= _cP; _cQ += 1) { //#3872
            $_.ai = $get($_.ais, _cQ); //#3836
            $_.val = $get($_.vals, _cQ); //#3837
            if ($has($_.gs1syntax, $_.ai)) { //#3870
                var _cb = $get($get($_.gs1syntax, $_.ai), 'parts'); //#3839
                $k[$j++] = _cb; //#3841
                $k[$j++] = 0; //#3841
                $forall(_cb, function() { //#3841
                    var _cc = $k[$j - 1]; //#3841
                    if ($get(_cc, 'opt')) { //#3841
                        $k[$j - 1] = 0; //#3841
                    } else { //#3841
                        var _ce = $k[--$j]; //#3841
                        $k[$j++] = $get(_ce, 'min'); //#3841
                    } //#3841
                    var _cg = $k[--$j]; //#3841
                    var _ch = $k[--$j]; //#3841
                    $k[$j++] = $f(_ch + _cg) //#3841
                }); //#3841
                var _cj = $k[--$j]; //#3841
                if (_cj > $_.val.length) { //#3843
                    $j -= 2; //#3842
                    $k[$j++] = "bwipp.GS1valueTooShort#3842"; //#3842
                    $k[$j++] = "Too short"; //#3842
                    $k[$j++] = false; //#3842
                    break; //#3842
                } //#3842
                var _ck = $k[$j - 1]; //#3844
                var _cp = 0; //#3844
                $forall(_ck, function() { //#3844
                    var _cl = $k[--$j]; //#3844
                    _cp = $f(_cp + $get(_cl, 'max')) //#3844
                }); //#3844
                if (_cp < $_.val.length) { //#3846
                    $j -= 2; //#3845
                    $k[$j++] = "bwipp.GS1valueTooLong#3845"; //#3845
                    $k[$j++] = "Too long"; //#3845
                    $k[$j++] = false; //#3845
                    break; //#3845
                } //#3845
                var _cq = $k[--$j]; //#3864
                $forall(_cq, function() { //#3864
                    var _cr = $k[--$j]; //#3848
                    $_.props = _cr; //#3848
                    var _ct = $get($_.props, 'max'); //#3849
                    var _cu = $_.val; //#3849
                    var _cv = _cu.length; //#3849
                    if (_ct > _cu.length) { //#3849
                        var _ = _cv; //#3849
                        _cv = _ct; //#3849
                        _ct = _; //#3849
                    } //#3849
                    $_.eval = $geti($_.val, 0, _ct); //#3850
                    var _d0 = $_.eval.length; //#3851
                    $_.val = $geti($_.val, _d0, $_.val.length - _d0); //#3851
                    if ($_.eval.length == 0) { //#3862
                        if (!$get($_.props, 'opt')) { //#3855
                            $k[$j - 1] = "bwipp.GS1valueTooShort#3854"; //#3854
                            $k[$j++] = "Too short"; //#3854
                            $k[$j++] = false; //#3854
                            return true; //#3854
                        } //#3854
                    } else { //#3862
                        if ($_.eval.length < $get($_.props, 'min')) { //#3859
                            $k[$j - 1] = "bwipp.GS1valueTooShort#3858"; //#3858
                            $k[$j++] = "Too short"; //#3858
                            $k[$j++] = false; //#3858
                            return true; //#3858
                        } //#3858
                        var _d9 = new Map([
                            ["N", 'lintnumeric'],
                            ["X", 'lintcset82'],
                            ["Y", 'lintcset39'],
                            ["Z", 'lintcset64']
                        ]); //#3860
                        var _dE = $_[$get(_d9, $get($_.props, 'cset'))]; //#3861
                        $k[$j++] = $_.eval; //#3861
                        if (_dE() === true) {
                            return true;
                        } //#3861
                        $forall($get($_.props, 'linters'), function() { //#3862
                            var _dI = $k[--$j]; //#3862
                            var _dJ = $_[_dI]; //#3862
                            $k[$j++] = $_.eval; //#3862
                            if (_dJ() === true) {
                                return true;
                            } //#3862
                        }); //#3862
                    } //#3862
                }); //#3862
                var _dK = $k[$j - 1]; //#3865
                if (!_dK) { //#3865
                    break; //#3865
                } //#3865
                if ($_.val.length != 0) { //#3868
                    $k[$j - 1] = "bwipp.GS1valueTooLong#3867"; //#3867
                    $k[$j++] = "Too long"; //#3867
                    $k[$j++] = false; //#3867
                    break; //#3867
                } //#3867
            } else { //#3870
                $k[$j - 1] = "bwipp.GS1unknownAI#3870"; //#3870
                $k[$j++] = "Unrecognised AI"; //#3870
                $k[$j++] = false; //#3870
                break; //#3870
            } //#3870
        } //#3870
        var _dM = $k[--$j]; //#3873
        if (!_dM) { //#3880
            var _dN = $k[--$j]; //#3874
            var _dP = $s((_dN.length + $_.ai.length) + 5); //#3874
            $puti(_dP, 0, "AI "); //#3875
            $puti(_dP, 3, $_.ai); //#3876
            $puti(_dP, 3 + $_.ai.length, ": "); //#3877
            $puti(_dP, 5 + $_.ai.length, _dN); //#3878
            $k[$j++] = _dP; //#3879
            bwipp_raiseerror(); //#3879
        } //#3879
        $_.aiexists = function() {
            var _dT = $k[--$j]; //#3884
            $_.this = _dT; //#3884
            var _dU = $k[--$j]; //#3885
            $_.patt = _dU; //#3885
            for (var _dV = 0; _dV < 1; _dV++) { //#3906
                if ($has($_.aivals, $_.patt)) { //#3887
                    $k[$j++] = true; //#3887
                    break; //#3887
                } //#3887
                if ($_.patt.length == 4) { //#3904
                    if ($eq($geti($_.patt, 3, 1), "n")) { //#3902
                        var _de = $eq($geti($_.patt, 2, 1), "n") ? 2 : 3; //#3890
                        $_.pfxlen = _de; //#3890
                        var _df = $_.ais; //#3892
                        $k[$j++] = false; //#3900
                        for (var _dg = 0, _dh = _df.length; _dg < _dh; _dg++) { //#3900
                            var _di = $get(_df, _dg); //#3900
                            $k[$j++] = _di; //#3899
                            if ($ne(_di, $_.this) && (_di.length == 4)) { //#3898
                                var _dl = $k[--$j]; //#3894
                                if ($eq($geti(_dl, 0, $_.pfxlen), $geti($_.patt, 0, $_.pfxlen))) { //#3896
                                    $k[$j - 1] = true; //#3895
                                } //#3895
                            } else { //#3898
                                $j--; //#3898
                            } //#3898
                        } //#3898
                        break; //#3901
                    } //#3901
                    $k[$j++] = false; //#3903
                    break; //#3903
                } //#3903
                $k[$j++] = false; //#3905
                break; //#3905
            } //#3905
        }; //#3905
        var _dq = $_.vals; //#3910
        $_.aivals = new Map; //#3910
        for (var _dt = 0, _ds = $_.vals.length - 1; _dt <= _ds; _dt += 1) { //#3925
            $_.ai = $get($_.ais, _dt); //#3912
            $_.val = $get($_.vals, _dt); //#3913
            if ($has($_.aivals, $_.ai)) { //#3923
                if ($ne($get($_.aivals, $_.ai), $_.val)) { //#3921
                    var _e6 = $s($_.ai.length + 40); //#3916
                    $puti(_e6, 0, "Repeated AIs \("); //#3917
                    $puti(_e6, 14, $_.ai); //#3918
                    $puti(_e6, 14 + $_.ai.length, "\) must have the same value"); //#3919
                    $k[$j++] = "bwipp.GS1repeatedDifferingAIs#3920"; //#3920
                    $k[$j++] = _e6; //#3920
                    bwipp_raiseerror(); //#3920
                } //#3920
            } else { //#3923
                $put($_.aivals, $_.ai, $_.val); //#3923
            } //#3923
        } //#3923
        for (var _eE = 0, _eD = $_.vals.length - 1; _eE <= _eD; _eE += 1) { //#3974
            $_.ai = $get($_.ais, _eE); //#3929
            var _eJ = $get($_.gs1syntax, $_.ai); //#3930
            var _eK = $has(_eJ, 'ex'); //#3930
            $k[$j++] = _eJ; //#3945
            $k[$j++] = 'ex'; //#3945
            if (_eK) { //#3944
                var _eL = $k[--$j]; //#3931
                var _eM = $k[--$j]; //#3931
                $forall($get(_eM, _eL), function() { //#3942
                    var _eO = $k[--$j]; //#3932
                    $_.patt = _eO; //#3932
                    $k[$j++] = $_.patt; //#3933
                    $k[$j++] = $_.ai; //#3933
                    $_.aiexists(); //#3933
                    var _eR = $k[--$j]; //#3941
                    if (_eR) { //#3941
                        var _eU = $s(($_.ai.length + $_.patt.length) + 36); //#3934
                        $puti(_eU, 0, "AIs \("); //#3935
                        $puti(_eU, 5, $_.ai); //#3936
                        $puti(_eU, 5 + $_.ai.length, "\) and \("); //#3937
                        $puti(_eU, 12 + $_.ai.length, $_.patt); //#3938
                        $puti(_eU, (12 + $_.ai.length) + $_.patt.length, "\) are mutually exclusive"); //#3939
                        $k[$j++] = "bwipp.GS1exclusiveAIs#3940"; //#3940
                        $k[$j++] = _eU; //#3940
                        bwipp_raiseerror(); //#3940
                    } //#3940
                }); //#3940
            } else { //#3944
                $j -= 2; //#3944
            } //#3944
            if ($_.lintreqs) { //#3973
                var _ee = $get($_.gs1syntax, $_.ai); //#3947
                var _ef = $has(_ee, 'req'); //#3947
                $k[$j++] = _ee; //#3972
                $k[$j++] = 'req'; //#3972
                if (_ef) { //#3971
                    var _eg = $k[--$j]; //#3948
                    var _eh = $k[--$j]; //#3948
                    $forall($get(_eh, _eg), function() { //#3969
                        var _ej = $k[--$j]; //#3949
                        $k[$j++] = false; //#3954
                        $forall(_ej, function() { //#3954
                            var _ek = $k[--$j]; //#3950
                            $k[$j++] = true; //#3952
                            $forall(_ek, function() { //#3952
                                $k[$j++] = $_.ai; //#3951
                                $_.aiexists(); //#3951
                                var _em = $k[--$j]; //#3951
                                if (!_em) { //#3951
                                    $k[$j - 1] = false; //#3951
                                } //#3951
                            }); //#3951
                            var _en = $k[--$j]; //#3953
                            if (_en) { //#3953
                                $k[$j - 1] = true; //#3953
                                return true; //#3953
                            } //#3953
                        }); //#3953
                        var _eo = $k[--$j]; //#3955
                        if (!_eo) { //#3968
                            $k[$j++] = Infinity; //#3956
                            $forall($get($get($_.gs1syntax, $_.ai), 'req'), function() { //#3958
                                var _et = $k[--$j]; //#3958
                                $forall(_et, function() { //#3958
                                    var _eu = $k[--$j]; //#3958
                                    $forall(_eu, function() { //#3958
                                        $k[$j++] = "+"; //#3958
                                    }); //#3958
                                    $k[$j - 1] = " OR "; //#3958
                                }); //#3958
                                $k[$j - 1] = " WITH "; //#3958
                            }); //#3958
                            $j--; //#3958
                            var _ev = $a(); //#3958
                            $k[$j++] = _ev; //#3959
                            $k[$j++] = 0; //#3959
                            for (var _ew = 0, _ex = _ev.length; _ew < _ex; _ew++) { //#3959
                                var _ez = $k[--$j]; //#3959
                                $k[$j++] = $f(_ez + $get(_ev, _ew).length) //#3959
                            } //#3959
                            var _f1 = $_.ai.length + 49; //#3960
                            $k[$j++] = _f1; //#3960
                            $k[$j++] = _f1; //#3960
                            var _f2 = $k[$j - 3]; //#3960
                            var _f3 = $k[$j - 1]; //#3960
                            var _f4 = $s($f(_f3 + _f2)); //#3960
                            var _f5 = $k[$j - 2]; //#3960
                            $j -= 3; //#3960
                            $k[$j++] = _f4; //#3960
                            $k[$j++] = _f5; //#3960
                            $r(3, -1); //#3960
                            var _f6 = $k[--$j]; //#3963
                            $forall(_f6, function() { //#3963
                                var _f7 = $k[--$j]; //#3961
                                var _f8 = $k[--$j]; //#3961
                                var _f9 = $k[$j - 1]; //#3962
                                $puti(_f9, _f8, _f7); //#3962
                                $k[$j++] = $f(_f7.length + _f8) //#3962
                            }); //#3962
                            $j--; //#3963
                            var _fA = $k[--$j]; //#3964
                            $puti(_fA, 0, "One of more requisite AIs for AI \("); //#3964
                            $puti(_fA, 34, $_.ai); //#3965
                            $puti(_fA, 34 + $_.ai.length, "\) are missing: "); //#3966
                            $k[$j++] = "bwipp.GS1missingAIs#3967"; //#3967
                            $k[$j++] = _fA; //#3967
                            bwipp_raiseerror(); //#3967
                        } //#3967
                    }); //#3967
                } else { //#3971
                    $j -= 2; //#3971
                } //#3971
            } //#3971
        } //#3971
    } //#3971
    $k[$j++] = $_.ais; //#3981
    $k[$j++] = $_.vals; //#3981
    $k[$j++] = $_.fncs; //#3981
    $_ = $__; //#3981
} //bwipp_gs1process
function bwipp_code128() {
    if (!bwipp_code128.globals) {
        var $__ = $_;
        $_ = bwipp_code128.globals = {};
        //#8982
        $_.code128_sta = -1; //#8987
        $_.code128_stb = -2; //#8987
        $_.code128_stc = -3; //#8987
        $_.code128_swa = -4; //#8988
        $_.code128_swb = -5; //#8988
        $_.code128_swc = -6; //#8988
        $_.code128_fn1 = -7; //#8989
        $_.code128_fn2 = -8; //#8989
        $_.code128_fn3 = -9; //#8989
        $_.code128_fn4 = -10; //#8990
        $_.code128_sft = -11; //#8990
        $_.code128_stp = -12; //#8990
        $_.code128_lka = -13; //#8991
        $_.code128_lkc = -14; //#8991
        $_.sta = $_.code128_sta; //#8993
        $_.stb = $_.code128_stb; //#8993
        $_.stc = $_.code128_stc; //#8993
        $_.swa = $_.code128_swa; //#8994
        $_.swb = $_.code128_swb; //#8994
        $_.swc = $_.code128_swc; //#8994
        $_.fn1 = $_.code128_fn1; //#8995
        $_.fn2 = $_.code128_fn2; //#8995
        $_.fn3 = $_.code128_fn3; //#8995
        $_.fn4 = $_.code128_fn4; //#8996
        $_.sft = $_.code128_sft; //#8996
        $_.stp = $_.code128_stp; //#8996
        $_.lka = $_.code128_lka; //#8997
        $_.lkc = $_.code128_lkc; //#8997
        $_.code128_charmaps = $a([$a([32, 32, "00"]), $a(["!", "!", "01"]), $a(["\"", "\"", "02"]), $a(["#", "#", "03"]), $a(["$", "$", "04"]), $a(["%", "%", "05"]), $a(["&", "&", "06"]), $a(["'", "'", "07"]), $a([40, 40, "08"]), $a([41, 41, "09"]), $a(["*", "*", "10"]), $a(["+", "+", "11"]), $a([",", ",", "12"]), $a(["-", "-", "13"]), $a([".", ".", "14"]), $a(["/", "/", "15"]), $a(["0", "0", "16"]), $a(["1", "1", "17"]), $a(["2", "2", "18"]), $a(["3", "3", "19"]), $a(["4", "4", "20"]), $a(["5", "5", "21"]), $a(["6", "6", "22"]), $a(["7", "7", "23"]), $a(["8", "8", "24"]), $a(["9", "9", "25"]), $a([":", ":", "26"]), $a([";", ";", "27"]), $a(["<", "<", "28"]), $a(["=", "=", "29"]), $a([">", ">", "30"]), $a(["?", "?", "31"]), $a(["@", "@", "32"]), $a(["A", "A", "33"]), $a(["B", "B", "34"]), $a(["C", "C", "35"]), $a(["D", "D", "36"]), $a(["E", "E", "37"]), $a(["F", "F", "38"]), $a(["G", "G", "39"]), $a(["H", "H", "40"]), $a(["I", "I", "41"]), $a(["J", "J", "42"]), $a(["K", "K", "43"]), $a(["L", "L", "44"]), $a(["M", "M", "45"]), $a(["N", "N", "46"]), $a(["O", "O", "47"]), $a(["P", "P", "48"]), $a(["Q", "Q", "49"]), $a(["R", "R", "50"]), $a(["S", "S", "51"]), $a(["T", "T", "52"]), $a(["U", "U", "53"]), $a(["V", "V", "54"]), $a(["W", "W", "55"]), $a(["X", "X", "56"]), $a(["Y", "Y", "57"]), $a(["Z", "Z", "58"]), $a(["[", "[", "59"]), $a([92, 92, "60"]), $a(["]", "]", "61"]), $a(["^", "^", "62"]), $a(["_", "_", "63"]), $a([0, "`", "64"]), $a([1, "a", "65"]), $a([2, "b", "66"]), $a([3, "c", "67"]), $a([4, "d", "68"]), $a([5, "e", "69"]), $a([6, "f", "70"]), $a([7, "g", "71"]), $a([8, "h", "72"]), $a([9, "i", "73"]), $a([10, "j", "74"]), $a([11, "k", "75"]), $a([12, "l", "76"]), $a([13, "m", "77"]), $a([14, "n", "78"]), $a([15, "o", "79"]), $a([16, "p", "80"]), $a([17, "q", "81"]), $a([18, "r", "82"]), $a([19, "s", "83"]), $a([20, "t", "84"]), $a([21, "u", "85"]), $a([22, "v", "86"]), $a([23, "w", "87"]), $a([24, "x", "88"]), $a([25, "y", "89"]), $a([26, "z", "90"]), $a([27, "{", "91"]), $a([28, "|", "92"]), $a([29, "}", "93"]), $a([30, "~", "94"]), $a([31, 127, "95"]), $a([$_.fn3, $_.fn3, "96"]), $a([$_.fn2, $_.fn2, "97"]), $a([$_.sft, $_.sft, "98"]), $a([$_.swc, $_.swc, "99"]), $a([$_.swb, $_.fn4, $_.swb]), $a([$_.fn4, $_.swa, $_.swa]), $a([$_.fn1, $_.fn1, $_.fn1]), $a([$_.sta, $_.sta, $_.sta]), $a([$_.stb, $_.stb, $_.stb]), $a([$_.stc, $_.stc, $_.stc]), $a([$_.stp, $_.stp, $_.stp])]); //#9040
        $_.code128_latch_a0 = $a(["", "e", "e", "ee", "eee", "eee"]); //#9060
        $_.code128_latch_b0 = $a(["d", "", "d", "ddd", "dd", "ddd"]); //#9061
        $_.code128_latch_c0 = $a(["c", "c", "", "eec", "ddc", "dddc"]); //#9062
        $_.code128_latch_a1 = $a(["ee", "eee", "eee", "", "e", "e"]); //#9063
        $_.code128_latch_b1 = $a(["ddd", "dd", "ddd", "d", "", "d"]); //#9064
        $_.code128_latch_c1 = $a(["eec", "ddc", "dddc", "c", "c", ""]); //#9065
        var _2N = []; //#9067
        var _2J = $_.code128_latch_a0; //#9067
        for (var _2K = 0, _2L = _2J.length; _2K < _2L; _2K++) { //#9067
            _2N[_2K] = $get(_2J, _2K).length; //#9067
        } //#9067
        _2N = $a(_2N); //#9067
        $_.code128_latch_length_a0 = _2N; //#9067
        var _2S = []; //#9068
        var _2O = $_.code128_latch_b0; //#9068
        for (var _2P = 0, _2Q = _2O.length; _2P < _2Q; _2P++) { //#9068
            _2S[_2P] = $get(_2O, _2P).length; //#9068
        } //#9068
        _2S = $a(_2S); //#9068
        $_.code128_latch_length_b0 = _2S; //#9068
        var _2X = []; //#9069
        var _2T = $_.code128_latch_c0; //#9069
        for (var _2U = 0, _2V = _2T.length; _2U < _2V; _2U++) { //#9069
            _2X[_2U] = $get(_2T, _2U).length; //#9069
        } //#9069
        _2X = $a(_2X); //#9069
        $_.code128_latch_length_c0 = _2X; //#9069
        var _2c = []; //#9070
        var _2Y = $_.code128_latch_a1; //#9070
        for (var _2Z = 0, _2a = _2Y.length; _2Z < _2a; _2Z++) { //#9070
            _2c[_2Z] = $get(_2Y, _2Z).length; //#9070
        } //#9070
        _2c = $a(_2c); //#9070
        $_.code128_latch_length_a1 = _2c; //#9070
        var _2h = []; //#9071
        var _2d = $_.code128_latch_b1; //#9071
        for (var _2e = 0, _2f = _2d.length; _2e < _2f; _2e++) { //#9071
            _2h[_2e] = $get(_2d, _2e).length; //#9071
        } //#9071
        _2h = $a(_2h); //#9071
        $_.code128_latch_length_b1 = _2h; //#9071
        var _2m = []; //#9072
        var _2i = $_.code128_latch_c1; //#9072
        for (var _2j = 0, _2k = _2i.length; _2j < _2k; _2j++) { //#9072
            _2m[_2j] = $get(_2i, _2j).length; //#9072
        } //#9072
        _2m = $a(_2m); //#9072
        $_.code128_latch_length_c1 = _2m; //#9072
        $_.code128_latch_sequence = $a([$_.code128_latch_a0, $_.code128_latch_b0, $_.code128_latch_c0, $_.code128_latch_a1, $_.code128_latch_b1, $_.code128_latch_c1]); //#9075
        $_.code128_start_code = $a([103, 104, 105]); //#9076
        $_.code128_state_priority = $a([1, 0, 2, 4, 3, 5]); //#9079
        $_.code128_start_state = $a([0, 1, 2, 0, 1, 2]); //#9080
        $_.code128_start_length = $a([1, 1, 1, 1, 1, 1]); //#9081
        var _34 = []; //#9084
        var _2y = $a([5, 4, 3, 2, 1, 0]); //#9084
        for (var _2z = 0, _30 = _2y.length; _2z < _30; _2z++) { //#9084
            _34[_2z] = $get($_.code128_state_priority, $get(_2y, _2z)); //#9084
        } //#9084
        _34 = $a(_34); //#9084
        $_.code128_reverse_priority = _34; //#9084
        $k[$j++] = Infinity; //#9087
        var _35 = $_.code128_reverse_priority; //#9087
        for (var _36 = 0, _37 = _35.length; _36 < _37; _36++) { //#9087
            var _38 = $get(_35, _36); //#9087
            $k[$j++] = _38; //#9087
            $k[$j++] = $get($_.code128_latch_length_a0, _38); //#9087
            $k[$j++] = _38; //#9087
        } //#9087
        var _3B = $a(); //#9087
        $_.code128_prioritized_latch_length_a0 = _3B; //#9087
        $k[$j++] = Infinity; //#9088
        var _3C = $_.code128_reverse_priority; //#9088
        for (var _3D = 0, _3E = _3C.length; _3D < _3E; _3D++) { //#9088
            var _3F = $get(_3C, _3D); //#9088
            $k[$j++] = _3F; //#9088
            $k[$j++] = $get($_.code128_latch_length_a1, _3F); //#9088
            $k[$j++] = _3F; //#9088
        } //#9088
        var _3I = $a(); //#9088
        $_.code128_prioritized_latch_length_a1 = _3I; //#9088
        $k[$j++] = Infinity; //#9089
        var _3J = $_.code128_reverse_priority; //#9089
        for (var _3K = 0, _3L = _3J.length; _3K < _3L; _3K++) { //#9089
            var _3M = $get(_3J, _3K); //#9089
            $k[$j++] = _3M; //#9089
            $k[$j++] = $get($_.code128_latch_length_b0, _3M); //#9089
            $k[$j++] = _3M; //#9089
        } //#9089
        var _3P = $a(); //#9089
        $_.code128_prioritized_latch_length_b0 = _3P; //#9089
        $k[$j++] = Infinity; //#9090
        var _3Q = $_.code128_reverse_priority; //#9090
        for (var _3R = 0, _3S = _3Q.length; _3R < _3S; _3R++) { //#9090
            var _3T = $get(_3Q, _3R); //#9090
            $k[$j++] = _3T; //#9090
            $k[$j++] = $get($_.code128_latch_length_b1, _3T); //#9090
            $k[$j++] = _3T; //#9090
        } //#9090
        var _3W = $a(); //#9090
        $_.code128_prioritized_latch_length_b1 = _3W; //#9090
        $k[$j++] = Infinity; //#9091
        var _3X = $_.code128_reverse_priority; //#9091
        for (var _3Y = 0, _3Z = _3X.length; _3Y < _3Z; _3Y++) { //#9091
            var _3a = $get(_3X, _3Y); //#9091
            $k[$j++] = _3a; //#9091
            $k[$j++] = $get($_.code128_latch_length_c0, _3a); //#9091
            $k[$j++] = _3a; //#9091
        } //#9091
        var _3d = $a(); //#9091
        $_.code128_prioritized_latch_length_c0 = _3d; //#9091
        $k[$j++] = Infinity; //#9092
        var _3e = $_.code128_reverse_priority; //#9092
        for (var _3f = 0, _3g = _3e.length; _3f < _3g; _3f++) { //#9092
            var _3h = $get(_3e, _3f); //#9092
            $k[$j++] = _3h; //#9092
            $k[$j++] = $get($_.code128_latch_length_c1, _3h); //#9092
            $k[$j++] = _3h; //#9092
        } //#9092
        var _3k = $a(); //#9092
        $_.code128_prioritized_latch_length_c1 = _3k; //#9092
        $k[$j++] = Infinity; //#9097
        $k[$j++] = $_.fn3; //#9097
        $k[$j++] = 96; //#9097
        $k[$j++] = $_.fn2; //#9097
        $k[$j++] = 97; //#9097
        $k[$j++] = $_.fn1; //#9097
        $k[$j++] = 102; //#9097
        $k[$j++] = $_.stp; //#9097
        $k[$j++] = 106; //#9097
        $k[$j++] = $_.lka; //#9097
        $k[$j++] = 100; //#9097
        $k[$j++] = $_.lkc; //#9097
        $k[$j++] = 99; //#9097
        var _3r = $d(); //#9097
        $_.code128_seta_new = _3r; //#9097
        $k[$j++] = Infinity; //#9098
        $k[$j++] = $_.fn3; //#9098
        $k[$j++] = 96; //#9098
        $k[$j++] = $_.fn2; //#9098
        $k[$j++] = 97; //#9098
        $k[$j++] = $_.fn1; //#9098
        $k[$j++] = 102; //#9098
        $k[$j++] = $_.stp; //#9098
        $k[$j++] = 106; //#9098
        $k[$j++] = $_.lka; //#9098
        $k[$j++] = 99; //#9098
        $k[$j++] = $_.lkc; //#9098
        $k[$j++] = 101; //#9098
        var _3y = $d(); //#9098
        $_.code128_setb_new = _3y; //#9098
        $k[$j++] = Infinity; //#9099
        $k[$j++] = $_.fn1; //#9099
        $k[$j++] = 102; //#9099
        $k[$j++] = $_.stp; //#9099
        $k[$j++] = 106; //#9099
        $k[$j++] = $_.lka; //#9099
        $k[$j++] = 101; //#9099
        $k[$j++] = $_.lkc; //#9099
        $k[$j++] = 100; //#9099
        var _43 = $d(); //#9099
        $_.code128_setc_new = _43; //#9099
        $_.code128_encs = $a(["212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412", "211214", "211232", "2331112"]); //#9121
        $_.code128_max_int = 2147483647; //#9123
        $_.charvals_legacy = $a([new Map, new Map, new Map]); //#9135
        for (var _46 = 0, _45 = $_.code128_charmaps.length - 1; _46 <= _45; _46 += 1) { //#9144
            $_.i = _46; //#9137
            $_.encs = $get($_.code128_charmaps, $_.i); //#9138
            for (var _49 = 0; _49 <= 2; _49 += 1) { //#9143
                $_.j = _49; //#9140
                var _4C = $get($_.encs, $_.j); //#9141
                var _4D = $type(_4C); //#9141
                if ($eq(_4D, 'stringtype')) { //#9141
                    _4C = $get(_4C, 0); //#9141
                } //#9141
                $put($get($_.charvals_legacy, $_.j), _4C, $_.i); //#9142
            } //#9142
        } //#9142
        $_.charvals_legacy = $_.charvals_legacy; //#9145
        var _4N = $get($_.charvals_legacy, 0); //#9150
        $put(_4N, $_.code128_lka, $get(_4N, $_.code128_swb)); //#9150
        $put(_4N, $_.code128_lkc, $get(_4N, $_.code128_swc)); //#9150
        $_.seta_legacy = _4N; //#9150
        var _4R = $get($_.charvals_legacy, 1); //#9151
        $put(_4R, $_.code128_lka, $get(_4R, $_.code128_swc)); //#9151
        $put(_4R, $_.code128_lkc, $get(_4R, $_.code128_swa)); //#9151
        $_.setb_legacy = _4R; //#9151
        var _4V = $get($_.charvals_legacy, 2); //#9152
        $put(_4V, $_.code128_lka, $get(_4V, $_.code128_swa)); //#9152
        $put(_4V, $_.code128_lkc, $get(_4V, $_.code128_swb)); //#9152
        $_.setc_legacy = _4V; //#9152
        $_ = $__;
    }
    //#9168
    var $__ = $_; //#9170
    $_ = Object.assign({}, $_, bwipp_code128.globals); //#9170
    $_.dontdraw = false; //#9173
    $_.includetext = false; //#9174
    $_.text1font = "OCR-B"; //#9175
    $_.text1size = 10; //#9176
    $_.text1xoffset = 0; //#9177
    $_.textyoffset = -8; //#9178
    $_.height = -1; //#9179
    $_.width = 0; //#9180
    $_.raw = false; //#9181
    $_.newencoder = false; //#9182
    $_.parse = false; //#9183
    $_.parsefnc = false; //#9184
    $_.suppressc = false; //#9185
    $_.unlatchextbeforec = false; //#9186
    $_.modunit = 1; //#9197
    $k[$j++] = null; //#9199
    bwipp_processoptions(); //#9199
    var _4Y = $k[--$j]; //#9199
    $_.options = _4Y; //#9199
    var _4Z = $k[--$j]; //#9202
    $_.barcode = _4Z; //#9202
    if ($_.barcode.length > 500) { //#9206
        $k[$j++] = "bwipp.code128inputTooLong#9205"; //#9205
        $k[$j++] = "The input data is too long"; //#9205
        bwipp_raiseerror(); //#9205
    } //#9205
    $_._render = !($_.dontdraw || ($_.bwipp_dontdraw || bwipp_enabledontdraw)); //#9214
    $_.fncvals = new Map([
        ["parse", $_.parse],
        ["parsefnc", $_.parsefnc],
        ["FNC1", $_.code128_fn1],
        ["FNC2", $_.code128_fn2],
        ["FNC3", $_.code128_fn3],
        ["LNKA", $_.code128_lka],
        ["LNKC", $_.code128_lkc]
    ]); //#9232
    $k[$j++] = $_.barcode; //#9234
    $k[$j++] = $_.fncvals; //#9234
    bwipp_parseinput(); //#9234
    var _4h = $k[--$j]; //#9234
    $_.msg = _4h; //#9234
    $_.msglen = $_.msg.length; //#9235
    $_.encoding = "legacy"; //#9237
    if ($_.newencoder) { //#9238
        $_.encoding = "new"; //#9238
    } //#9238
    if ($_.raw) { //#9239
        $_.encoding = "raw"; //#9239
    } //#9239
    if ($eq($_.encoding, "raw")) { //#9267
        $_.cws = $a($_.barcode.length); //#9242
        $_.i = 0; //#9243
        $_.j = 0; //#9243
        for (;;) { //#9257
            if ($_.i >= ($_.barcode.length - 3)) { //#9245
                break; //#9245
            } //#9245
            if ($get($_.barcode, $_.i) != 94) { //#9246
                break; //#9246
            } //#9246
            var _4v = $geti($_.barcode, $_.i + 1, 3); //#9247
            $k[$j++] = _4v; //#9249
            $k[$j++] = false; //#9249
            for (var _4w = 0, _4x = _4v.length; _4w < _4x; _4w++) { //#9249
                var _4y = $get(_4v, _4w); //#9249
                if ((_4y < 48) || (_4y > 57)) { //#9248
                    $k[$j - 1] = true; //#9248
                } //#9248
            } //#9248
            var _4z = $k[--$j]; //#9249
            if (_4z) { //#9249
                $j--; //#9249
                break; //#9249
            } //#9249
            var _50 = $k[--$j]; //#9250
            $_.cw = $cvi(_50); //#9250
            if ($_.cw > 106) { //#9253
                $k[$j++] = "bwipp.code128BadRawCodeword#9252"; //#9252
                $k[$j++] = "Raw codewords must be 0 to 106"; //#9252
                bwipp_raiseerror(); //#9252
            } //#9252
            $put($_.cws, $_.j, $_.cw); //#9254
            $_.i = $_.i + 4; //#9255
            $_.j = $_.j + 1; //#9256
        } //#9256
        if ($_.i != $_.barcode.length) { //#9260
            $k[$j++] = "bwipp.code128BadRawFormat#9259"; //#9259
            $k[$j++] = "Raw codewords must be formatted as ^NNN"; //#9259
            bwipp_raiseerror(); //#9259
        } //#9259
        $_.cws = $geti($_.cws, 0, $_.j); //#9261
        $_.text = ""; //#9262
    } else { //#9267
        $_.text = $s($_.msglen); //#9264
        for (var _5G = 0, _5F = $_.msglen - 1; _5G <= _5F; _5G += 1) { //#9268
            $_.i = _5G; //#9266
            var _5L = $get($_.msg, $_.i); //#9267
            var _5O = $_.text; //#9267
            var _5N = $_.i; //#9267
            if (_5L < 0) { //#9267
                _5L = 32; //#9267
            } //#9267
            $put(_5O, _5N, _5L); //#9267
        } //#9267
    } //#9267
    if ($eq($_.encoding, "legacy")) { //#9519
        $_.seta = $_.seta_legacy; //#9274
        $_.setb = $_.setb_legacy; //#9275
        $_.setc = $_.setc_legacy; //#9276
        $k[$j++] = Infinity; //#9281
        for (var _5U = 0, _5V = $_.msglen; _5U < _5V; _5U++) { //#9281
            $k[$j++] = 0; //#9281
        } //#9281
        $k[$j++] = 0; //#9281
        $_.numSA = $a(); //#9281
        $k[$j++] = Infinity; //#9282
        for (var _5X = 0, _5Y = $_.msglen; _5X < _5Y; _5X++) { //#9282
            $k[$j++] = 0; //#9282
        } //#9282
        $k[$j++] = 0; //#9282
        $_.numEA = $a(); //#9282
        for (var _5a = $_.msglen - 1; _5a >= 0; _5a -= 1) { //#9292
            $_.i = _5a; //#9284
            if ($get($_.msg, $_.i) >= 0) { //#9291
                if ($get($_.msg, $_.i) >= 128) { //#9289
                    $put($_.numEA, $_.i, $get($_.numEA, $_.i + 1) + 1); //#9287
                } else { //#9289
                    $put($_.numSA, $_.i, $get($_.numSA, $_.i + 1) + 1); //#9289
                } //#9289
            } //#9289
        } //#9289
        $_.ea = false; //#9297
        $k[$j++] = Infinity; //#9298
        for (var _5t = 0, _5s = $_.msglen - 1; _5t <= _5s; _5t += 1) { //#9313
            $_.i = _5t; //#9300
            $_.c = $get($_.msg, $_.i); //#9301
            if ((!($_.ea != ($_.c < 128))) && ($_.c >= 0)) { //#9311
                var _64 = $_.ea ? $_.numSA : $_.numEA; //#9303
                var _65 = $get(_64, $_.i); //#9303
                var _68 = $f(_65 + $_.i) == $_.msglen ? 3 : 5; //#9304
                if (_65 < _68) { //#9309
                    $k[$j++] = $_.code128_fn4; //#9306
                } else { //#9309
                    $_.ea = !$_.ea; //#9309
                    $k[$j++] = $_.code128_fn4; //#9309
                    $k[$j++] = $_.code128_fn4; //#9309
                } //#9309
            } //#9309
            if ($_.c >= 0) { //#9312
                $k[$j++] = $_.c & 127; //#9312
            } else { //#9312
                $k[$j++] = $_.c; //#9312
            } //#9312
        } //#9312
        $astore($a($counttomark())); //#9314
        var _6F = $k[--$j]; //#9314
        $_.msg = _6F; //#9314
        $j--; //#9314
        $_.msglen = $_.msg.length; //#9315
        $k[$j++] = Infinity; //#9321
        for (var _6I = 0, _6J = $_.msglen + 1; _6I < _6J; _6I++) { //#9321
            $k[$j++] = 0; //#9321
        } //#9321
        $_.numsAtEven = $a(); //#9321
        $k[$j++] = Infinity; //#9322
        for (var _6L = 0, _6M = $_.msglen + 1; _6L < _6M; _6L++) { //#9322
            $k[$j++] = 0; //#9322
        } //#9322
        $_.numsAtOdd = $a(); //#9322
        for (var _6O = $_.msglen - 1; _6O >= 0; _6O -= 1) { //#9338
            $_.i = _6O; //#9324
            $_.c = $get($_.msg, $_.i); //#9325
            if ($_.c == $_.code128_fn1) { //#9335
                $put($_.numsAtEven, $_.i, 2 + $get($_.numsAtEven, $_.i + 1)); //#9327
                $put($_.numsAtOdd, $_.i, 0); //#9328
            } else { //#9335
                if (($_.c >= 48) && ($_.c <= 57)) { //#9335
                    $put($_.numsAtEven, $_.i, 1 + $get($_.numsAtOdd, $_.i + 1)); //#9331
                    $put($_.numsAtOdd, $_.i, 1 + $get($_.numsAtEven, $_.i + 1)); //#9332
                } else { //#9335
                    $put($_.numsAtEven, $_.i, 0); //#9334
                    $put($_.numsAtOdd, $_.i, 0); //#9335
                } //#9335
            } //#9335
        } //#9335
        $_.numsscr = function() {
            var _6r = $k[--$j]; //#9339
            $k[$j++] = $get($_.numsAtEven, _6r); //#9339
        }; //#9339
        $_.enca = function() {
            var _6u = $k[--$j]; //#9345
            $put($_.cws, $_.j, $get($_.seta, _6u)); //#9345
            $_.j = $_.j + 1; //#9346
        }; //#9346
        $_.encb = function() {
            var _70 = $k[--$j]; //#9349
            $put($_.cws, $_.j, $get($_.setb, _70)); //#9349
            $_.j = $_.j + 1; //#9350
        }; //#9350
        $_.encc = function() {
            var _75 = $k[$j - 1]; //#9353
            var _76 = $type(_75); //#9353
            if ($ne(_76, 'arraytype')) { //#9356
                var _78 = $k[--$j]; //#9354
                $k[$j++] = $get($_.setc, _78); //#9354
            } else { //#9356
                var _7A = $k[--$j]; //#9356
                $aload(_7A); //#9356
                var _7B = $k[--$j]; //#9356
                var _7C = $k[--$j]; //#9356
                $k[$j++] = $f(_7B - 48 + (_7C - 48) * 10) //#9356
            } //#9356
            var _7E = $k[--$j]; //#9358
            $put($_.cws, $_.j, _7E); //#9358
            $_.j = $_.j + 1; //#9359
        }; //#9359
        $_.anotb = function() {
            var _7H = $k[--$j]; //#9365
            $k[$j++] = $has($_.seta, _7H) && (!$has($_.setb, _7H)); //#9365
        }; //#9365
        $_.bnota = function() {
            var _7M = $k[--$j]; //#9366
            $k[$j++] = $has($_.setb, _7M) && (!$has($_.seta, _7M)); //#9366
        }; //#9366
        $k[$j++] = Infinity; //#9371
        for (var _7S = 0, _7T = $_.msg.length; _7S < _7T; _7S++) { //#9371
            $k[$j++] = 0; //#9371
        } //#9371
        $k[$j++] = 9999; //#9371
        $_.nextanotb = $a(); //#9371
        $k[$j++] = Infinity; //#9372
        for (var _7V = 0, _7W = $_.msg.length; _7V < _7W; _7V++) { //#9372
            $k[$j++] = 0; //#9372
        } //#9372
        $k[$j++] = 9999; //#9372
        $_.nextbnota = $a(); //#9372
        for (var _7Y = $_.msg.length - 1; _7Y >= 0; _7Y -= 1) { //#9385
            $_.i = _7Y; //#9374
            $k[$j++] = $get($_.msg, $_.i); //#9375
            $_.anotb(); //#9375
            var _7c = $k[--$j]; //#9379
            if (_7c) { //#9378
                $put($_.nextanotb, $_.i, 0); //#9376
            } else { //#9378
                $put($_.nextanotb, $_.i, $get($_.nextanotb, $_.i + 1) + 1); //#9378
            } //#9378
            $k[$j++] = $get($_.msg, $_.i); //#9380
            $_.bnota(); //#9380
            var _7n = $k[--$j]; //#9384
            if (_7n) { //#9383
                $put($_.nextbnota, $_.i, 0); //#9381
            } else { //#9383
                $put($_.nextbnota, $_.i, $get($_.nextbnota, $_.i + 1) + 1); //#9383
            } //#9383
        } //#9383
        $_.abeforeb = function() {
            var _7v = $k[--$j]; //#9390
            $k[$j++] = $lt($get($_.nextanotb, _7v), $get($_.nextbnota, _7v)); //#9390
        }; //#9390
        $_.bbeforea = function() {
            var _80 = $k[--$j]; //#9391
            $k[$j++] = $lt($get($_.nextbnota, _80), $get($_.nextanotb, _80)); //#9391
        }; //#9391
        $_.cws = $a(($_.barcode.length * 2) + 3); //#9393
        $_.j = 0; //#9398
        if ($_.msglen > 0) { //#9399
            $k[$j++] = 0; //#9399
            $_.numsscr(); //#9399
        } else { //#9399
            $k[$j++] = -1; //#9399
        } //#9399
        var _88 = $k[--$j]; //#9399
        $_.nums = _88; //#9399
        for (;;) { //#9424
            if ($_.msglen == 0) { //#9405
                $k[$j++] = $_.code128_stb; //#9402
                $_.enca(); //#9402
                $_.cset = "setb"; //#9403
                break; //#9404
            } //#9404
            if (($_.msglen == 2) && ($_.nums == 2)) { //#9410
                $k[$j++] = $_.code128_stc; //#9407
                $_.enca(); //#9407
                $_.cset = "setc"; //#9408
                break; //#9409
            } //#9409
            if ($_.nums >= 4) { //#9415
                $k[$j++] = $_.code128_stc; //#9412
                $_.enca(); //#9412
                $_.cset = "setc"; //#9413
                break; //#9414
            } //#9414
            $k[$j++] = 0; //#9416
            $_.abeforeb(); //#9416
            var _8D = $k[--$j]; //#9420
            if (_8D) { //#9420
                $k[$j++] = $_.code128_sta; //#9417
                $_.enca(); //#9417
                $_.cset = "seta"; //#9418
                break; //#9419
            } //#9419
            $k[$j++] = $_.code128_stb; //#9421
            $_.enca(); //#9421
            $_.cset = "setb"; //#9422
            break; //#9423
        } //#9423
        $_.i = 0; //#9429
        for (;;) { //#9516
            if ($_.i == $_.msglen) { //#9430
                break; //#9430
            } //#9430
            $k[$j++] = $_.i; //#9432
            $_.numsscr(); //#9432
            var _8H = $k[--$j]; //#9432
            $_.nums = _8H; //#9432
            for (;;) { //#9514
                if ((($eq($_.cset, "seta") || $eq($_.cset, "setb")) && ($_.nums >= 4)) && ($get($_.msg, $_.i) != $_.code128_fn1)) { //#9453
                    if (($_.nums % 2) == 0) { //#9450
                        $k[$j++] = $_.code128_swc; //#9441
                        if ($eq($_.cset, "seta")) { //#9441
                            $_.enca(); //#9441
                        } else { //#9441
                            $_.encb(); //#9441
                        } //#9441
                        $_.cset = "setc"; //#9442
                        break; //#9443
                    } else { //#9450
                        $k[$j++] = $get($_.msg, $_.i); //#9445
                        if ($eq($_.cset, "seta")) { //#9445
                            $_.enca(); //#9445
                        } else { //#9445
                            $_.encb(); //#9445
                        } //#9445
                        $_.i = $_.i + 1; //#9446
                        $k[$j++] = $_.i; //#9447
                        $_.numsscr(); //#9447
                        var _8W = $k[--$j]; //#9447
                        if (_8W >= 4) { //#9451
                            $k[$j++] = $_.code128_swc; //#9448
                            if ($eq($_.cset, "seta")) { //#9448
                                $_.enca(); //#9448
                            } else { //#9448
                                $_.encb(); //#9448
                            } //#9448
                            $_.cset = "setc"; //#9449
                            break; //#9450
                        } //#9450
                    } //#9450
                } //#9450
                $k[$j++] = $eq($_.cset, "setb"); //#9454
                $k[$j++] = $get($_.msg, $_.i); //#9454
                $_.anotb(); //#9454
                var _8c = $k[--$j]; //#9454
                var _8d = $k[--$j]; //#9454
                if (_8d && _8c) { //#9466
                    if ($_.i < ($_.msglen - 1)) { //#9462
                        $k[$j++] = $_.i + 1; //#9456
                        $_.bbeforea(); //#9456
                        var _8h = $k[--$j]; //#9461
                        if (_8h) { //#9461
                            $k[$j++] = $_.code128_sft; //#9457
                            $_.encb(); //#9457
                            $k[$j++] = $get($_.msg, $_.i); //#9458
                            $_.enca(); //#9458
                            $_.i = $_.i + 1; //#9459
                            break; //#9460
                        } //#9460
                    } //#9460
                    $k[$j++] = $_.code128_swa; //#9463
                    $_.encb(); //#9463
                    $_.cset = "seta"; //#9464
                    break; //#9465
                } //#9465
                $k[$j++] = $eq($_.cset, "seta"); //#9467
                $k[$j++] = $get($_.msg, $_.i); //#9467
                $_.bnota(); //#9467
                var _8q = $k[--$j]; //#9467
                var _8r = $k[--$j]; //#9467
                if (_8r && _8q) { //#9479
                    if ($_.i < ($_.msglen - 1)) { //#9475
                        $k[$j++] = $_.i + 1; //#9469
                        $_.abeforeb(); //#9469
                        var _8v = $k[--$j]; //#9474
                        if (_8v) { //#9474
                            $k[$j++] = $_.code128_sft; //#9470
                            $_.enca(); //#9470
                            $k[$j++] = $get($_.msg, $_.i); //#9471
                            $_.encb(); //#9471
                            $_.i = $_.i + 1; //#9472
                            break; //#9473
                        } //#9473
                    } //#9473
                    $k[$j++] = $_.code128_swb; //#9476
                    $_.enca(); //#9476
                    $_.cset = "setb"; //#9477
                    break; //#9478
                } //#9478
                if (($eq($_.cset, "setc") && ($_.nums < 2)) && (($get($_.msg, $_.i) > -1) || ($get($_.msg, $_.i) == $_.code128_fn4))) { //#9489
                    $k[$j++] = $_.i; //#9481
                    $_.abeforeb(); //#9481
                    var _99 = $k[--$j]; //#9485
                    if (_99) { //#9485
                        $k[$j++] = $_.code128_swa; //#9482
                        $_.encc(); //#9482
                        $_.cset = "seta"; //#9483
                        break; //#9484
                    } //#9484
                    $k[$j++] = $_.code128_swb; //#9486
                    $_.encc(); //#9486
                    $_.cset = "setb"; //#9487
                    break; //#9488
                } //#9488
                if ($eq($_.cset, "seta")) { //#9496
                    $k[$j++] = $get($_.msg, $_.i); //#9493
                    $_.enca(); //#9493
                    $_.i = $_.i + 1; //#9494
                    break; //#9495
                } //#9495
                if ($eq($_.cset, "setb")) { //#9501
                    $k[$j++] = $get($_.msg, $_.i); //#9498
                    $_.encb(); //#9498
                    $_.i = $_.i + 1; //#9499
                    break; //#9500
                } //#9500
                if ($eq($_.cset, "setc")) { //#9511
                    if ($get($_.msg, $_.i) <= -1) { //#9508
                        $k[$j++] = $get($_.msg, $_.i); //#9504
                        $_.encc(); //#9504
                        $_.i = $_.i + 1; //#9505
                    } else { //#9508
                        $k[$j++] = $geti($_.msg, $_.i, 2); //#9507
                        $_.encc(); //#9507
                        $_.i = $_.i + 2; //#9508
                    } //#9508
                    break; //#9510
                } //#9510
                break; //#9513
            } //#9513
        } //#9513
        $_.cws = $geti($_.cws, 0, $_.j); //#9517
    } //#9517
    if ($eq($_.encoding, "new")) { //#9668
        $_.seta = $_.code128_seta_new; //#9526
        $_.setb = $_.code128_setb_new; //#9527
        $_.setc = $_.code128_setc_new; //#9528
        $_.encode = $a([function() {
            $_.enc_a0(); //#9533
        }, function() {
            $_.enc_b0(); //#9533
        }, function() {
            $_.enc_c(); //#9533
        }, function() {
            $_.enc_a1(); //#9533
        }, function() {
            $_.enc_b1(); //#9533
        }, function() {
            $_.enc_c(); //#9533
        }]); //#9533
        $_.can_a = function() {
            if ($_.c >= 0) { //#9538
                $k[$j++] = true; //#9538
            } else { //#9538
                $k[$j++] = $has($_.seta, $_.c); //#9538
            } //#9538
        }; //#9538
        $_.can_b = function() {
            if ($_.c >= 0) { //#9539
                $k[$j++] = true; //#9539
            } else { //#9539
                $k[$j++] = $has($_.setb, $_.c); //#9539
            } //#9539
        }; //#9539
        $_.can_c0 = function() {
            if ($_.num_digits >= 2) { //#9540
                $k[$j++] = true; //#9540
            } else { //#9540
                $k[$j++] = $has($_.setc, $_.c); //#9540
            } //#9540
        }; //#9540
        $_.can_c1 = function() {
            if ($_.num_digits >= 2) { //#9541
                $k[$j++] = true; //#9541
            } else { //#9541
                $k[$j++] = $has($_.setc, $_.c); //#9541
            } //#9541
        }; //#9541
        if ($_.suppressc) { //#9546
            $_.can_c0 = function() {
                $k[$j++] = false; //#9546
            }; //#9546
        } //#9546
        if ($_.suppressc || $_.unlatchextbeforec) { //#9547
            $_.can_c1 = function() {
                $k[$j++] = false; //#9547
            }; //#9547
        } //#9547
        $_.out_a0 = function() {
            $k[$j++] = 1; //#9552
            if ($_.c >= 0) { //#9552
                if ($_.c >= 128) { //#9552
                    $k[$j - 1] += 1; //#9552
                } //#9552
                if (($_.c & 127) >= 96) { //#9552
                    $k[$j - 1] += 1; //#9552
                } //#9552
            } //#9552
        }; //#9552
        $_.out_a1 = function() {
            $k[$j++] = 1; //#9553
            if ($_.c >= 0) { //#9553
                if ($_.c < 128) { //#9553
                    $k[$j - 1] += 1; //#9553
                } //#9553
                if (($_.c & 127) >= 96) { //#9553
                    $k[$j - 1] += 1; //#9553
                } //#9553
            } //#9553
        }; //#9553
        $_.out_b0 = function() {
            $k[$j++] = 1; //#9554
            if ($_.c >= 0) { //#9554
                if ($_.c >= 128) { //#9554
                    $k[$j - 1] += 1; //#9554
                } //#9554
                if (($_.c & 127) < 32) { //#9554
                    $k[$j - 1] += 1; //#9554
                } //#9554
            } //#9554
        }; //#9554
        $_.out_b1 = function() {
            $k[$j++] = 1; //#9555
            if ($_.c >= 0) { //#9555
                if ($_.c < 128) { //#9555
                    $k[$j - 1] += 1; //#9555
                } //#9555
                if (($_.c & 127) < 32) { //#9555
                    $k[$j - 1] += 1; //#9555
                } //#9555
            } //#9555
        }; //#9555
        $_.map_ab = function() {
            var _AD = $k[$j - 1]; //#9560
            if (_AD < 32) { //#9560
                $k[$j - 1] += 64; //#9560
            } else { //#9560
                $k[$j - 1] -= 32; //#9560
            } //#9560
        }; //#9560
        $_.enc_a0 = function() {
            $k[$j++] = Infinity; //#9561
            if ($_.c < 0) { //#9561
                $k[$j++] = $get($_.seta, $_.c); //#9561
            } else { //#9561
                if ($_.c >= 128) { //#9561
                    $k[$j++] = 101; //#9561
                } //#9561
                var _AM = $_.c & 127; //#9561
                $k[$j++] = _AM; //#9561
                if (_AM >= 96) { //#9561
                    var _AN = $k[--$j]; //#9561
                    $k[$j++] = 98; //#9561
                    $k[$j++] = _AN; //#9561
                } //#9561
                $_.map_ab(); //#9561
            } //#9561
            var _AO = $a(); //#9561
            $k[$j++] = _AO; //#9561
        }; //#9561
        $_.enc_a1 = function() {
            $k[$j++] = Infinity; //#9562
            if ($_.c < 0) { //#9562
                $k[$j++] = $get($_.seta, $_.c); //#9562
            } else { //#9562
                if ($_.c < 128) { //#9562
                    $k[$j++] = 101; //#9562
                } //#9562
                var _AV = $_.c & 127; //#9562
                $k[$j++] = _AV; //#9562
                if (_AV >= 96) { //#9562
                    var _AW = $k[--$j]; //#9562
                    $k[$j++] = 98; //#9562
                    $k[$j++] = _AW; //#9562
                } //#9562
                $_.map_ab(); //#9562
            } //#9562
            var _AX = $a(); //#9562
            $k[$j++] = _AX; //#9562
        }; //#9562
        $_.enc_b0 = function() {
            $k[$j++] = Infinity; //#9563
            if ($_.c < 0) { //#9563
                $k[$j++] = $get($_.setb, $_.c); //#9563
            } else { //#9563
                if ($_.c >= 128) { //#9563
                    $k[$j++] = 100; //#9563
                } //#9563
                var _Ae = $_.c & 127; //#9563
                $k[$j++] = _Ae; //#9563
                if (_Ae < 32) { //#9563
                    var _Af = $k[--$j]; //#9563
                    $k[$j++] = 98; //#9563
                    $k[$j++] = _Af; //#9563
                } //#9563
                $_.map_ab(); //#9563
            } //#9563
            var _Ag = $a(); //#9563
            $k[$j++] = _Ag; //#9563
        }; //#9563
        $_.enc_b1 = function() {
            $k[$j++] = Infinity; //#9564
            if ($_.c < 0) { //#9564
                $k[$j++] = $get($_.setb, $_.c); //#9564
            } else { //#9564
                if ($_.c < 128) { //#9564
                    $k[$j++] = 100; //#9564
                } //#9564
                var _An = $_.c & 127; //#9564
                $k[$j++] = _An; //#9564
                if (_An < 32) { //#9564
                    var _Ao = $k[--$j]; //#9564
                    $k[$j++] = 98; //#9564
                    $k[$j++] = _Ao; //#9564
                } //#9564
                $_.map_ab(); //#9564
            } //#9564
            var _Ap = $a(); //#9564
            $k[$j++] = _Ap; //#9564
        }; //#9564
        $_.enc_c = function() {
            $k[$j++] = Infinity; //#9565
            if ($_.c < 0) { //#9565
                $k[$j++] = $get($_.setc, $_.c); //#9565
            } else { //#9565
                $k[$j++] = $f(($get($_.msg, $_.n) - 48) * 10 + ($get($_.msg, $_.n + 1) - 48)) //#9565
            } //#9565
            var _B0 = $a(); //#9565
            $k[$j++] = _B0; //#9565
        }; //#9565
        $_.get_best_prior_state = function() {
            var _B2 = $k[--$j]; //#9572
            var _B4 = $k[--$j]; //#9572
            $_.len = $f(_B4 + $get($_.bln_0, _B2)) //#9572
            var _B5 = $k[--$j]; //#9572
            $_.o = _B5; //#9572
            var _B7 = $k[--$j]; //#9573
            var _B9 = $k[--$j]; //#9573
            var _BA = $f(_B9 + $get($_.bln_0, _B7)); //#9573
            $k[$j++] = _BA; //#9573
            if (_BA < $_.len) { //#9573
                var _BC = $k[--$j]; //#9573
                $_.len = _BC; //#9573
                var _BD = $k[--$j]; //#9573
                $_.o = _BD; //#9573
            } else { //#9573
                $j -= 2; //#9573
            } //#9573
            var _BF = $k[--$j]; //#9574
            var _BH = $k[--$j]; //#9574
            var _BI = $f(_BH + $get($_.bln_0, _BF)); //#9574
            $k[$j++] = _BI; //#9574
            if (_BI < $_.len) { //#9574
                var _BK = $k[--$j]; //#9574
                $_.len = _BK; //#9574
                var _BL = $k[--$j]; //#9574
                $_.o = _BL; //#9574
            } else { //#9574
                $j -= 2; //#9574
            } //#9574
            var _BN = $k[--$j]; //#9575
            var _BP = $k[--$j]; //#9575
            var _BQ = $f(_BP + $get($_.bln_0, _BN)); //#9575
            $k[$j++] = _BQ; //#9575
            if (_BQ < $_.len) { //#9575
                var _BS = $k[--$j]; //#9575
                $_.len = _BS; //#9575
                var _BT = $k[--$j]; //#9575
                $_.o = _BT; //#9575
            } else { //#9575
                $j -= 2; //#9575
            } //#9575
            var _BV = $k[--$j]; //#9576
            var _BX = $k[--$j]; //#9576
            var _BY = $f(_BX + $get($_.bln_0, _BV)); //#9576
            $k[$j++] = _BY; //#9576
            if (_BY < $_.len) { //#9576
                var _Ba = $k[--$j]; //#9576
                $_.len = _Ba; //#9576
                var _Bb = $k[--$j]; //#9576
                $_.o = _Bb; //#9576
            } else { //#9576
                $j -= 2; //#9576
            } //#9576
            var _Bd = $k[--$j]; //#9577
            var _Bf = $k[--$j]; //#9577
            if ($f(_Bf + $get($_.bln_0, _Bd)) < $_.len) { //#9577
                var _Bh = $k[--$j]; //#9577
                $_.o = _Bh; //#9577
            } else { //#9577
                $j--; //#9577
            } //#9577
            $k[$j++] = $_.o; //#9578
        }; //#9578
        $_.bln_0 = $_.code128_start_length; //#9586
        $_.bln_1 = $_.code128_start_length; //#9586
        $k[$j++] = Infinity; //#9586
        for (var _Bj = 0; _Bj < 4; _Bj++) { //#9586
            $k[$j++] = $a([0, 0, 0, 0, 0, 0]); //#9586
        } //#9586
        $_.bln = $a(); //#9586
        $_.bps_0 = $_.code128_start_state; //#9587
        $_.bps_1 = $_.code128_start_state; //#9587
        $k[$j++] = Infinity; //#9587
        for (var _Bl = 0; _Bl < 4; _Bl++) { //#9587
            $k[$j++] = $a([0, 0, 0, 0, 0, 0]); //#9587
        } //#9587
        $_.bps = $a(); //#9587
        $k[$j++] = Infinity; //#9592
        for (var _Bo = 0, _Bp = $_.msg.length; _Bo < _Bp; _Bo++) { //#9592
            $k[$j++] = $a([0, 0, 0, 0, 0, 0]); //#9592
        } //#9592
        $_.path = $a(); //#9592
        $_.make_tables = function() {
            $_.num_digits = 0; //#9595
            for (var _Bt = 0, _Bs = $_.msg.length - 1; _Bt <= _Bs; _Bt += 1) { //#9636
                $_.n = _Bt; //#9597
                $_.c = $get($_.msg, $_.n); //#9598
                var _C0 = ($_.c >= 48) && ($_.c < 58) ? $_.num_digits + 1 : 0; //#9603
                $_.num_digits = _C0; //#9603
                $_.bln_2 = $_.bln_1; //#9608
                $_.bln_1 = $_.bln_0; //#9608
                $_.bln_0 = $get($_.bln, $_.n & 3); //#9608
                $_.bps_2 = $_.bps_1; //#9609
                $_.bps_1 = $_.bps_0; //#9609
                $_.bps_0 = $get($_.bps, $_.n & 3); //#9609
                var _CF = $_.num_digits >= 2 ? $_.bps_2 : $_.bps_1; //#9614
                $_.bps_c = _CF; //#9614
                var _CK = $_.num_digits >= 2 ? $_.bln_2 : $_.bln_1; //#9615
                $_.bln_c = _CK; //#9615
                $k[$j++] = $_.bln_0; //#9620
                $k[$j++] = 0; //#9620
                $_.can_a(); //#9620
                var _CN = $k[--$j]; //#9620
                if (_CN) { //#9620
                    $_.p = $get($_.bps_1, 0); //#9620
                    $put($get($_.path, $_.n), 0, $_.p); //#9620
                    $k[$j++] = $f($get($_.bln_1, $_.p) + $get($_.code128_latch_length_a0, $_.p)) //#9620
                    $_.out_a0(); //#9620
                    var _CZ = $k[--$j]; //#9620
                    var _Ca = $k[--$j]; //#9620
                    $k[$j++] = $f(_Ca + _CZ) //#9620
                } else { //#9620
                    $k[$j++] = $_.code128_max_int; //#9620
                } //#9620
                var _Cb = $k[--$j]; //#9620
                var _Cc = $k[--$j]; //#9620
                var _Cd = $k[--$j]; //#9620
                $put(_Cd, _Cc, _Cb); //#9620
                $k[$j++] = $_.bln_0; //#9621
                $k[$j++] = 3; //#9621
                $_.can_a(); //#9621
                var _Cf = $k[--$j]; //#9621
                if (_Cf) { //#9621
                    $_.p = $get($_.bps_1, 3); //#9621
                    $put($get($_.path, $_.n), 3, $_.p); //#9621
                    $k[$j++] = $f($get($_.bln_1, $_.p) + $get($_.code128_latch_length_a1, $_.p)) //#9621
                    $_.out_a1(); //#9621
                    var _Cr = $k[--$j]; //#9621
                    var _Cs = $k[--$j]; //#9621
                    $k[$j++] = $f(_Cs + _Cr) //#9621
                } else { //#9621
                    $k[$j++] = $_.code128_max_int; //#9621
                } //#9621
                var _Ct = $k[--$j]; //#9621
                var _Cu = $k[--$j]; //#9621
                var _Cv = $k[--$j]; //#9621
                $put(_Cv, _Cu, _Ct); //#9621
                $k[$j++] = $_.bln_0; //#9622
                $k[$j++] = 1; //#9622
                $_.can_b(); //#9622
                var _Cx = $k[--$j]; //#9622
                if (_Cx) { //#9622
                    $_.p = $get($_.bps_1, 1); //#9622
                    $put($get($_.path, $_.n), 1, $_.p); //#9622
                    $k[$j++] = $f($get($_.bln_1, $_.p) + $get($_.code128_latch_length_b0, $_.p)) //#9622
                    $_.out_b0(); //#9622
                    var _D9 = $k[--$j]; //#9622
                    var _DA = $k[--$j]; //#9622
                    $k[$j++] = $f(_DA + _D9) //#9622
                } else { //#9622
                    $k[$j++] = $_.code128_max_int; //#9622
                } //#9622
                var _DB = $k[--$j]; //#9622
                var _DC = $k[--$j]; //#9622
                var _DD = $k[--$j]; //#9622
                $put(_DD, _DC, _DB); //#9622
                $k[$j++] = $_.bln_0; //#9623
                $k[$j++] = 4; //#9623
                $_.can_b(); //#9623
                var _DF = $k[--$j]; //#9623
                if (_DF) { //#9623
                    $_.p = $get($_.bps_1, 4); //#9623
                    $put($get($_.path, $_.n), 4, $_.p); //#9623
                    $k[$j++] = $f($get($_.bln_1, $_.p) + $get($_.code128_latch_length_b1, $_.p)) //#9623
                    $_.out_b1(); //#9623
                    var _DR = $k[--$j]; //#9623
                    var _DS = $k[--$j]; //#9623
                    $k[$j++] = $f(_DS + _DR) //#9623
                } else { //#9623
                    $k[$j++] = $_.code128_max_int; //#9623
                } //#9623
                var _DT = $k[--$j]; //#9623
                var _DU = $k[--$j]; //#9623
                var _DV = $k[--$j]; //#9623
                $put(_DV, _DU, _DT); //#9623
                $k[$j++] = $_.bln_0; //#9624
                $k[$j++] = 2; //#9624
                $_.can_c0(); //#9624
                var _DX = $k[--$j]; //#9624
                if (_DX) { //#9624
                    $_.p = $get($_.bps_c, 2); //#9624
                    $put($get($_.path, $_.n), 2, $_.p); //#9624
                    $k[$j++] = $f($get($_.bln_c, $_.p) + $get($_.code128_latch_length_c0, $_.p)) + 1 //#9624
                } else { //#9624
                    $k[$j++] = $_.code128_max_int; //#9624
                } //#9624
                var _Dj = $k[--$j]; //#9624
                var _Dk = $k[--$j]; //#9624
                var _Dl = $k[--$j]; //#9624
                $put(_Dl, _Dk, _Dj); //#9624
                $k[$j++] = $_.bln_0; //#9625
                $k[$j++] = 5; //#9625
                $_.can_c1(); //#9625
                var _Dn = $k[--$j]; //#9625
                if (_Dn) { //#9625
                    $_.p = $get($_.bps_c, 5); //#9625
                    $put($get($_.path, $_.n), 5, $_.p); //#9625
                    $k[$j++] = $f($get($_.bln_c, $_.p) + $get($_.code128_latch_length_c1, $_.p)) + 1 //#9625
                } else { //#9625
                    $k[$j++] = $_.code128_max_int; //#9625
                } //#9625
                var _Dz = $k[--$j]; //#9625
                var _E0 = $k[--$j]; //#9625
                var _E1 = $k[--$j]; //#9625
                $put(_E1, _E0, _Dz); //#9625
                $k[$j++] = $_.bps_0; //#9630
                $k[$j++] = 0; //#9630
                $aload($_.code128_prioritized_latch_length_a0); //#9630
                $_.get_best_prior_state(); //#9630
                var _E3 = $k[--$j]; //#9630
                var _E4 = $k[--$j]; //#9630
                var _E5 = $k[--$j]; //#9630
                $put(_E5, _E4, _E3); //#9630
                $k[$j++] = $_.bps_0; //#9631
                $k[$j++] = 3; //#9631
                $aload($_.code128_prioritized_latch_length_a1); //#9631
                $_.get_best_prior_state(); //#9631
                var _E7 = $k[--$j]; //#9631
                var _E8 = $k[--$j]; //#9631
                var _E9 = $k[--$j]; //#9631
                $put(_E9, _E8, _E7); //#9631
                $k[$j++] = $_.bps_0; //#9632
                $k[$j++] = 1; //#9632
                $aload($_.code128_prioritized_latch_length_b0); //#9632
                $_.get_best_prior_state(); //#9632
                var _EB = $k[--$j]; //#9632
                var _EC = $k[--$j]; //#9632
                var _ED = $k[--$j]; //#9632
                $put(_ED, _EC, _EB); //#9632
                $k[$j++] = $_.bps_0; //#9633
                $k[$j++] = 4; //#9633
                $aload($_.code128_prioritized_latch_length_b1); //#9633
                $_.get_best_prior_state(); //#9633
                var _EF = $k[--$j]; //#9633
                var _EG = $k[--$j]; //#9633
                var _EH = $k[--$j]; //#9633
                $put(_EH, _EG, _EF); //#9633
                $k[$j++] = $_.bps_0; //#9634
                $k[$j++] = 2; //#9634
                $aload($_.code128_prioritized_latch_length_c0); //#9634
                $_.get_best_prior_state(); //#9634
                var _EJ = $k[--$j]; //#9634
                var _EK = $k[--$j]; //#9634
                var _EL = $k[--$j]; //#9634
                $put(_EL, _EK, _EJ); //#9634
                $k[$j++] = $_.bps_0; //#9635
                $k[$j++] = 5; //#9635
                $aload($_.code128_prioritized_latch_length_c1); //#9635
                $_.get_best_prior_state(); //#9635
                var _EN = $k[--$j]; //#9635
                var _EO = $k[--$j]; //#9635
                var _EP = $k[--$j]; //#9635
                $put(_EP, _EO, _EN); //#9635
            } //#9635
        }; //#9635
        $_.backtrack = function() {
            $_.n = $_.msg.length; //#9640
            for (var _ER = 0, _ES = $_.code128_reverse_priority.length; _ER < _ES; _ER++) { //#9645
                var _ET = $get($_.code128_reverse_priority, _ER); //#9645
                var _EV = $get($_.bln_0, _ET); //#9645
                $k[$j++] = _ET; //#9645
                $k[$j++] = _EV; //#9645
                $k[$j++] = _EV; //#9645
            } //#9645
            $j--; //#9646
            var _EW = $k[--$j]; //#9646
            $_.len = _EW; //#9646
            var _EX = $k[--$j]; //#9646
            $_.state = _EX; //#9646
            for (var _EY = 0; _EY < 5; _EY++) { //#9647
                var _Ea = $k[--$j]; //#9647
                if ($lt(_Ea, $_.len)) { //#9647
                    var _Eb = $k[--$j]; //#9647
                    $_.len = _Eb; //#9647
                    var _Ec = $k[--$j]; //#9647
                    $_.state = _Ec; //#9647
                } else { //#9647
                    $j -= 2; //#9647
                } //#9647
            } //#9647
            $k[$j++] = $a($_.len); //#9660
            for (;;) { //#9660
                if ($_.n <= 0) { //#9651
                    break; //#9651
                } //#9651
                $_.prior_state = $get($get($_.path, $_.n - 1), $_.state); //#9652
                $k[$j++] = Infinity; //#9653
                $forall($get($get($_.code128_latch_sequence, $_.state), $_.prior_state)); //#9653
                $_.latch = $a(); //#9653
                var _Ev = ((($_.state == 2) || ($_.state == 5)) && ($get($_.msg, $_.n - 1) >= 48)) ? 2 : 1; //#9654
                $_.n = $_.n - _Ev; //#9654
                $_.c = $get($_.msg, $_.n); //#9655
                $k[$j++] = 'enc'; //#9656
                if ($get($_.encode, $_.state)() === true) {
                    break;
                } //#9656
                var _F2 = $k[--$j]; //#9656
                var _F3 = $k[--$j]; //#9656
                $_[_F3] = _F2; //#9656
                $_.len = $f($_.len - $_.latch.length - $_.enc.length) //#9657
                var _F7 = $k[--$j]; //#9658
                var _F8 = $_.len; //#9658
                var _F9 = $_.latch; //#9658
                $puti(_F7, _F8, _F9); //#9658
                $puti(_F7, $f(_F8 + _F9.length), $_.enc) //#9658
                $_.state = $_.prior_state; //#9659
                $k[$j++] = _F7; //#9659
            } //#9659
            var _FC = $k[$j - 1]; //#9661
            $put(_FC, 0, $get($_.code128_start_code, $_.state)); //#9661
        }; //#9661
        $_.make_tables(); //#9664
        $_.backtrack(); //#9664
        var _FF = $k[--$j]; //#9666
        $_.cws = _FF; //#9666
    } //#9666
    $_.j = $_.cws.length; //#9673
    var _FI = $a($_.j + 2); //#9674
    $puti(_FI, 0, $_.cws); //#9674
    $_.cws = _FI; //#9674
    $_.csum = $get($_.cws, 0); //#9675
    for (var _FO = 1, _FN = $_.j - 1; _FO <= _FN; _FO += 1) { //#9679
        $_.i = _FO; //#9677
        $_.csum = $f($_.csum + $get($_.cws, $_.i) * $_.i) //#9678
    } //#9678
    $_.csum = $_.csum % 103; //#9680
    $put($_.cws, $_.j, $_.csum); //#9681
    $put($_.cws, $_.j + 1, 106); //#9682
    if ($has($_.options, 'debugcws')) { //#9686
        $k[$j++] = "bwipp.debugcws#9686"; //#9686
        $k[$j++] = $_.cws; //#9686
        bwipp_raiseerror(); //#9686
    } //#9686
    $_.sbs = $s(($_.cws.length * 6) + 1); //#9692
    for (var _Fh = 0, _Fg = $_.cws.length - 1; _Fh <= _Fg; _Fh += 1) { //#9696
        $_.i = _Fh; //#9694
        $puti($_.sbs, $_.i * 6, $get($_.code128_encs, $get($_.cws, $_.i))); //#9695
    } //#9695
    $k[$j++] = Infinity; //#9698
    var _Fo = $_.sbs; //#9698
    for (var _Fp = 0, _Fq = _Fo.length; _Fp < _Fq; _Fp++) { //#9698
        $k[$j++] = $get(_Fo, _Fp) - 48; //#9698
    } //#9698
    $_.sbs = $a(); //#9698
    if ($_.height == -1) { //#9700
        $_.height = 1; //#9700
    } //#9700
    $k[$j++] = Infinity; //#9702
    var _Ft = $_.sbs; //#9704
    var _Fy = []; //#9705
    for (var _Fv = 0, _Fw = ~~(($_.sbs.length + 1) / 2); _Fv < _Fw; _Fv++) { //#9705
        _Fy[_Fv] = $_.height; //#9705
    } //#9705
    _Fy = $a(_Fy); //#9705
    var _G2 = []; //#9706
    for (var _G0 = 0, _G1 = ~~(($_.sbs.length + 1) / 2); _G0 < _G1; _G0++) { //#9706
        _G2[_G0] = 0; //#9706
    } //#9706
    _G2 = $a(_G2); //#9706
    $k[$j++] = 'ren'; //#9715
    $k[$j++] = 'renlinear'; //#9715
    $k[$j++] = 'sbs'; //#9715
    $k[$j++] = _Ft; //#9715
    $k[$j++] = 'bhs'; //#9715
    $k[$j++] = _Fy; //#9715
    $k[$j++] = 'bbs'; //#9715
    $k[$j++] = _G2; //#9715
    $k[$j++] = 'txt'; //#9715
    $k[$j++] = $a([$a([$_.text, $_.text1xoffset, $_.text1yoffset, $_.text1font, $_.text1size])]); //#9715
    $k[$j++] = 'text1xalign'; //#9715
    $k[$j++] = "center"; //#9715
    $k[$j++] = 'opt'; //#9715
    $k[$j++] = $_.options; //#9715
    var _GB = $d(); //#9715
    $k[$j++] = _GB; //#9718
    if ($_._render) { //#9718
        bwipp_renlinear(); //#9718
    } //#9718
    $_ = $__; //#9721
} //bwipp_code128
function bwipp_gs1_128() {
    var $__ = $_; //#9757
    $_ = Object.assign({}, $_, bwipp_gs1_128.globals); //#9757
    $_.dontdraw = false; //#9760
    $_.includetext = false; //#9761
    $_.text1font = "OCR-B"; //#9762
    $_.text1size = 10; //#9763
    $_.text1xoffset = 0; //#9764
    $_.textyoffset = -8; //#9765
    $_.height = -1; //#9766
    $_.width = 0; //#9767
    $_.linkagea = false; //#9768
    $_.linkagec = false; //#9769
    $_.parse = false; //#9770
    $_.dontlint = false; //#9771
    $_.lintreqs = false; //#9772
    $_.modunit = 1; //#9783
    $k[$j++] = null; //#9785
    bwipp_processoptions(); //#9785
    var _0 = $k[--$j]; //#9785
    $_.options = _0; //#9785
    var _1 = $k[--$j]; //#9788
    $_.barcode = _1; //#9788
    if ($_.barcode.length > 500) { //#9792
        $k[$j++] = "bwipp.gs1128inputTooLong#9791"; //#9791
        $k[$j++] = "The input data is too long"; //#9791
        bwipp_raiseerror(); //#9791
    } //#9791
    $_._render = !($_.dontdraw || ($_.bwipp_dontdraw || bwipp_enabledontdraw)); //#9794
    if ($_.linkagea && $_.linkagec) { //#9801
        $k[$j++] = "bwipp.gs1128badLinkage#9800"; //#9800
        $k[$j++] = "linkagea and linkagec cannot be used together"; //#9800
        bwipp_raiseerror(); //#9800
    } //#9800
    $_.text = $_.barcode; //#9803
    $k[$j++] = $_.barcode; //#9805
    $k[$j++] = 'ai'; //#9805
    bwipp_gs1process(); //#9805
    var _9 = $k[--$j]; //#9806
    $_.fncs = _9; //#9806
    var _A = $k[--$j]; //#9807
    $_.vals = _A; //#9807
    var _B = $k[--$j]; //#9808
    $_.ais = _B; //#9808
    $_.fnc1 = -1; //#9813
    $k[$j++] = Infinity; //#9814
    $k[$j++] = $_.fnc1; //#9822
    for (var _F = 0, _E = $_.ais.length - 1; _F <= _E; _F += 1) { //#9822
        $_.i = _F; //#9816
        $forall($get($_.ais, $_.i)); //#9817
        $forall($get($_.vals, $_.i)); //#9818
        if (($_.i != ($_.ais.length - 1)) && $get($_.fncs, $_.i)) { //#9821
            $k[$j++] = $_.fnc1; //#9820
        } //#9820
    } //#9820
    $astore($a($counttomark())); //#9823
    var _U = $k[--$j]; //#9823
    $_.c128 = _U; //#9823
    $j--; //#9823
    $_.barcode = $s(($_.c128.length + 1) * 5); //#9828
    $_.j = 0; //#9829
    $forall($_.c128, function() { //#9838
        var _Y = $k[$j - 1]; //#9831
        if (_Y == $_.fnc1) { //#9836
            $j--; //#9832
            $puti($_.barcode, $_.j, "^FNC1"); //#9832
            $_.j = $_.j + 5; //#9833
        } else { //#9836
            var _e = $k[--$j]; //#9835
            $put($_.barcode, $_.j, _e); //#9835
            $_.j = $_.j + 1; //#9836
        } //#9836
    }); //#9836
    if ($_.linkagea || $_.linkagec) { //#9842
        var _o = $_.barcode; //#9840
        var _n = $_.j; //#9840
        var _m = $_.linkagea ? "^LNKA" : "^LNKC"; //#9840
        $puti(_o, _n, _m); //#9840
        $_.j = $_.j + 5; //#9841
    } //#9841
    $_.barcode = $geti($_.barcode, 0, $_.j); //#9843
    if ($_.height == -1) { //#9850
        if (!($_.propspec && ($_.hnom != -1))) { //#9850
            $_.height = 0.5; //#9850
        } //#9850
    } //#9850
    $del($_.options, "parse") //#9855
    $put($_.options, "height", $_.height); //#9856
    $put($_.options, "parsefnc", true); //#9857
    $_.bwipp_dontdraw = true; //#9870
    $k[$j++] = $_.barcode; //#9871
    $k[$j++] = $_.options; //#9871
    bwipp_code128(); //#9871
    var _12 = $k[--$j]; //#9871
    $_.args = _12; //#9871
    $put($_.args, "txt", $a([$a([$_.text, $_.text1xoffset, $_.text1yoffset, $_.text1font, $_.text1size])])); //#9873
    $put($_.args, "text1xalign", "center"); //#9874
    $put($_.args, "opt", $_.options); //#9875
    $k[$j++] = $_.args; //#9878
    if ($_._render) { //#9878
        bwipp_renlinear(); //#9878
    } //#9878
    $_ = $__; //#9881
} //bwipp_gs1_128
function bwipp_renderguards() {
    var _0 = $k[--$j]; //#41289
    $_.pixx = _0; //#41289
    if (($_.guardwidth < 0) || ($_.guardwidth > 20)) { //#41293
        $k[$j++] = "bwipp.renderBadGuardwidth#41292"; //#41292
        $k[$j++] = "guardwidth must be from 0 to 20"; //#41292
        bwipp_raiseerror(); //#41292
    } //#41292
    if (($_.guardheight < 0) || ($_.guardheight > 20)) { //#41297
        $k[$j++] = "bwipp.renderBadGuardheight#41296"; //#41296
        $k[$j++] = "guardheight must be from 0 to 20"; //#41296
        bwipp_raiseerror(); //#41296
    } //#41296
    if (($_.guardleftpos < -50) || ($_.guardleftpos > 150)) { //#41301
        $k[$j++] = "bwipp.renderBadGuardleftpos#41300"; //#41300
        $k[$j++] = "guardleftpos must be from -50 to 150"; //#41300
        bwipp_raiseerror(); //#41300
    } //#41300
    if (($_.guardleftypos < -50) || ($_.guardleftypos > 150)) { //#41305
        $k[$j++] = "bwipp.renderBadGuardleftypos#41304"; //#41304
        $k[$j++] = "guardleftypos must be from -50 to 150"; //#41304
        bwipp_raiseerror(); //#41304
    } //#41304
    if (($_.guardrightpos < -50) || ($_.guardrightpos > 150)) { //#41309
        $k[$j++] = "bwipp.renderBadGuardrightpos#41308"; //#41308
        $k[$j++] = "guardrightpos must be from -50 to 150"; //#41308
        bwipp_raiseerror(); //#41308
    } //#41308
    if (($_.guardrightypos < -50) || ($_.guardrightypos > 150)) { //#41313
        $k[$j++] = "bwipp.renderBadGuardrightypos#41312"; //#41312
        $k[$j++] = "guardrightypos must be from -50 to 150"; //#41312
        bwipp_raiseerror(); //#41312
    } //#41312
    if ($_.guardwhitespace) { //#41325
        $$.selectfont("OCR-B", $_.guardheight * 2); //#41316
        if ($_.guardleftpos != 0) { //#41320
            $$.moveto(-$_.guardleftpos - 2, $f($_.guardleftypos - $_.guardheight / 2 - 1.25)) //#41318
            $$.show("<", 0, 0); //#41319
        } //#41319
        if ($_.guardrightpos != 0) { //#41324
            $$.moveto($f($_.guardrightpos + $_.pixx - $_.guardwidth) - 1, $f($_.guardrightypos - $_.guardheight / 2 - 1.25)) //#41322
            $$.show(">", 0, 0); //#41323
        } //#41323
    } //#41323
} //bwipp_renderguards
function bwipp_rendertext() {
    if (!bwipp_rendertext.globals) {
        var $__ = $_;
        $_ = bwipp_rendertext.globals = {};
        //#41338
        var _G = new Map([
            ["offleft", function() {
                $k[$j++] = $f(-$_.tw - $_.nudge) //#41345
            }],
            ["below", function() {
                $k[$j++] = $f(-$_.th - $_.nudge) //#41345
            }],
            ["left", function() {
                $k[$j++] = 0; //#41346
            }],
            ["bottom", function() {
                $k[$j++] = 0; //#41346
            }],
            ["xcenter", function() {
                $k[$j++] = $f($_.pixx - $_.tw) / 2 //#41347
            }],
            ["ycenter", function() {
                $k[$j++] = $f($_.pixy - $_.th) / 2 //#41347
            }],
            ["right", function() {
                $k[$j++] = $f($_.pixx - $_.tw) //#41348
            }],
            ["top", function() {
                $k[$j++] = $f($_.pixy - $_.th) //#41348
            }],
            ["offright", function() {
                $k[$j++] = $f($_.pixx + $_.nudge) //#41349
            }],
            ["above", function() {
                $k[$j++] = $f($_.pixy + $_.nudge) //#41349
            }]
        ]); //#41349
        var _X = new Map([
            ["offleft", function() {
                $k[$j++] = 0 - $_.nudge; //#41352
            }],
            ["below", function() {
                $k[$j++] = 0 - $_.nudge; //#41352
            }],
            ["left", function() {
                $k[$j++] = $_.tw; //#41353
            }],
            ["bottom", function() {
                $k[$j++] = $_.th; //#41353
            }],
            ["xcenter", function() {
                $k[$j++] = $f($_.pixx + $_.tw) / 2 //#41354
            }],
            ["ycenter", function() {
                $k[$j++] = $f($_.pixy + $_.th) / 2 //#41354
            }],
            ["right", function() {
                $k[$j++] = $_.pixx; //#41355
            }],
            ["top", function() {
                $k[$j++] = $_.pixy; //#41355
            }],
            ["offright", function() {
                $k[$j++] = $f($_.pixx + $_.tw + $_.nudge) //#41356
            }],
            ["above", function() {
                $k[$j++] = $f($_.pixy + $_.th + $_.nudge) //#41356
            }]
        ]); //#41356
        var _o = new Map([
            ["offleft", function() {
                $k[$j++] = 0 - $_.nudge; //#41359
            }],
            ["below", function() {
                $k[$j++] = $f(-$_.tw - $_.nudge) //#41359
            }],
            ["left", function() {
                $k[$j++] = $_.th; //#41360
            }],
            ["bottom", function() {
                $k[$j++] = 0; //#41360
            }],
            ["xcenter", function() {
                $k[$j++] = $f($_.pixx + $_.th) / 2 //#41361
            }],
            ["ycenter", function() {
                $k[$j++] = $f($_.pixy - $_.tw) / 2 //#41361
            }],
            ["right", function() {
                $k[$j++] = $_.pixx; //#41362
            }],
            ["top", function() {
                $k[$j++] = $f($_.pixy - $_.tw) //#41362
            }],
            ["offright", function() {
                $k[$j++] = $f($_.pixx + $_.th + $_.nudge) //#41363
            }],
            ["above", function() {
                $k[$j++] = $f($_.pixy + $_.nudge) //#41363
            }]
        ]); //#41363
        var _15 = new Map([
            ["offleft", function() {
                $k[$j++] = $f(-$_.th - $_.nudge) //#41366
            }],
            ["below", function() {
                $k[$j++] = 0 - $_.nudge; //#41366
            }],
            ["left", function() {
                $k[$j++] = 0; //#41367
            }],
            ["bottom", function() {
                $k[$j++] = $_.tw; //#41367
            }],
            ["xcenter", function() {
                $k[$j++] = $f($_.pixx - $_.th) / 2 //#41368
            }],
            ["ycenter", function() {
                $k[$j++] = $f($_.pixy + $_.tw) / 2 //#41368
            }],
            ["right", function() {
                $k[$j++] = $f($_.pixx - $_.th) //#41369
            }],
            ["top", function() {
                $k[$j++] = $_.pixy; //#41369
            }],
            ["offright", function() {
                $k[$j++] = $f($_.pixx + $_.nudge) //#41370
            }],
            ["above", function() {
                $k[$j++] = $f($_.pixy + $_.tw + $_.nudge) //#41370
            }]
        ]); //#41370
        var _16 = new Map([
            ["forward", _G],
            ["backward", _X],
            ["upward", _o],
            ["downward", _15]
        ]); //#41370
        $_.rendertext_positions = _16; //#41372
        $_ = $__;
    }
    //#41379
    var $__ = $_; //#41382
    $_ = Object.assign({}, $_, bwipp_rendertext.globals); //#41382
    $splay(); //#41382
    var _17 = $k[--$j]; //#41384
    $_.grp = _17; //#41384
    var _18 = $k[--$j]; //#41385
    $_.pixy = _18; //#41385
    var _19 = $k[--$j]; //#41386
    $_.pixx = _19; //#41386
    $_.makeerr = function() {
        var _1A = $k[--$j]; //#41390
        $_.makeerr_msg = _1A; //#41390
        var _1B = $k[--$j]; //#41391
        $_.makeerr_name = $cvs($s(128), _1B); //#41391
        if ($_.grp == 1) { //#41399
            $k[$j++] = "text"; //#41394
        } else { //#41399
            if ($_.grp == 2) { //#41399
                $k[$j++] = "extratext"; //#41397
            } else { //#41399
                var _1F = $s(5); //#41399
                $puti(_1F, 0, "text"); //#41399
                $put(_1F, 4, $_.grp + 48); //#41399
                $k[$j++] = _1F; //#41399
            } //#41399
        } //#41399
        var _1H = $k[--$j]; //#41401
        $_.makeerr_pfx = _1H; //#41401
        var _1K = $s(($_.makeerr_pfx.length + 6) + $_.makeerr_name.length); //#41403
        $puti(_1K, 0, "bwipp."); //#41404
        $puti(_1K, 6, $_.makeerr_pfx); //#41405
        $puti(_1K, $_.makeerr_pfx.length + 6, $_.makeerr_name); //#41406
        var _1Q = $s($_.makeerr_pfx.length + $_.makeerr_msg.length); //#41409
        $puti(_1Q, 0, $_.makeerr_pfx); //#41410
        $puti(_1Q, $_.makeerr_pfx.length, $_.makeerr_msg); //#41411
        $k[$j++] = _1K; //#41411
        $k[$j++] = _1Q; //#41411
    }; //#41411
    $_.positiontext = function() {
        var _1U = $k[--$j]; //#41416
        $_.th = _1U; //#41416
        var _1V = $k[--$j]; //#41417
        $_.tw = _1V; //#41417
        $_.nudge = 1; //#41418
        var _1W = $k[--$j]; //#41419
        var _1X = $get($_.rendertext_positions, _1W); //#41419
        $k[$j++] = _1X; //#41420
        $k[$j++] = _1X; //#41420
        $r(4, -1); //#41420
        var _1Y = $k[$j - 1]; //#41420
        if ($eq(_1Y, "center")) { //#41420
            $k[$j - 1] = "xcenter"; //#41420
        } //#41420
        var _1Z = $k[--$j]; //#41420
        var _1a = $k[--$j]; //#41420
        if ($get(_1a, _1Z)() === true) {
            return true;
        } //#41420
        var _1c = $k[--$j]; //#41420
        var _1d = $k[--$j]; //#41420
        $k[$j++] = _1c; //#41421
        $k[$j++] = _1d; //#41421
        $r(3, -1); //#41421
        var _1e = $k[$j - 1]; //#41421
        if ($eq(_1e, "center")) { //#41421
            $k[$j - 1] = "ycenter"; //#41421
        } //#41421
        var _1f = $k[--$j]; //#41421
        var _1g = $k[--$j]; //#41421
        if ($get(_1g, _1f)() === true) {
            return true;
        } //#41421
    }; //#41421
    for (var _1i = 0; _1i < 1; _1i++) { //#41573
        if (((($_.txt.length > 0) && $eq($_.xalign, "unset")) && $eq($_.yalign, "unset")) && ($_.content.length == 0)) { //#41458
            if ($ne($_.color, "unset")) { //#41431
                $$.setcolor($_.color); //#41431
            } //#41431
            $_.s = 0; //#41433
            $_.fn = ""; //#41433
            $_.xoff = 0; //#41433
            $_.yoff = 0; //#41433
            try { //#41452
                $forall($_.txt, function() { //#41451
                    var _1q = $k[--$j]; //#41436
                    $aload(_1q); //#41436
                    var _1r = $k[$j - 1]; //#41437
                    var _1s = $k[$j - 2]; //#41437
                    if ((_1r != $_.s) || $ne(_1s, $_.fn)) { //#41448
                        var _1v = $k[$j - 1]; //#41438
                        if (_1v <= 0) { //#41440
                            $j -= 5; //#41439
                            throw Infinity; //#41439
                        } //#41439
                        var _1w = $k[--$j]; //#41441
                        var _1x = $k[--$j]; //#41441
                        $_.s = _1w; //#41441
                        $_.fn = _1x; //#41441
                        $$.selectfont(_1x, _1w); //#41442
                        var _1y = $$.stringwidth("0"); //#41444
                        $_.xoff = -(_1y.w / 2); //#41444
                        $$.save(); //#41445
                        $$.newpath(); //#41445
                        $$.moveto(0, 0); //#41445
                        $$.charpath("0", false); //#41445
                        var _1z = $$.pathbbox(); //#41445
                        $$.restore(); //#41445
                        $k[$j++] = _1z.llx; //#41446
                        $k[$j++] = _1z.lly; //#41446
                        $k[$j++] = _1z.ury; //#41446
                        $k[$j++] = _1z.urx; //#41446
                        $j--; //#41446
                        var _20 = $k[--$j]; //#41446
                        var _21 = $k[--$j]; //#41446
                        $_.yoff = -($f(_21 + _20) / 2) //#41446
                        $j--; //#41446
                    } else { //#41448
                        $j -= 2; //#41448
                    } //#41448
                    var _22 = $k[--$j]; //#41450
                    var _23 = $k[--$j]; //#41450
                    $$.moveto(_23, _22); //#41450
                    var _24 = $k[$j - 1]; //#41450
                    if (_24.length == 1) { //#41450
                        $$.rmoveto($_.xoff, $_.yoff); //#41450
                    } //#41450
                    var _27 = $k[--$j]; //#41450
                    $$.show(_27, 0, 0); //#41450
                }); //#41450
                $k[$j++] = false; //#41450
            } catch (e) { //#41450
                $k[$j++] = true; //#41450
            } //#41450
            var _28 = $k[--$j]; //#41454
            if (_28) { //#41454
                $k[$j++] = "bwipp.fontTooSmall#41453"; //#41453
                $k[$j++] = "The font size is too small"; //#41453
                $k[$j++] = false; //#41453
                break; //#41453
            } //#41453
            $k[$j++] = true; //#41456
            break; //#41456
        } //#41456
        if (($_.content.length == 0) && ($_.txt.length > 0)) { //#41472
            $k[$j++] = Infinity; //#41466
            $forall($_.txt, function() { //#41466
                var _2C = $k[--$j]; //#41466
                $forall($get(_2C, 0)); //#41466
            }); //#41466
            $_.txtchars = $a(); //#41466
            $_.tstr = $s($_.txtchars.length); //#41467
            for (var _2I = 0, _2H = $_.txtchars.length - 1; _2I <= _2H; _2I += 1) { //#41470
                $put($_.tstr, _2I, $get($_.txtchars, _2I)); //#41469
            } //#41469
            $_.content = $_.tstr; //#41471
        } //#41471
        if ($_.content.length == 0) { //#41475
            $k[$j++] = true; //#41475
            break; //#41475
        } //#41475
        if (($_.subspace.length != 0) && ($_.subspace.length != 1)) { //#41480
            $k[$j++] = 'subspaceBad'; //#41479
            $k[$j++] = "subspace option must be a single character"; //#41479
            $_.makeerr(); //#41479
            $k[$j++] = false; //#41479
            break; //#41479
        } //#41479
        if ($_.subspace.length != 0) { //#41489
            for (var _2T = 0, _2S = $_.content.length - 1; _2T <= _2S; _2T += 1) { //#41488
                $k[$j++] = _2T; //#41484
                $search($_.subspace, $geti($_.content, _2T, 1)); //#41484
                var _2X = $k[--$j]; //#41486
                if (_2X) { //#41486
                    $j--; //#41485
                    $j--; //#41485
                    var _2c = $k[$j - 2]; //#41485
                    $put($_.content, _2c, 32); //#41485
                } //#41485
                $j -= 2; //#41487
            } //#41487
        } //#41487
        if (($_.split.length != 0) && ($_.content.length != 0)) { //#41502
            if ($_.split.length != 1) { //#41495
                $k[$j++] = 'splitBad'; //#41494
                $k[$j++] = "split option must be a single character"; //#41494
                $_.makeerr(); //#41494
                $k[$j++] = false; //#41494
                break; //#41494
            } //#41494
            $k[$j++] = Infinity; //#41496
            $k[$j++] = $_.content; //#41499
            for (;;) { //#41499
                var _2i = $k[--$j]; //#41498
                $search(_2i, $_.split); //#41498
                var _2j = $k[--$j]; //#41498
                if (_2j) { //#41498
                    var _2k = $k[--$j]; //#41498
                    $j--; //#41498
                    var _2n = $k[--$j]; //#41498
                    $k[$j++] = _2k; //#41498
                    $k[$j++] = _2n; //#41498
                } else { //#41498
                    break; //#41498
                } //#41498
            } //#41498
            $_.textlines = $a(); //#41498
        } else { //#41502
            $_.textlines = $a([$_.content]); //#41502
        } //#41502
        if ($ne($_.color, "unset")) { //#41505
            $$.setcolor($_.color); //#41505
        } //#41505
        $$.selectfont($_.font, $_.size); //#41507
        if ($_.content.length == 0) { //#41516
            $k[$j++] = 0; //#41511
        } else { //#41516
            $$.save(); //#41513
            $$.newpath(); //#41514
            $$.moveto(0, 0); //#41514
            $$.charpath("0", false); //#41514
            var _2u = $$.pathbbox(); //#41514
            $$.restore(); //#41516
            $k[$j++] = _2u.ury; //#41516
        } //#41516
        var _2v = $k[--$j]; //#41525
        $_.textascent = _2v; //#41525
        var _2w = $_.textlines; //#41527
        $k[$j++] = 'textwidth'; //#41527
        $k[$j++] = 0; //#41527
        for (var _2x = 0, _2y = _2w.length; _2x < _2y; _2x++) { //#41527
            var _30 = $$.stringwidth($get(_2w, _2x)); //#41527
            var _31 = $k[--$j]; //#41527
            var _32 = _30.w; //#41527
            if (_31 < _30.w) { //#41527
                var _ = _32; //#41527
                _32 = _31; //#41527
                _31 = _; //#41527
            } //#41527
            $k[$j++] = _31; //#41527
        } //#41527
        var _35 = $k[--$j]; //#41527
        var _36 = $k[--$j]; //#41527
        $_[_36] = $f(_35 + ($_.content.length - 1) * $_.gaps) //#41527
        var _38 = $_.textlines.length; //#41528
        $_.textheight = $f(_38 * $_.textascent + (_38 - 1) * $_.linegaps) //#41528
        if ($eq($_.xalign, "unset")) { //#41530
            $_.xalign = "center"; //#41530
        } //#41530
        if ($eq($_.yalign, "unset")) { //#41531
            $_.yalign = "below"; //#41531
        } //#41531
        if ($eq($_.xalign, "justify")) { //#41544
            if ($ne($_.direction, "forward") && $ne($_.direction, "backward")) { //#41536
                $k[$j++] = 'xjustify'; //#41535
                $k[$j++] = "xalign=justify requires forward or backward text"; //#41535
                $_.makeerr(); //#41535
                $k[$j++] = false; //#41535
                break; //#41535
            } //#41535
            if ($lt($_.textwidth, $_.pixx) && ($_.content.length > 1)) { //#41542
                $_.gaps = $f($_.pixx - $_.textwidth) / ($_.content.length - 1) //#41538
                var _3N = $eq($_.direction, "forward") ? "left" : "right"; //#41539
                $_.xalign = _3N; //#41539
            } else { //#41542
                $_.gaps = 0; //#41541
                $_.xalign = "center"; //#41542
            } //#41542
        } //#41542
        if ($eq($_.yalign, "justify")) { //#41557
            if ($ne($_.direction, "upward") && $ne($_.direction, "downward")) { //#41549
                $k[$j++] = 'yjustify'; //#41548
                $k[$j++] = "yalign=justify requires upward or downward text"; //#41548
                $_.makeerr(); //#41548
                $k[$j++] = false; //#41548
                break; //#41548
            } //#41548
            if ($lt($_.textwidth, $_.pixy) && ($_.content.length > 1)) { //#41555
                $_.gaps = $f($_.pixy - $_.textwidth) / ($_.content.length - 1) //#41551
                var _3Z = $eq($_.direction, "upward") ? "bottom" : "top"; //#41552
                $_.yalign = _3Z; //#41552
            } else { //#41555
                $_.gaps = 0; //#41554
                $_.yalign = "center"; //#41555
            } //#41555
        } //#41555
        $k[$j++] = $_.xalign; //#41559
        $k[$j++] = $_.yalign; //#41559
        $k[$j++] = $_.direction; //#41559
        $k[$j++] = $_.textwidth; //#41559
        $k[$j++] = $_.textheight; //#41559
        $_.positiontext(); //#41559
        var _3g = $k[--$j]; //#41559
        var _3h = $k[--$j]; //#41559
        $$.moveto(_3h, _3g); //#41559
        $$.rmoveto($_.xoffset, $_.yoffset); //#41560
        $$.save(); //#41561
        var _3k = new Map([
            ["forward", 0],
            ["upward", 90],
            ["backward", 180],
            ["downward", 270]
        ]); //#41562
        $$.rotate($get(_3k, $_.direction)); //#41562
        var _3n = $$.currpos(); //#41563
        $$.translate(_3n.x, _3n.y); //#41563
        for (var _3q = 0, _3p = $_.textlines.length - 1; _3q <= _3p; _3q += 1) { //#41568
            $_.i = _3q; //#41565
            $$.moveto(0, 0 + $f($_.textascent + $_.linegaps) * $_.i) //#41566
            var _3v = $_.textlines; //#41567
            $$.show($get(_3v, (_3v.length - $_.i) - 1), $_.gaps, 0); //#41567
        } //#41567
        $$.restore(); //#41569
        $k[$j++] = true; //#41571
        break; //#41571
    } //#41571
    $_ = $__; //#41575
} //bwipp_rendertext
function bwipp_renlinear() {
    if ($_.bwipjs_rawstack) {
        $_.bwipjs_rawstack.push($k[--$j]);
        return;
    }
    if (!bwipp_renlinear.globals) {
        var $__ = $_;
        $_ = bwipp_renlinear.globals = {};
        //#41597
        var _0 = new Map([
            ["offleft", 'offleft'],
            ["left", 'left'],
            ["center", 'center'],
            ["right", 'right'],
            ["offright", 'offright'],
            ["justify", 'justify']
        ]); //#41600
        $_.renlinear_xalignopts = _0; //#41601
        var _1 = new Map([
            ["above", 'above'],
            ["top", 'top'],
            ["center", 'center'],
            ["bottom", 'bottom'],
            ["below", 'below'],
            ["justify", 'justify']
        ]); //#41604
        $_.renlinear_yalignopts = _1; //#41605
        var _2 = new Map([
            ["forward", 'forward'],
            ["backward", 'backward'],
            ["upward", 'upward'],
            ["downward", 'downward']
        ]); //#41608
        $_.renlinear_directionoptions = _2; //#41609
        $_ = $__;
    }
    //#41611
    var $__ = $_; //#41612
    $_ = Object.assign({}, $_, bwipp_renlinear.globals); //#41612
    $_.sbs = $a([]); //#41617
    $_.bhs = $a([]); //#41618
    $_.bbs = $a([]); //#41619
    $_.txt = $a([]); //#41620
    bwipp_inittextoptions(); //#41623
    $_.text1xalign = "unset"; //#41626
    $_.text1yalign = "unset"; //#41627
    $_.includetext = false; //#41629
    $_.barcolor = "unset"; //#41630
    $_.bordercolor = "unset"; //#41632
    $_.inkspread = null; //#41633
    $_.width = 0; //#41634
    $_.barratio = 1; //#41635
    $_.spaceratio = 1; //#41636
    $_.showborder = false; //#41637
    $_.showbearer = false; //#41638
    $_.borderleft = 10; //#41639
    $_.borderright = 10; //#41640
    $_.bordertop = 1; //#41641
    $_.borderbottom = 1; //#41642
    $_.borderwidth = 0.5; //#41643
    $_.guardwhitespace = false; //#41644
    $_.guardleftpos = 0; //#41645
    $_.guardleftypos = 0; //#41646
    $_.guardrightpos = 0; //#41647
    $_.guardrightypos = 0; //#41648
    $_.guardwidth = 5; //#41649
    $_.guardheight = 7; //#41650
    var _3 = $k[--$j]; //#41652
    $forall(_3, function() { //#41652
        var _4 = $k[--$j]; //#41652
        var _5 = $k[--$j]; //#41652
        $_[_5] = _4; //#41652
    }); //#41652
    $k[$j++] = $_.opt; //#41653
    $del($_, 'opt') //#41653
    $k[$j++] = null; //#41653
    bwipp_processoptions(); //#41653
    $k[$j - 1] = 'textopts'; //#41654
    bwipp_grouptextoptions(); //#41654
    var _7 = $k[--$j]; //#41654
    var _8 = $k[--$j]; //#41654
    $_[_8] = _7; //#41654
    for (var _9 = 1; _9 <= 9; _9 += 1) { //#41665
        $_.textgrp = _9; //#41662
        $k[$j++] = $_.textgrp; //#41664
        $k[$j++] = $get($_.textopts, $_.textgrp - 1); //#41664
        bwipp_validatetext(); //#41664
        var _E = $k[--$j]; //#41664
        if (!_E) { //#41664
            bwipp_raiseerror(); //#41664
        } //#41664
    } //#41664
    if (($_.inkspread < -1) || ($_.inkspread > 1)) { //#41669
        $k[$j++] = "bwipp.renlinearBadInkspread#41668"; //#41668
        $k[$j++] = "inkspread must be from -1 to 1"; //#41668
        bwipp_raiseerror(); //#41668
    } //#41668
    if (($_.borderleft < -1) || ($_.borderleft > 50)) { //#41673
        $k[$j++] = "bwipp.renlinearBadBorderleft#41672"; //#41672
        $k[$j++] = "borderleft must be from -1 to 50"; //#41672
        bwipp_raiseerror(); //#41672
    } //#41672
    if (($_.borderright < -1) || ($_.borderright > 50)) { //#41677
        $k[$j++] = "bwipp.renlinearBadBorderright#41676"; //#41676
        $k[$j++] = "borderright must be from -1 to 50"; //#41676
        bwipp_raiseerror(); //#41676
    } //#41676
    if (($_.bordertop < -1) || ($_.bordertop > 50)) { //#41681
        $k[$j++] = "bwipp.renlinearBadBordertop#41680"; //#41680
        $k[$j++] = "bordertop must be from -1 to 50"; //#41680
        bwipp_raiseerror(); //#41680
    } //#41680
    if (($_.borderbottom < -1) || ($_.borderbottom > 50)) { //#41685
        $k[$j++] = "bwipp.renlinearBadBorderbottom#41684"; //#41684
        $k[$j++] = "borderbottom must be from -1 to 50"; //#41684
        bwipp_raiseerror(); //#41684
    } //#41684
    if (($_.borderwidth < 0) || ($_.borderwidth > 10)) { //#41689
        $k[$j++] = "bwipp.renlinearBadBorderwidth#41688"; //#41688
        $k[$j++] = "borderwidth must be from 0 to 10"; //#41688
        bwipp_raiseerror(); //#41688
    } //#41688
    if (($_.barratio < 0.1) || ($_.barratio > 5)) { //#41693
        $k[$j++] = "bwipp.renlinearBadBarratio#41692"; //#41692
        $k[$j++] = "barratio must be from 0.1 to 5"; //#41692
        bwipp_raiseerror(); //#41692
    } //#41692
    if (($_.spaceratio < 0.1) || ($_.spaceratio > 5)) { //#41697
        $k[$j++] = "bwipp.renlinearBadSpaceratio#41696"; //#41696
        $k[$j++] = "spaceratio must be from 0.1 to 5"; //#41696
        bwipp_raiseerror(); //#41696
    } //#41696
    if ($_.width != 0) { //#41701
        if (($_.width < 0.01) || ($_.width > 20)) { //#41701
            $k[$j++] = "bwipp.renlinearBadWidth#41700"; //#41700
            $k[$j++] = "width must be 0 or from 0.01 to 20"; //#41700
            bwipp_raiseerror(); //#41700
        } //#41700
    } //#41700
    if (($_.guardwidth < 0) || ($_.guardwidth > 20)) { //#41705
        $k[$j++] = "bwipp.renlinearBadGuardwidth#41704"; //#41704
        $k[$j++] = "guardwidth must be from 0 to 20"; //#41704
        bwipp_raiseerror(); //#41704
    } //#41704
    if (($_.guardheight < 0) || ($_.guardheight > 20)) { //#41709
        $k[$j++] = "bwipp.renlinearBadGuardheight#41708"; //#41708
        $k[$j++] = "guardheight must be from 0 to 20"; //#41708
        bwipp_raiseerror(); //#41708
    } //#41708
    if (($_.guardleftpos < -50) || ($_.guardleftpos > 150)) { //#41713
        $k[$j++] = "bwipp.renlinearBadGuardleftpos#41712"; //#41712
        $k[$j++] = "guardleftpos must be from -50 to 150"; //#41712
        bwipp_raiseerror(); //#41712
    } //#41712
    if (($_.guardleftypos < -50) || ($_.guardleftypos > 150)) { //#41717
        $k[$j++] = "bwipp.renlinearBadGuardleftypos#41716"; //#41716
        $k[$j++] = "guardleftypos must be from -50 to 150"; //#41716
        bwipp_raiseerror(); //#41716
    } //#41716
    if (($_.guardrightpos < -50) || ($_.guardrightpos > 150)) { //#41721
        $k[$j++] = "bwipp.renlinearBadGuardrightpos#41720"; //#41720
        $k[$j++] = "guardrightpos must be from -50 to 150"; //#41720
        bwipp_raiseerror(); //#41720
    } //#41720
    if (($_.guardrightypos < -50) || ($_.guardrightypos > 150)) { //#41725
        $k[$j++] = "bwipp.renlinearBadGuardrightypos#41724"; //#41724
        $k[$j++] = "guardrightypos must be from -50 to 150"; //#41724
        bwipp_raiseerror(); //#41724
    } //#41724
    if ($_.sbs.length != 0) { //#41732
        var _l = $_.sbs; //#41728
        $k[$j++] = ~~((_l.length + 1) / 2); //#41730
        if (($_.bhs.length < (~~((_l.length + 1) / 2))) || ($_.bbs.length < (~~((_l.length + 1) / 2)))) { //#41730
            $k[$j - 1] = "bwipp.renlinearBadBarHeightArrays#41730"; //#41730
            $k[$j++] = "The bar height and baseline arrays must be at least as long as the number of bars"; //#41730
            bwipp_raiseerror(); //#41730
        } //#41730
        $j--; //#41731
    } //#41731
    $_.bars = $a(~~(($_.sbs.length + 1) / 2)); //#41737
    $_.pixx = 0; //#41738
    $_.pixy = 0; //#41738
    for (var _s = 0, _r = ((~~(($_.sbs.length + 1) / 2)) * 2) - 2; _s <= _r; _s += 1) { //#41757
        $_.i = _s; //#41740
        if (($_.i % 2) == 0) { //#41754
            $_.d = $f($get($_.sbs, $_.i) * $_.barratio - $_.barratio) + 1 //#41742
            if ($get($_.sbs, $_.i) != 0) { //#41751
                $_.h = $get($_.bhs, ~~($_.i / 2)) * 72; //#41744
                $_.c = $f($_.d / 2 + $_.pixx) //#41745
                $_.y = $get($_.bbs, ~~($_.i / 2)) * 72; //#41746
                $_.w = $f($_.d - $_.inkspread) //#41747
                $put($_.bars, ~~($_.i / 2), $a([$_.h, $_.c, $_.y, $_.w])); //#41748
                if ($f($_.h + $_.y) > $_.pixy) { //#41749
                    $_.pixy = $f($_.h + $_.y) //#41749
                } //#41749
            } else { //#41751
                $put($_.bars, ~~($_.i / 2), -1); //#41751
            } //#41751
        } else { //#41754
            $_.d = $f($get($_.sbs, $_.i) * $_.spaceratio - $_.spaceratio) + 1 //#41754
        } //#41754
        $_.pixx = $f($_.pixx + $_.d) //#41756
    } //#41756
    $$.save(); //#41759
    var _1X = $$.currpos(); //#41761
    $$.translate(_1X.x, _1X.y); //#41761
    if ($_.width != 0) { //#41766
        $$.scale(($_.width * 72) / $_.pixx, 1); //#41765
    } //#41765
    $_.tl = $a([-$f($_.borderleft + $_.borderwidth / 2), $f($_.pixy + $_.bordertop + $_.borderwidth / 2)]) //#41778
    $_.tr = $a([$f($_.pixx + $_.borderright + $_.borderwidth / 2), $f($_.pixy + $_.bordertop + $_.borderwidth / 2)]) //#41779
    $_.bl = $a([-$f($_.borderleft + $_.borderwidth / 2), -$f($_.borderbottom + $_.borderwidth / 2)]) //#41780
    $_.br = $a([$f($_.pixx + $_.borderright + $_.borderwidth / 2), -$f($_.borderbottom + $_.borderwidth / 2)]) //#41781
    if ($_.showbearer) { //#41796
        $$.save(); //#41783
        $$.newpath(); //#41784
        $aload($_.bl); //#41785
        var _1x = $k[--$j]; //#41785
        var _1y = $k[--$j]; //#41785
        $$.moveto(_1y, _1x); //#41785
        $aload($_.br); //#41785
        var _20 = $k[--$j]; //#41785
        var _21 = $k[--$j]; //#41785
        $$.lineto(_21, _20); //#41785
        $aload($_.tl); //#41786
        var _23 = $k[--$j]; //#41786
        var _24 = $k[--$j]; //#41786
        $$.moveto(_24, _23); //#41786
        $aload($_.tr); //#41786
        var _26 = $k[--$j]; //#41786
        var _27 = $k[--$j]; //#41786
        $$.lineto(_27, _26); //#41786
        if ($ne($_.bordercolor, "unset")) { //#41787
            $$.setcolor($_.bordercolor); //#41787
        } //#41787
        $$.setlinewidth($f($_.borderwidth - $_.inkspread * 2)) //#41788
        $$.stroke(); //#41788
        $$.restore(); //#41789
    } else { //#41796
        if ($_.showborder) { //#41797
            $$.save(); //#41792
            $$.newpath(); //#41793
            $aload($_.bl); //#41793
            var _2E = $k[--$j]; //#41793
            var _2F = $k[--$j]; //#41793
            $$.moveto(_2F, _2E); //#41793
            var _2J = $a([$_.br, $_.tr, $_.tl]); //#41793
            for (var _2K = 0, _2L = _2J.length; _2K < _2L; _2K++) { //#41793
                $aload($get(_2J, _2K)); //#41793
                var _2N = $k[--$j]; //#41793
                var _2O = $k[--$j]; //#41793
                $$.lineto(_2O, _2N); //#41793
            } //#41793
            $$.closepath(); //#41793
            if ($ne($_.bordercolor, "unset")) { //#41794
                $$.setcolor($_.bordercolor); //#41794
            } //#41794
            $$.setlinewidth($_.borderwidth); //#41795
            $$.stroke(); //#41795
            $$.restore(); //#41796
        } //#41796
    } //#41796
    $$.save(); //#41802
    if ($ne($_.barcolor, "unset")) { //#41804
        $$.setcolor($_.barcolor); //#41804
    } //#41804
    var _2U = $_.bars; //#41805
    for (var _2V = 0, _2W = _2U.length; _2V < _2W; _2V++) { //#41811
        var _2X = $get(_2U, _2V); //#41811
        $k[$j++] = _2X; //#41810
        if (_2X != -1) { //#41809
            var _2Y = $k[--$j]; //#41807
            $aload(_2Y); //#41807
            $$.newpath(); //#41807
            var _2Z = $k[--$j]; //#41807
            $$.setlinewidth(_2Z); //#41807
            var _2a = $k[--$j]; //#41807
            var _2b = $k[--$j]; //#41807
            $$.moveto(_2b, _2a); //#41807
            var _2c = $k[--$j]; //#41807
            $$.rlineto(0, _2c); //#41807
            $$.stroke(); //#41807
        } else { //#41809
            $j--; //#41809
        } //#41809
    } //#41809
    $$.restore(); //#41812
    for (var _2d = 1; _2d <= 9; _2d += 1) { //#41828
        $_.textgrp = _2d; //#41818
        if (($get($get($_.textopts, $_.textgrp - 1), "").length != 0) || ((($_.textgrp == 1) && ($_.txt.length > 0)) && $_.includetext)) { //#41827
            var _2n = $get($_.textopts, $_.textgrp - 1); //#41822
            $put(_2n, "content", $get(_2n, "")); //#41823
            $k[$j++] = _2n; //#41824
            var _2t = "txt"; //#41824
            var _2s = $_.textgrp == 1 ? $_.txt : $a([]); //#41824
            $put(_2n, _2t, _2s); //#41824
            $k[$j++] = $_.pixx; //#41825
            $k[$j++] = $_.pixy; //#41825
            $k[$j++] = $_.textgrp; //#41825
            $r(4, -1); //#41825
            bwipp_rendertext(); //#41825
            var _2y = $k[--$j]; //#41826
            if (!_2y) { //#41826
                $$.restore(); //#41826
                bwipp_raiseerror(); //#41826
            } //#41826
        } //#41826
    } //#41826
    $k[$j++] = $_.pixx; //#41833
    bwipp_renderguards(); //#41833
    $$.restore(); //#41835
    $_ = $__; //#41837
} //bwipp_renlinear
function bwipp_validatetext() {
    if (!bwipp_validatetext.globals) {
        var $__ = $_;
        $_ = bwipp_validatetext.globals = {};
        //#42222
        var _0 = new Map([
            ["offleft", 'offleft'],
            ["left", 'left'],
            ["center", 'center'],
            ["right", 'right'],
            ["offright", 'offright'],
            ["justify", 'justify']
        ]); //#42226
        $_.validatetext_xalignopts = _0; //#42227
        var _1 = new Map([
            ["above", 'above'],
            ["top", 'top'],
            ["center", 'center'],
            ["bottom", 'bottom'],
            ["below", 'below'],
            ["justify", 'justify']
        ]); //#42230
        $_.validatetext_yalignopts = _1; //#42231
        var _2 = new Map([
            ["forward", 'forward'],
            ["backward", 'backward'],
            ["upward", 'upward'],
            ["downward", 'downward']
        ]); //#42234
        $_.validatetext_directionoptions = _2; //#42235
        $_ = $__;
    }
    //#42242
    var $__ = $_; //#42244
    $_ = Object.assign({}, $_, bwipp_validatetext.globals); //#42244
    var _3 = $k[--$j]; //#42246
    $_.td = _3; //#42246
    var _4 = $k[--$j]; //#42247
    $_.grp = _4; //#42247
    $k[$j++] = 'pfx'; //#42254
    if ($_.grp == 1) { //#42252
        $k[$j++] = "text"; //#42250
    } else { //#42252
        if ($_.grp == 2) { //#42252
            $k[$j++] = "extratext"; //#42251
        } else { //#42252
            var _7 = $s(5); //#42252
            $puti(_7, 0, "text"); //#42252
            $put(_7, 4, $_.grp + 48); //#42252
            $k[$j++] = _7; //#42252
        } //#42252
    } //#42252
    var _9 = $k[--$j]; //#42254
    var _A = $k[--$j]; //#42254
    $_[_A] = _9; //#42254
    $_.mkerr = function() {
        var _B = $k[--$j]; //#42257
        $_.msgtail = _B; //#42257
        var _C = $k[--$j]; //#42258
        $_.prop = $cvs($s(128), _C); //#42258
        var _G = $s(($_.pfx.length + 9) + $_.prop.length); //#42259
        $puti(_G, 0, "bwipp."); //#42260
        $puti(_G, 6, $_.pfx); //#42261
        $puti(_G, $_.pfx.length + 6, "Bad"); //#42262
        $puti(_G, $_.pfx.length + 9, $_.prop); //#42263
        var _O = $s(($_.pfx.length + $_.prop.length) + $_.msgtail.length); //#42264
        $puti(_O, 0, $_.pfx); //#42265
        $puti(_O, $_.pfx.length, $_.prop); //#42266
        $puti(_O, $_.pfx.length + $_.prop.length, $_.msgtail); //#42267
        $k[$j++] = _G; //#42267
        $k[$j++] = _O; //#42267
    }; //#42267
    for (var _V = 0; _V < 1; _V++) { //#42310
        var _X = $get($_.td, "xalign"); //#42272
        $k[$j++] = _X; //#42276
        if ($ne(_X, "unset")) { //#42276
            var _Y = $k[--$j]; //#42273
            if (!$has($_.validatetext_xalignopts, _Y)) { //#42275
                $k[$j++] = 'xalign'; //#42274
                $k[$j++] = " must be offleft, left, center, right, offright or justify"; //#42274
                $_.mkerr(); //#42274
                $k[$j++] = false; //#42274
                break; //#42274
            } //#42274
        } else { //#42276
            $j--; //#42276
        } //#42276
        var _b = $get($_.td, "yalign"); //#42278
        $k[$j++] = _b; //#42282
        if ($ne(_b, "unset")) { //#42282
            var _c = $k[--$j]; //#42279
            if (!$has($_.validatetext_yalignopts, _c)) { //#42281
                $k[$j++] = 'yalign'; //#42280
                $k[$j++] = " must be above, top, center, bottom, below or justify"; //#42280
                $_.mkerr(); //#42280
                $k[$j++] = false; //#42280
                break; //#42280
            } //#42280
        } else { //#42282
            $j--; //#42282
        } //#42282
        if (!$has($_.validatetext_directionoptions, $get($_.td, "direction"))) { //#42286
            $k[$j++] = 'direction'; //#42285
            $k[$j++] = " must be forward, backward, upward or downward"; //#42285
            $_.mkerr(); //#42285
            $k[$j++] = false; //#42285
            break; //#42285
        } //#42285
        var _i = $get($_.td, "size"); //#42288
        if ((_i <= 0) || (_i >= 25)) { //#42290
            $k[$j++] = 'size'; //#42289
            $k[$j++] = " must be greater than zero and less than 25"; //#42289
            $_.mkerr(); //#42289
            $k[$j++] = false; //#42289
            break; //#42289
        } //#42289
        var _k = $get($_.td, "xoffset"); //#42292
        if ((_k < -150) || (_k > 150)) { //#42294
            $k[$j++] = 'xoffset'; //#42293
            $k[$j++] = " must be from -150 to 150"; //#42293
            $_.mkerr(); //#42293
            $k[$j++] = false; //#42293
            break; //#42293
        } //#42293
        var _m = $get($_.td, "yoffset"); //#42296
        if ((_m < -150) || (_m > 150)) { //#42298
            $k[$j++] = 'yoffset'; //#42297
            $k[$j++] = " must be from -150 to 150"; //#42297
            $_.mkerr(); //#42297
            $k[$j++] = false; //#42297
            break; //#42297
        } //#42297
        var _o = $get($_.td, "gaps"); //#42300
        if ((_o < -20) || (_o > 20)) { //#42302
            $k[$j++] = 'gaps'; //#42301
            $k[$j++] = " must be from -20 to 20"; //#42301
            $_.mkerr(); //#42301
            $k[$j++] = false; //#42301
            break; //#42301
        } //#42301
        var _q = $get($_.td, "linegaps"); //#42304
        if ((_q < 0) || (_q > 20)) { //#42306
            $k[$j++] = 'linegaps'; //#42305
            $k[$j++] = " must be from 0 to 20"; //#42305
            $_.mkerr(); //#42305
            $k[$j++] = false; //#42305
            break; //#42305
        } //#42305
        $k[$j++] = true; //#42308
        break; //#42308
    } //#42308
    $_ = $__; //#42312
} //bwipp_validatetext
// bwip-js/barcode-ftr.js
//
// This code is injected below the cross-compiled barcode.js.

// `encoder` is one of the bwipp_ functions
function bwipp_encode(bwipjs, encoder, text, opts, dontdraw) {
    if (typeof text !== 'string') {
        throw new Error('bwipp.typeError: barcode text not a string (' +
            text + ')');
    }
    opts = opts || {};
    if (typeof opts === 'string') {
        var tmp = opts.split(' ');
        opts = {};
        for (var i = 0; i < tmp.length; i++) {
            if (!tmp[i]) {
                continue;
            }
            var eq = tmp[i].indexOf('=');
            if (eq == -1) {
                if (tmp[i][0] == '!') {
                    // boolean !name
                    opts[tmp[i].substr(1)] = false;
                } else {
                    // boolean name
                    opts[tmp[i]] = true;
                }
            } else {
                opts[tmp[i].substr(0, eq)] = tmp[i].substr(eq + 1);
            }
        }
    } else if (typeof opts !== 'object' || opts.constructor !== Object) {
        throw new Error('bwipp.typeError: options not an object');
    }

    // Convert utf-16 to utf-8 unless caller has pre-encoded the text.
    if (opts.binarytext) {
        // No 16-bit chars allowed.
        if (/[\u0100-\uffff]/.test(text)) {
            throw new Error('bwip-js: 16-bit chars not allowed with binarytext');
        }
    } else if (/[\u0080-\uffff]/.test(text)) {
        text = unescape(encodeURIComponent(text));
    }

    if (opts.dontdraw) {
        dontdraw = true;
    }

    // Convert opts to a Map
    var map = new Map;
    for (var id in opts) {
        if (opts.hasOwnProperty(id)) {
            map.set(id, opts[id]);
        }
    }

    // Set up the initial postscript state and invoke the encoder
    $$ = bwipjs;
    $k = [text, map];
    $j = 2;
    $_ = {
        bwipjs_rawstack: dontdraw ? [] : false
    };

    encoder();

    if ($_.bwipjs_rawstack) {
        return $_.bwipjs_rawstack;
    }

    return true;
}


function bwipp_lookup(symbol) {
    var s = String(symbol == null ? "" : symbol).replace(/-/g, "_");
    if (s === "gs1_128") return bwipp_gs1_128;
    throw new Error("bwip-js-slim: only bcid 'gs1-128' is supported (got: " + symbol + ")");
}

// file : bwipjs.js
//
// Graphics-context interface to the BWIPP cross-compiled code

var BWIPJS = (function() {

// Math.floor(), etc. are notoriously slow.  Caching seems to help.
var floor = Math.floor;
var round = Math.round;
var ceil  = Math.ceil;
var min   = Math.min;
var max   = Math.max;

function BWIPJS(drawing) {
    if (this.constructor !== BWIPJS) {
        return new BWIPJS(drawing);
    }
    this.gstk    = [];      // Graphics save/restore stack
    this.cmds    = [];      // Graphics primitives to replay when rendering
    this.drawing = drawing; // Drawing interface

    this.reset();

    // Drawing surface bounding box
    this.minx = this.miny = Infinity;
    this.maxx = this.maxy = -Infinity;
};

// All graphics state that must be saved/restored is given a prefix of g_
BWIPJS.prototype.reset = function() {
    // Current Transform Matrix
    this.g_m0 = 1;
    this.g_m1 = 0;
    this.g_m2 = 0;
    this.g_m3 = 1;
    this.g_m4 = 0;
    this.g_m5 = 0;

    // Keep scale and rotateion distinct for the drawing interface
    this.g_tsx  = 1;        // x-scale factor
    this.g_tsy  = 1;        // y-scale factor
    this.g_rot  = 0;        // text rotation (0, 90, 180 , 270)

    this.g_posx = 0;        // current x position
    this.g_posy = 0;        // current y position
    this.g_penw = 1;        // current line/pen width
    this.g_path = [];       // current path
    this.g_font = null;     // current font
    this.g_rgb  = [0,0,0];  // current color (black)
    this.g_clip = false;    // clip region active
};
BWIPJS.prototype.save = function() {
    // clone all g_ properties
    var ctx = {};
    for (var id in this) {
        if (id.indexOf('g_') == 0) {
            ctx[id] = clone(this[id]);
        }
    }
    this.gstk.push(ctx);

    // Perform a deep clone of the graphics state properties
    function clone(v) {
        if (v instanceof Array) {
            var t = [];
            for (var i = 0; i < v.length; i++)
                t[i] = clone(v[i]);
            return t;
        }
        if (v instanceof Object) {
            var t = {};
            for (var id in v)
                t[id] = clone(v[id]);
            return t;
        }
        return v;
    }
};
BWIPJS.prototype.restore = function() {
    if (!this.gstk.length) {
        throw new Error('grestore: stack underflow');
    }
    var ctx  = this.gstk.pop();
    var self = this;
    if (this.g_clip && !ctx.g_clip) {
        this.cmds.push(function() {
                self.drawing.unclip();
            });
    }
    for (var id in ctx) {
        this[id] = ctx[id];
    }
};
// Per the postscript spec:
//  As discussed in Section 4.4.1, Current Path, points entered into a path
//  are immediately converted to device coordinates by the current
//  transformation matrix (CTM); subsequent modifications to the CTM do not
//  affect existing points.  `currentpoint` computes the user space
//  coordinates corresponding to the current point according to the current
//  value of the CTM. Thus, if a current point is set and then the CTM is
//  changed, the coordinates returned by currentpoint will be different
//  from those that were originally specified for the point.
BWIPJS.prototype.currpos = function() {
    return { x:(this.g_posx-this.g_m4)/this.g_tsx,
             y:(this.g_posy-this.g_m5)/this.g_tsy
        };
};
BWIPJS.prototype.currfont = function() {
    return this.g_font;
};
// rotate is only used with text/fonts and limited to the angles 0, 90, 180, 270.
BWIPJS.prototype.rotate = function(rot) {
    this.g_rot += rot;

    var cos = round(Math.cos(rot * Math.PI / 180));
    var sin = round(Math.sin(rot * Math.PI / 180));
    var m0 = this.g_m0 * cos + this.g_m2 * sin;
    var m1 = this.g_m1 * cos + this.g_m3 * sin;
    var m2 = this.g_m0 * -sin + this.g_m2 * cos;
    var m3 = this.g_m1 * -sin + this.g_m3 * cos;
    this.g_m0 = m0;
    this.g_m1 = m1;
    this.g_m2 = m2;
    this.g_m3 = m3;
};
BWIPJS.prototype.translate = function(x, y) {
    this.g_m4 += this.g_tsx * x;
    this.g_m5 += this.g_tsy * y;
};
BWIPJS.prototype.scale = function(x, y) {
    var sx = this.g_tsx;
    var sy = this.g_tsy;
    this.g_tsx *= x;
    this.g_tsy *= y;
    var sxy = this.drawing.scale(this.g_tsx, this.g_tsy);
    if (sxy && sxy[0] && sxy[1]) {
        this.g_tsx = sxy[0];
        this.g_tsy = sxy[1];
    }
    this.g_m0 *= this.g_tsx / sx;
    this.g_m1 *= this.g_tsx / sx;
    this.g_m2 *= this.g_tsy / sy;
    this.g_m3 *= this.g_tsy / sy;
};
BWIPJS.prototype.setlinewidth = function(w) {
    this.g_penw = w;
};
BWIPJS.prototype.selectfont = function(f, z) {
    this.g_font = { FontName:this.jsstring(f), FontSize:+z };
};
BWIPJS.prototype.getfont = function() {
    return this.g_font.FontName;
};
// Special function for converting a Uint8Array string to string.
BWIPJS.prototype.jsstring = function(s) {
    if (s instanceof Uint8Array) {
        // Postscript (like C) treats nul-char as end of string.
        //for (var i = 0, l = s.length; i < l && s[i]; i++);
        //if (i < l) {
        //  return String.fromCharCode.apply(null,$sub(s, 0, i));
        //}
        return String.fromCharCode.apply(null,s)
    }
    return ''+s;
};
// Special function to replace setanycolor in BWIPP.
// Converts a string of hex digits either rgb, rrggbb or ccmmyykk.
// Or CSS-style #rgb and #rrggbb.
BWIPJS.prototype.setcolor = function(s) {
    if (s instanceof Uint8Array) {
        s = this.jsstring(s);
    }
    if (!s) {
        return;
    }
    if (!/^(?:#?[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?|[0-9a-fA-F]{8})$/.test(s)) {
        throw new Error('bwip-js: invalid color: ' + s);
    }
    if (s[0] == '#') {
        s = s.substr(1);
    }
    if (s.length == 3) {
        var r = parseInt(s[0], 16);
        var g = parseInt(s[1], 16);
        var b = parseInt(s[2], 16);
        this.g_rgb = [ r<<4|r, g<<4|g, b<<4|b ];
    } else if (s.length == 6) {
        var r = parseInt(s.substr(0,2), 16);
        var g = parseInt(s.substr(2,2), 16);
        var b = parseInt(s.substr(4,2), 16);
        this.g_rgb = [ r, g, b ];
    } else {
        var c = parseInt(s.substr(0,2), 16) / 255;
        var m = parseInt(s.substr(2,2), 16) / 255;
        var y = parseInt(s.substr(4,2), 16) / 255;
        var k = parseInt(s.substr(6,2), 16) / 255;
        var r = round((1-c) * (1-k) * 255);
        var g = round((1-m) * (1-k) * 255);
        var b = round((1-y) * (1-k) * 255);
        this.g_rgb = [ r, g, b ];
    }
};
// Used only by swissqrcode
BWIPJS.prototype.setrgbcolor = function(r,g,b) {
    this.g_rgb = [ r, g, b ];
};
// Returns the current rgb values as a 'RRGGBB'
BWIPJS.prototype.getRGB = function() {
    var r = this.g_rgb[0].toString(16);
    var g = this.g_rgb[1].toString(16);
    var b = this.g_rgb[2].toString(16);
    return '00'.substr(r.length) + r + '00'.substr(g.length) + g + '00'.substr(b.length) + b;
};
BWIPJS.prototype.newpath = function() {
    this.g_path = [];
};
BWIPJS.prototype.closepath = function() {
    var path = this.g_path;
    var plen = path.length;
    if (!plen) return;

    var f = plen-1;
    for ( ; f >= 0 && path[f].op == 'l'; f--);
    f++;
    if (f < plen-1) {
        var poly = [];
        var xmin = Infinity;
        var ymin = Infinity;
        var xmax = -Infinity;
        var ymax = -Infinity;
        for (var i = f; i < plen; i++) {
            var a = path[i];
            poly.push([ a.x0, a.y0 ]);
            if (xmin > a.x0) xmin = a.x0;
            if (xmax < a.x0) xmax = a.x0;
            if (ymin > a.y0) ymin = a.y0;
            if (ymax < a.y0) ymax = a.y0;
        }
        var a = path[plen-1];
        var b = path[f];
        if (a.x1 != b.x0 || a.y1 != b.y0) {
            poly.push([ a.x1, a.y1 ]);
            if (xmin > a.x1) xmin = a.x1;
            if (xmax < a.x1) xmax = a.x1;
            if (ymin > a.y1) ymin = a.y1;
            if (ymax < a.y1) ymax = a.y1;
        }
        path.splice(f, plen-f,
                    { op:'p', x0:xmin, y0:ymin, x1:xmax, y1:ymax, poly:poly });
    } else {
        path.push({ op:'c' });
    }
};
BWIPJS.prototype.moveto = function(x,y) {
    this.g_posx = this.g_m0 * x + this.g_m2 * y + this.g_m4;
    this.g_posy = this.g_m1 * x + this.g_m3 * y + this.g_m5;
};
BWIPJS.prototype.rmoveto = function(x,y) {
    this.g_posx += this.g_m0 * x + this.g_m2 * y + this.g_m4;
    this.g_posy += this.g_m1 * x + this.g_m3 * y + this.g_m5;
};
BWIPJS.prototype.lineto = function(x,y) {
    var x0 = round(this.g_posx);
    var y0 = round(this.g_posy);
    this.g_posx = this.g_m0 * x + this.g_m2 * y + this.g_m4;
    this.g_posy = this.g_m1 * x + this.g_m3 * y + this.g_m5;
    var x1 = round(this.g_posx);
    var y1 = round(this.g_posy);

    this.g_path.push({ op:'l', x0:x0, y0:y0, x1:x1, y1:y1 });
};
BWIPJS.prototype.rlineto = function(x,y) {
    var x0 = round(this.g_posx);
    var y0 = round(this.g_posy);
    this.g_posx += this.g_m0 * x + this.g_m2 * y + this.g_m4;
    this.g_posy += this.g_m1 * x + this.g_m3 * y + this.g_m5;
    var x1 = round(this.g_posx);
    var y1 = round(this.g_posy);

    this.g_path.push({ op:'l', x0:x0, y0:y0, x1:x1, y1:y1 });
};
// implements both arc and arcn
BWIPJS.prototype.arc = function(x,y,r,sa,ea,ccw) {
    if (sa == ea) {
        return;
    }
    // For now, we only implement full circles...
    if (sa != 0 && sa != 360 || ea != 0 && ea != 360) {
        throw new Error('arc: not a full circle (' + sa + ',' + ea + ')');
    }

    var xx = this.g_m0 * x + this.g_m2 * y + this.g_m4;
    var yy = this.g_m1 * x + this.g_m3 * y + this.g_m5;

    // e == ellipse
    var rx = r * this.g_tsx;
    var ry = r * this.g_tsy;
    this.g_path.push({ op:'e', x0:xx-rx, y0:yy-ry, x1:xx+rx, y1:yy+ry,
                       x:xx, y:yy, rx:rx, ry:ry, sa:sa, ea:ea, ccw:ccw });
};
BWIPJS.prototype.stringwidth = function(str) {
    var tsx  = this.g_tsx;
    var tsy  = this.g_tsy;
    var size = +this.g_font.FontSize || 10;

    // The string can be either a uint8-string or regular string
    str = this.toUCS2(this.jsstring(str));

    var bbox = this.drawing.measure(str, this.g_font.FontName, size*tsx, size*tsy);

    return { w:bbox.width/tsx, h:(bbox.ascent+bbox.descent)/tsy,
             a:bbox.ascent/tsy, d:bbox.descent/tsy };
};
BWIPJS.prototype.charpath = function(str, b) {
    var sw = this.stringwidth(str);

    // Emulate the char-path by placing a rectangle around it
    this.rlineto(0, sw.a);
    this.rlineto(sw.w, 0);
    this.rlineto(0, -sw.h);
};
BWIPJS.prototype.pathbbox = function() {
    if (!this.g_path.length)    throw new Error('pathbbox: --nocurrentpoint--');
    var path = this.g_path;
    var llx = Infinity;
    var lly = Infinity;
    var urx = -Infinity;
    var ury = -Infinity;
    for (var i = 0; i < path.length; i++) {
        var a = path[i];
        if (a.op == 'c') {
            continue;
        }
        if (a.x0 < a.x1) {
            if (llx > a.x0) llx = a.x0;
            if (urx < a.x1) urx = a.x1;
        } else {
            if (llx > a.x1) llx = a.x1;
            if (urx < a.x0) urx = a.x0;
        }
        if (a.y0 < a.y1) {
            if (lly > a.y0) lly = a.y0;
            if (ury < a.y1) ury = a.y1;
        } else {
            if (lly > a.y1) lly = a.y1;
            if (ury < a.y0) ury = a.y0;
        }
    }

    // Convert to user-space coordinates
    var rv = {  llx:(llx-this.g_m4)/this.g_tsx,
                lly:(lly-this.g_m5)/this.g_tsy,
                urx:(urx-this.g_m4)/this.g_tsx,
                ury:(ury-this.g_m5)/this.g_tsy };
    return rv;
};
// Tranforms the pts array to standard (not y-inverted), unscalled values.
BWIPJS.prototype.transform = function(pts) {
    var minx = this.minx;
    var maxy = this.maxy;

    for (var i = 0; i < pts.length; i++) {
        var pt = pts[i];
        pt[0] = pt[0] - minx;
        pt[1] = maxy - pt[1];
    }
};
BWIPJS.prototype.stroke = function() {
    var tsx  = this.g_tsx;
    var tsy  = this.g_tsy;
    var path = this.g_path;
    var rgb  = this.getRGB();
    this.g_path = [];

    // This is a "super majority" round i.e. if over .66 round up.
    var penw = floor(this.g_penw * tsx + 0.66);
    var penh = floor(this.g_penw * tsy + 0.66);

    // Calculate the bounding boxes
    var nlines = 0, npolys = 0;
    for (var i = 0; i < path.length; i++) {
        var a = path[i];
        if (a.op == 'l') {
            // We only stroke vertical and horizontal lines.  Complex shapes are
            // always filled.
            if (a.x0 != a.x1 && a.y0 != a.y1) {
                throw new Error('stroke: --not-orthogonal--');
            }
            var x0 = a.x0;
            var y0 = a.y0;
            var x1 = a.x1;
            var y1 = a.y1;

            // Half widths (may be factional)
            var penw2 = penw/2;
            var penh2 = penh/2;

            if (x0 > x1) { var t = x0; x0 = x1; x1 = t; }
            if (y0 > y1) { var t = y0; y0 = y1; y1 = t; }
            if (x0 == x1) {
                this.bbox(x0-penw2, y0, x0+penw-penw2-1, y1);   // vertical line
            } else {
                this.bbox(x0, y0-penh+penh2+1, x1, y1+penh2);   // horizontal line
            }
            nlines++;
        } else if (a.op == 'p') {
            // Closed (rectangular) poly (border around the barcode)
            var minx = Infinity;
            var miny = Infinity;
            var maxx = -Infinity;
            var maxy = -Infinity;
            var pts  = a.poly;
            if (pts.length != 4) {
                throw new Error('stroke: --not-a-rect--');
            }
            for (var i = 0, j = pts.length-1; i < pts.length; j = i++) {
                var xj = pts[j][0];
                var yj = pts[j][1];
                var xi = pts[i][0];
                var yi = pts[i][1];

                if (xi != xj && yi != yj) {
                    throw new Error('stroke: --not-orthogonal--');
                }

                if (xi < minx) minx = xi;
                if (xi > maxx) maxx = xi;
                if (yi < miny) miny = yi;
                if (yi > maxy) maxy = yi;
            }

            // Half widths (integer)
            var penw2 = ceil(penw/2);
            var penh2 = ceil(penh/2);

            // We render these as two polygons plus a fill.
            // When border width is odd, allocate the bigger half to the outside.
            this.bbox(minx-penw2, miny-penh2, maxx+penw2, maxy+penh2);
            npolys++;
        } else {
            throw new Error('stroke: --not-a-line--');
        }
    }

    // Draw the lines
    var self = this;
    this.cmds.push(function() {
        // Half widths (big half and remaining half)
        var bigw2 = ceil(penw/2);
        var bigh2 = ceil(penh/2);
        var remw2 = penw - bigw2;
        var remh2 = penh - bigh2;

        for (var i = 0; i < path.length; i++) {
            var a = path[i]
            if (a.op == 'l') {
                var pts = [ [ a.x0, a.y0 ], [ a.x1, a.y1 ] ];
                self.transform(pts);
                self.drawing.line(pts[0][0], pts[0][1], pts[1][0], pts[1][1],
                            a.x0 == a.x1 ? penw : penh, rgb);
                self.fill(rgb);
            } else {
                var pts = a.poly;
                self.transform(pts);
                var x0 = min(pts[0][0], pts[2][0]);
                var x1 = max(pts[0][0], pts[2][0]);
                var y0 = min(pts[0][1], pts[2][1]);
                var y1 = max(pts[0][1], pts[2][1]);

                // Top and left edges are "inside" the polygon.
                // Bottom and right edges are outside.

                // outside, counter-clockwise
                self.drawing.polygon([
                        [ x0-bigw2, y0-bigh2 ],
                        [ x0-bigw2, y1+bigh2+1 ],
                        [ x1+bigw2+1, y1+bigh2+1 ],
                        [ x1+bigw2+1, y0-bigh2 ],
                    ]);
                // inside, clockwise
                self.drawing.polygon([
                        [ x0+remw2, y0+remh2 ],
                        [ x1-remw2+1, y0+remh2 ],
                        [ x1-remw2+1, y1-remh2+1 ],
                        [ x0+remw2, y1-remh2+1 ],
                    ]);
                self.drawing.fill(rgb);
            }
        }
    });
};
BWIPJS.prototype.fill = function() {
    var path = this.g_path;
    var rgb  = this.getRGB();
    this.g_path = [];

    // Calculate the bounding boxes
    for (var p = 0; p < path.length; p++) {
        var a = path[p];
        if (a.op == 'p') {  // polygon
            var minx = Infinity;
            var miny = Infinity;
            var maxx = -Infinity;
            var maxy = -Infinity;
            var pts  = a.poly;
            for (var i = 0; i < pts.length; i++) {
                var xi = pts[i][0];
                var yi = pts[i][1];

                if (xi < minx) minx = xi;
                if (xi > maxx) maxx = xi;
                if (yi < miny) miny = yi;
                if (yi > maxy) maxy = yi;
            }
            // With polygons, the right and bottom edges are "outside" and do not
            // contribute to the bounding box.  But we are in postscript inverted-y
            // mode.
            this.bbox(minx, miny+1, maxx-1, maxy);
        } else if (a.op == 'e') {   // ellipse
            this.bbox(a.x - a.rx, a.y - a.ry, a.x + a.rx, a.y + a.ry);
        } else {
            throw new Error('fill: --not-a-polygon--');
        }
    }

    // Render the poly
    var self = this;
    this.cmds.push(function() {
        for (var i = 0; i < path.length; i++) {
            var a = path[i];
            if (a.op == 'p') {
                var pts = a.poly
                self.transform(pts);
                self.drawing.polygon(pts);
            } else if (a.op == 'e') {
                var pts = [ [ a.x, a.y ] ];
                self.transform(pts);
                self.drawing.ellipse(pts[0][0], pts[0][1], a.rx, a.ry, a.ccw);
            }
        }
        self.drawing.fill(rgb);
    });
};
BWIPJS.prototype.clip = function() {
    var path = this.g_path;
    this.g_path = [];
    this.g_clip = true;

    var self = this;
    this.cmds.push(function() {
        var polys = [];
        for (var i = 0; i < path.length; i++) {
            var a = path[i];
            if (a.op == 'p') {
                var pts = a.poly
                self.transform(pts);
                polys.push(pts);
            } else {
                throw new Error('clip: only polygon regions supported');
            }
        }
        self.drawing.clip(polys);
    });
};

// Our replacement for the renmatrix drawlayer functionality.
BWIPJS.prototype.drawlayer = function(pix, width, height) {
    // The pix array is in y-inverted postscript orientation.
    let paths = tracepaths(pix, width, height);

    this.newpath();
    for (let i = 0, il = paths.length; i < il; i++) {
        let path = paths[i];
        this.moveto(path[0][0], path[0][1]);
        for (let j = 1, jl = path.length; j < jl; j++) {
            let pt = path[j];
            this.lineto(pt[0], pt[1]);
        }
        this.closepath();
    }
    this.fill();
};

// The pix array is in standard (not y-inverted postscript) orientation.
BWIPJS.prototype.showmaxicode = function(pix) {
    var tsx = this.g_tsx;
    var tsy = this.g_tsy;
    var rgb = this.getRGB();

    // Module width.  Module height is an integer multiple of tsy.
    var twidth = 1.04 * tsx * 100;
    var mwidth = (twidth / 30)|0;
    if (twidth - (mwidth*30-1) > 9) {
        mwidth++;
    }

    // Dimensions needed for plotting the hexagons.  These must be integer values.
    var w, h, wgap, hgap;
    // if (opts.??? ) {
    //  // Create a one or two pixel gap
    //  wgap = (mwidth & 1) ? 1 : 2;
    //  hgap = 1;
    //  w = mwidth - gap;
    //  h = 4 * tsy;
    // } else {
        // Create a 1/8mm gap
        wgap = (tsx/2)|0;
        hgap = (tsy/2)|0;
        w = mwidth - wgap;
        if (w & 1) {
            w--;
        }
        h = ((4*tsy)|0) - hgap;
    //}

    // These must be integer values
    var w2 = w / 2 - 1;         // half width
    var qh = ((w2+1) / 2)|0;    // quarter height
    var vh = h - 2 - 2 * qh;    // side height

    // Bounding box
    this.bbox(0, 0, mwidth*30 - wgap, tsy * 3 * 32 + tsy * 4 - hgap);

    // Render the elements
    var self = this;
    this.cmds.push(function() {
        // Draw the hexagons
        for (var i = 0; i < pix.length; i++) {
            var c = pix[i];
            var x = c % 30;
            var y = (c / 30)|0;

            // Adjust x,y to the top of hexagon
            x *= mwidth;
            x += (y & 1) ? mwidth : mwidth/2;
            x = x|0;

            y = 33 - y; // invert for postscript notation
            y *= tsy * 3;
            y += tsy * 2 - h/2;
            y = y|0;

            // Build bottom up so the drawing is top-down.
            var pts = [ [ x-0.5, y-- ] ];
            y -= qh-1;
            pts.push([x-1-w2, y--]);
            y -= vh;
            pts.push([x-1-w2, y--]);
            y -= qh-1;
            pts.push([x-0.5, y++]);
            y += qh-1;
            pts.push([x+w2, y++]);
            y += vh;
            pts.push([x+w2, y++]);

            self.transform(pts);
            self.drawing.hexagon(pts, rgb);
        }
        self.drawing.fill(rgb);


        // Draw the rings
        var x = (14 * mwidth + mwidth/2 + 0.01)|0;
        var y = ((12 * 4 + 3) * tsy - qh/2 + 0.01)|0;
        self.drawing.ellipse(x, y, (0.5774*3.5*tsx+0.01)|0, (0.5774*3.5*tsy+0.01)|0, true);
        self.drawing.ellipse(x, y, (1.3359*3.5*tsx+0.01)|0, (1.3359*3.5*tsy+0.01)|0, false);
        self.drawing.fill(rgb);
        self.drawing.ellipse(x, y, (2.1058*3.5*tsx+0.01)|0, (2.1058*3.5*tsy+0.01)|0, true);
        self.drawing.ellipse(x, y, (2.8644*3.5*tsx+0.01)|0, (2.8644*3.5*tsy+0.01)|0, false);
        self.drawing.fill(rgb);
        self.drawing.ellipse(x, y, (3.6229*3.5*tsx+0.01)|0, (3.6229*3.5*tsy+0.01)|0, true);
        self.drawing.ellipse(x, y, (4.3814*3.5*tsx+0.01)|0, (4.3814*3.5*tsy+0.01)|0, false);
        self.drawing.fill(rgb);

    });
};
// UTF-8 to UCS-2 (no surrogates)
BWIPJS.prototype.toUCS2 = function(str) {
    return str.replace(/[\xc0-\xdf][\x80-\xbf]|[\xe0-\xff][\x80-\xbf]{2}/g,
                      function(s) {
                          var code;
                          if (s.length == 2) {
                              code = ((s.charCodeAt(0)&0x1f)<<6)|
                                     (s.charCodeAt(1)&0x3f);
                          } else {
                              code = ((s.charCodeAt(0)&0x0f)<<12)|
                                     ((s.charCodeAt(1)&0x3f)<<6)|
                                     (s.charCodeAt(2)&0x3f);
                          }
                          return String.fromCharCode(code);
                      });
};
// dx,dy are inter-character gaps
BWIPJS.prototype.show = function(str, dx, dy) {
    if (!str.length) {
        return;
    }

    // Capture current graphics state
    var rot  = this.g_rot;
    var tsx  = rot == 90 || rot == 270 ? this.g_tsy : this.g_tsx;
    var tsy  = rot == 90 || rot == 270 ? this.g_tsx : this.g_tsy;
    var name = this.g_font.FontName || 'OCR-B';
    var size = (this.g_font.FontSize || 10);
    var szx  = size * tsx;
    var szy  = size * tsy;
    var posx = this.g_posx;
    var posy = this.g_posy;
    var rgb  = this.getRGB();

    // Convert dx,dy to device space
    dx = tsx * dx || 0;
    dy = tsy * dy || 0;

    // The string can be either a uint8-string or regular string.
    str = this.toUCS2(this.jsstring(str));

    // Bounding box.
    // BWIPP rotates, then translates to currentpoint, before rendering the text.
    // Therefore, the bbox values must match the rotation.
    var bbox = this.drawing.measure(str, name, szx, szy);
    var width = bbox.width + (str.length-1) * dx;
    if (rot == 90) { // upward
        this.bbox(posx-dy+bbox.descent-1, posy, posx-dy-bbox.ascent, posy+width-1);
    } else if (rot == 180) { // backward
        this.bbox(posx, posy-dy+bbox.descent-1, posx-width+1, posy-dy-bbox.ascent);
    } else if (rot == 270) { // downward
        this.bbox(posx+dy-bbox.descent+1, posy, posx+dy+bbox.ascent, posy-width+1);
    } else {
        rot = 0;
        this.bbox(posx, posy+dy-bbox.descent+1, posx+width-1, posy+dy+bbox.ascent);
        this.g_posx += width;
    }

    var self = this;
    self.cmds.push(function() {
        var x = posx - self.minx;
        var y = self.maxy - posy;
        self.drawing.text(x, y, str, rgb, { name:name, width:szx, height:szy, rotate:rot, dx:dx });
    });
};
// drawing surface bounding box
BWIPJS.prototype.bbox = function(x0, y0, x1, y1) {
    if (x0 > x1) { var t = x0; x0 = x1; x1 = t; }
    if (y0 > y1) { var t = y0; y0 = y1; y1 = t; }

    x0 = floor(x0);
    y0 = floor(y0);
    x1 = ceil(x1);
    y1 = ceil(y1);

    if (this.minx > x0) this.minx = x0;
    if (this.maxx < x1) this.maxx = x1;
    if (this.miny > y0) this.miny = y0;
    if (this.maxy < y1) this.maxy = y1;
};
BWIPJS.prototype.render = function() {
    if (this.minx === Infinity) {
        // Most likely, `dontdraw` was set in the options
        return false;
    }
    // Draw the image
    this.drawing.init(this.maxx - this.minx + 1, this.maxy - this.miny + 1,
                      this.g_tsx, this.g_tsy);
    for (var i = 0, l = this.cmds.length; i < l; i++) {
        this.cmds[i]();
    }
    return this.drawing.end();
};

return BWIPJS;
})();   // BWIPJS closure


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


    return api;
});
