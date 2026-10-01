/**
 * Minimal, dependency-free QR Code encoder (byte mode, EC level M).
 *
 * Purpose: certificate verification URLs must be encoded without sending them to
 * a third-party QR service, so the PDF renderer and the live preview both use
 * this local implementation. Produces a boolean matrix suitable for canvas,
 * SVG or an inline PNG data URL.
 *
 * Supports versions 1–10 at EC level M, which comfortably covers the
 * verification URLs used by this project (e.g. https://host/verify/v_<48 hex>).
 */

// -- GF(256) arithmetic tables for Reed-Solomon ---------------------------
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // primitive polynomial for QR
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Reed-Solomon generator polynomial of the given degree. */
function rsGeneratorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** Remainder of data * generator — the error correction codewords. */
function rsEncode(data, ecLen) {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ res[0];
    res.shift();
    res.push(0);
    for (let j = 0; j < ecLen; j++) res[j] ^= gfMul(gen[j + 1], factor);
  }
  return res;
}

// -- Version / block parameters (EC level M) -------------------------------
// total codewords, EC codewords per block, group1 blocks, group2 blocks.
const VERSIONS = {
  1:  { total: 26,   ec: 10, g1: 1, g1Data: 16,  g2: 0, g2Data: 0,  align: [] },
  2:  { total: 44,   ec: 16, g1: 1, g1Data: 28,  g2: 0, g2Data: 0,  align: [6, 18] },
  3:  { total: 70,   ec: 26, g1: 1, g1Data: 44,  g2: 0, g2Data: 0,  align: [6, 22] },
  4:  { total: 100,  ec: 18, g1: 2, g1Data: 32,  g2: 0, g2Data: 0,  align: [6, 26] },
  5:  { total: 134,  ec: 24, g1: 2, g1Data: 43,  g2: 0, g2Data: 0,  align: [6, 30] },
  6:  { total: 172,  ec: 16, g1: 4, g1Data: 27,  g2: 0, g2Data: 0,  align: [6, 34] },
  7:  { total: 196,  ec: 18, g1: 4, g1Data: 31,  g2: 0, g2Data: 0,  align: [6, 22, 38] },
  8:  { total: 242,  ec: 22, g1: 2, g1Data: 38,  g2: 2, g2Data: 39, align: [6, 24, 42] },
  9:  { total: 292,  ec: 22, g1: 3, g1Data: 36,  g2: 2, g2Data: 37, align: [6, 26, 46] },
  10: { total: 346,  ec: 26, g1: 4, g1Data: 43,  g2: 1, g2Data: 44, align: [6, 28, 50] },
};

const EC_FORMAT_BITS = 0b00; // level M

function utf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') return Array.from(new TextEncoder().encode(str));
  return Array.from(unescape(encodeURIComponent(str)), (c) => c.charCodeAt(0));
}

function pickVersion(byteLength) {
  for (let v = 1; v <= 10; v++) {
    const capacityBits = VERSIONS[v].g1Data * VERSIONS[v].g1 +
      VERSIONS[v].g2Data * VERSIONS[v].g2;
    const lengthBits = v < 10 ? 8 : 16; // character count indicator for byte mode
    const needed = 4 + lengthBits + byteLength * 8;
    if (needed <= capacityBits * 8) return v;
  }
  throw new Error('Data too long for QR encoding');
}

/** Build the final interleaved codeword stream for the chosen version. */
function buildCodewords(bytes, version) {
  const p = VERSIONS[version];
  const lengthBits = version < 10 ? 8 : 16;

  const bits = [];
  const push = (value, len) => {
    for (let i = len - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4);              // byte mode indicator
  push(bytes.length, lengthBits);
  for (const b of bytes) push(b, 8);

  const totalDataBits = p.g1Data * p.g1 * 8 + p.g2Data * p.g2 * 8;
  // Terminator + byte alignment
  for (let i = 0; i < 4 && bits.length < totalDataBits; i++) bits.push(0);
  while (bits.length % 8 !== 0) bits.push(0);

  const dataWords = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
    dataWords.push(byte);
  }

  // Pad codewords alternate between the two specified filler values.
  const PAD = [0xec, 0x11];
  let padIndex = 0;
  while (dataWords.length < (p.g1Data * p.g1 + p.g2Data * p.g2)) {
    dataWords.push(PAD[padIndex++ % 2]);
  }

  // Split into blocks, compute EC per block, then interleave.
  const blocks = [];
  const ecLen = p.ec;
  let offset = 0;
  for (let i = 0; i < p.g1 + p.g2; i++) {
    const size = i < p.g1 ? p.g1Data : p.g2Data;
    const chunk = dataWords.slice(offset, offset + size);
    offset += size;
    blocks.push({ data: chunk, ec: rsEncode(chunk, ecLen) });
  }

  const result = [];
  const maxData = Math.max(p.g1Data, p.g2Data);
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.data.length) result.push(b.data[i]);
  }
  for (let i = 0; i < ecLen; i++) {
    for (const b of blocks) result.push(b.ec[i]);
  }
  return result;
}

