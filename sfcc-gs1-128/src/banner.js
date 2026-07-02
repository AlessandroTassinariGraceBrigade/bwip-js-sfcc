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