/** Lays the codeword stream into a module matrix with function patterns placed. */
function buildMatrix(version) {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved = Array.from({ length: size }, () => new Array(size).fill(false));

  const setFn = (r, c, value) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    modules[r][c] = value;
    reserved[r][c] = true;
  };

  // Finder patterns + separators
  for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = fr + r, cc = fc + c;
        if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
        const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                       (c >= 0 && c <= 6 && (r === 0 || r === 6));
        const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        setFn(rr, cc, inRing || inCore ? 1 : 0);
      }
    }
  }

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    setFn(6, i, i % 2 === 0 ? 1 : 0);
    setFn(i, 6, i % 2 === 0 ? 1 : 0);
  }

  // Alignment patterns
  const centers = VERSIONS[version].align;
  for (const r of centers) {
    for (const c of centers) {
      if ((r <= 8 && c <= 8) || (r <= 8 && c >= size - 9) || (r >= size - 9 && c <= 8)) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const onRing = Math.max(Math.abs(dr), Math.abs(dc)) !== 1;
          setFn(r + dr, c + dc, onRing ? 1 : 0);
        }
      }
    }
  }

  // Dark module
  setFn(size - 8, 8, 1);

  // Reserve format information areas (values written after masking)
  for (let i = 0; i < 9; i++) {
    if (modules[8][i] === null) setFn(8, i, 0);
    if (modules[i][8] === null) setFn(i, 8, 0);
  }
  for (let i = 0; i < 8; i++) {
    if (modules[8][size - 1 - i] === null) setFn(8, size - 1 - i, 0);
    if (modules[size - 1 - i][8] === null) setFn(size - 1 - i, 8, 0);
  }

  // Version information (version 7+)
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3);
      const c = (i % 3) + size - 11;
      setFn(r, c, 0);
      setFn(c, r, 0);
    }
  }

  return { modules, reserved, size };
}

/** BCH(15,5) format information: 2 EC-level bits + 3 mask bits, then BCH + mask pattern. */
function formatBits(mask) {
  const value = (EC_FORMAT_BITS << 3) | (mask & 0b111); // 5 data bits
  let rem = value;
  for (let i = 0; i < 10; i++) {
    rem = (rem << 1) ^ (((rem >>> 9) & 1) * 0x537);
  }
  return ((value << 10) | rem) ^ 0x5412;
}

function writeFormatBits(modules, size, mask) {
  const bits = formatBits(mask);
  const bit = (i) => (bits >>> i) & 1;

  // ISO/IEC 18004: bit 14 (MSB) sits closest to the outer corner, bit 0 (LSB) inward.
  // First copy — wraps the top-left finder pattern.
  for (let i = 0; i <= 5; i++) modules[8][i] = bit(14 - i); // (8,0)..(8,5) = bits 14..9
  modules[8][7] = bit(8);
  modules[8][8] = bit(7);
  modules[7][8] = bit(6);
  for (let i = 0; i <= 4; i++) modules[5 - i][8] = bit(5 - i); // (5,8)..(1,8) = bits 5..1
  modules[0][8] = bit(0);

  // Second copy — splits between the bottom-left and top-right finders.
  for (let i = 0; i <= 6; i++) modules[size - 1 - i][8] = bit(14 - i); // bits 14..8
  for (let i = 0; i <= 7; i++) modules[8][size - 8 + i] = bit(7 - i); // bits 7..0

  modules[size - 8][8] = 1; // permanently dark module
}

function writeVersionBits(modules, size, version) {
  if (version < 7) return;
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ (((rem >>> 11) & 1) * 0x1f25);
  const bits = (version << 12) | rem;
  for (let i = 0; i < 18; i++) {
    const bit = (bits >>> i) & 1;
    const r = Math.floor(i / 3);
    const c = (i % 3) + size - 11;
    modules[r][c] = bit;
    modules[c][r] = bit;
  }
}

/** Fills data modules in the standard zig-zag order, applying the given mask. */
function placeData(modules, reserved, size, codewords, mask) {
  let bitIndex = 0;
  const totalBits = codewords.length * 8;

  const maskFn = (r, c) => {
    switch (mask) {
      case 0: return (r + c) % 2 === 0;
      case 1: return r % 2 === 0;
      case 2: return c % 3 === 0;
      case 3: return (r + c) % 3 === 0;
      case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      default: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    }
  };

  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--; // skip the vertical timing column
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (reserved[row][c]) continue;
        let bit = 0;
        if (bitIndex < totalBits) {
          bit = (codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1;
          bitIndex++;
        }
        modules[row][c] = (bit ^ (maskFn(row, c) ? 1 : 0)) & 1;
      }
    }
    upward = !upward;
  }
}

function penalty(modules, size) {
  let score = 0;

  // Rule 1: runs of 5+ identical modules
  for (let i = 0; i < size; i++) {
    let runH = 1, runV = 1;
    for (let j = 1; j < size; j++) {
      runH = modules[i][j] === modules[i][j - 1] ? runH + 1 : 1;
      if (runH === 5) score += 3; else if (runH > 5) score += 1;
      runV = modules[j][i] === modules[j - 1][i] ? runV + 1 : 1;
      if (runV === 5) score += 3; else if (runV > 5) score += 1;
    }
  }

  // Rule 2: 2x2 blocks of the same colour
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) {
        score += 3;
      }
    }
  }

  // Rule 3: finder-like 1:1:3:1:1 patterns with 4-module light margin
  const pattern = [1, 0, 1, 1, 1, 0, 1];
  const matches = (get, start) => {
    let hit = true;
    for (let k = 0; k < 7; k++) if (get(start + k) !== pattern[k]) { hit = false; break; }
    return hit;
  };
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - 7; j++) {
      if (matches((k) => modules[i][k], j)) {
        const beforeClear = j >= 4 && [0, 1, 2, 3].every((k) => modules[i][j - 1 - k] === 0);
        const afterClear = j + 11 <= size && [0, 1, 2, 3].every((k) => modules[i][j + 7 + k] === 0);
        if (beforeClear || afterClear) score += 40;
      }
      if (matches((k) => modules[k][i], j)) {
        const beforeClear = j >= 4 && [0, 1, 2, 3].every((k) => modules[j - 1 - k][i] === 0);
        const afterClear = j + 11 <= size && [0, 1, 2, 3].every((k) => modules[j + 7 + k][i] === 0);
        if (beforeClear || afterClear) score += 40;
      }
    }
  }

  // Rule 4: balance of dark modules
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += modules[r][c];
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * Encodes `text` and returns the QR module matrix.
 * @param {string} text
 * @returns {{ size: number, modules: number[][], version: number }}
 */
export function encodeQR(text) {
  const bytes = utf8Bytes(String(text));
  const version = pickVersion(bytes.length);
  const codewords = buildCodewords(bytes, version);

  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const { modules, reserved, size } = buildMatrix(version);
    placeData(modules, reserved, size, codewords, mask);
    writeFormatBits(modules, size, mask);
    writeVersionBits(modules, size, version);
    const score = penalty(modules, size);
    if (!best || score < best.score) best = { score, modules, size };
  }

  return { size: best.size, modules: best.modules, version };
}

/**
 * Renders a QR code as a self-contained SVG string (scannable at print size).
 * @param {string} text
 * @param {{ margin?: number, dark?: string, light?: string }} [options]
 */
export function qrToSvg(text, options = {}) {
  const { margin = 2, dark = '#0F1B33', light = '#FFFFFF' } = options;
  const { size, modules } = encodeQR(text);
  const dim = size + margin * 2;

  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) path += `M${c + margin},${r + margin}h1v1h-1z`;
    }
  }

  // viewBox-only on purpose: no width/height attributes, so the same markup can be
  // scaled by CSS in the preview and by the PDF print engine without blurring.
  // Callers that need intrinsic size should read `dim` from the viewBox.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" ` +
    `shape-rendering="crispEdges">` +
    `<rect width="${dim}" height="${dim}" fill="${light}"/>` +
    `<path d="${path}" fill="${dark}"/>` +
    `</svg>`
  );
}

export default { encodeQR, qrToSvg };