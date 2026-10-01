/**
 * Shared certificate renderer.
 *
 * `renderCertificateHtml(design, values)` is the single source of truth for how a
 * certificate looks. The admin live preview renders this exact HTML inside a
 * sandboxed iframe, and the `generate-certificate-pdf` Edge Function renders the
 * same string in Chromium to produce the PDF — so the preview cannot drift from
 * the printed artefact.
 *
 * Everything is expressed in physical units (mm) against a fixed page box so
 * Chromium's print pipeline reproduces the design at true A4/Letter size.
 *
 * This module must stay free of Deno and browser globals so it can be bundled
 * for both targets.
 */

import { qrToSvg } from './qrcode.js';

export const PAGE_SIZES = {
  A4: { landscape: { w: 297, h: 210 }, portrait: { w: 210, h: 297 } },
  Letter: { landscape: { w: 279.4, h: 215.9 }, portrait: { w: 215.9, h: 279.4 } },
};

export const DEFAULT_DESIGN = {
  schemaVersion: 1,
  palette: {
    background: '#FFFFFF',
    accent: '#F5A623',
    text: '#0F1B33',
    muted: '#64748B',
    border: '#F5A623',
    band: '#0F1B33',
  },
  typography: {
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    headingWeight: 700,
    recipientFont: 'Playfair Display',
    recipientWeight: 700,
    recipientSize: 46,
    recipientColor: '#0F1B33',
    recipientUnderline: true,
    headingSize: 15,
    letterSpacing: 6,
  },
  frame: { style: 'double', thickness: 3, inset: 14, radius: 6, ornament: true },
  header: {
    showLogo: true,
    logoHeight: 54,
    organizationSize: 30,
    tagline: '',
    align: 'center',
  },
  content: {
    eyebrow: '',
    intro: 'This is to certify that',
    awardPrefix: '',
    description: '',
    criteria: '',
    showDate: true,
    align: 'center',
  },
  signatures: { show: true, gap: 40 },
  footer: { showQr: true, qrSize: 26, showCertificateId: true, showVerifyUrl: true },
};

const CERT_TYPES = {
  course_completion: 'Certificate of Course Completion',
  internship: 'Certificate of Internship',
  participation: 'Certificate of Participation',
  achievement: 'Certificate of Achievement',
  appreciation: 'Certificate of Appreciation',
  custom: 'Certificate',
};

const FONT_STACKS = {
  'Playfair Display': `'Playfair Display', Georgia, 'Times New Roman', serif`,
  Inter: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`,
  Poppins: `Poppins, 'Segoe UI', Helvetica, Arial, sans-serif`,
  'Cormorant Garamond': `'Cormorant Garamond', Georgia, serif`,
  Lato: `Lato, 'Segoe UI', Helvetica, Arial, sans-serif`,
  Georgia: `Georgia, 'Times New Roman', serif`,
  'Times New Roman': `'Times New Roman', Times, serif`,
  Arial: `Arial, Helvetica, sans-serif`,
  'Great Vibes': `'Great Vibes', 'Brush Script MT', cursive`,
};

export function fontStack(name) {
  return FONT_STACKS[name] || FONT_STACKS.Inter;
}

// Every family the editor can offer, with the weight ranges the renderer uses.
// The CSS2 API requires weight ranges to be sorted and semicolon-free inside a
// single `family=` token, and family names to be `+`-separated — building the URL
// by naive concatenation produced a stylesheet that silently 400'd, which made
// every certificate render in a fallback font in both the preview and the PDF.
const GOOGLE_FONTS = [
  'Playfair+Display:wght@400;500;600;700;800',
  'Inter:wght@300;400;500;600;700',
  'Poppins:wght@300;400;500;600;700',
  'Cormorant+Garamond:wght@400;500;600;700',
  'Lato:wght@300;400;700',
  'Great+Vibes',
];

function googleFontsUrl() {
  const families = GOOGLE_FONTS.map((f) => `family=${f}`).join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=block`;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only allow http(s)/data URIs so a template cannot inject javascript: URLs. */
function safeUrl(url) {
  if (!url) return '';
  const value = String(url).trim();
  if (/^(https?:|data:image\/)/i.test(value)) return value;
  return '';
}

/**
 * Design values land directly inside a <style> block, so a colour string must not
 * be able to terminate the declaration and append its own rules. Restricting to
 * hex, rgb()/rgba()/hsl()/hsla() and CSS keywords makes that impossible.
 */
function safeColor(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-f]{3,8}$/i.test(trimmed)) return trimmed;
  if (/^(rgb|rgba|hsl|hsla)\(\s*[0-9a-z%.,\s/+-]+\)$/i.test(trimmed)) return trimmed;
  if (/^[a-z]{3,20}$/i.test(trimmed)) return trimmed;
  return fallback;
}

/** Deep-merge stored design over defaults so older/partial designs still render. */
export function normalizeDesign(design) {
  const d = design && typeof design === 'object' ? design : {};
  const out = { ...DEFAULT_DESIGN };
  for (const key of Object.keys(DEFAULT_DESIGN)) {
    const section = d[key];
    if (section && typeof section === 'object' && !Array.isArray(section)) {
      out[key] = { ...DEFAULT_DESIGN[key], ...section };
    } else if (section !== undefined) {
      out[key] = section;
    }
  }
  return out;
}

function frameCss(frame, palette) {
  const thickness = Number(frame.thickness) || 3;
  const inset = Number(frame.inset) || 14;
  const radius = Number(frame.radius) || 0;
  // frame.color overrides the palette, so it needs sanitising too. The palette
  // values are already clean, which is why palette.border is a safe fallback.
  const color = safeColor(frame.color, palette.border || palette.accent);

  switch (frame.style) {
    case 'none':
      return '';
    case 'double':
      return `border:${thickness}mm solid ${color};` +
             `box-shadow:inset 0 0 0 ${Math.max(thickness - 1.5, 0.6)}mm ${color},` +
             `inset 0 0 0 ${thickness + 1.6}mm ${color};`;
    case 'dashed':
      return `border:${thickness}mm dashed ${color};`;
    case 'dotted':
      return `border:${thickness}mm dotted ${color};`;
    case 'solid':
    default:
      return `border:${thickness}mm solid ${color};`;
  }
}

/** Decorative corner flourishes, drawn with inline SVG so they scale cleanly. */
function ornamentMarkup(color) {
  return `
    <svg class="ornament ornament--tl" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M2 40 C2 18 18 2 40 2" fill="none" stroke="${color}" stroke-width="2.5"/>
      <path d="M2 62 C2 28 28 2 62 2" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.75"/>
      <circle cx="14" cy="14" r="3.4" fill="${color}"/>
    </svg>
    <svg class="ornament ornament--tr" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M98 40 C98 18 82 2 60 2" fill="none" stroke="${color}" stroke-width="2.5"/>
      <path d="M98 62 C98 28 72 2 38 2" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.75"/>
      <circle cx="86" cy="14" r="3.4" fill="${color}"/>
    </svg>
    <svg class="ornament ornament--bl" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M2 60 C2 82 18 98 40 98" fill="none" stroke="${color}" stroke-width="2.5"/>
      <path d="M2 38 C2 72 28 98 62 98" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.75"/>
      <circle cx="14" cy="86" r="3.4" fill="${color}"/>
    </svg>
    <svg class="ornament ornament--br" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M98 60 C98 82 82 98 60 98" fill="none" stroke="${color}" stroke-width="2.5"/>
      <path d="M98 38 C98 72 72 98 38 98" fill="none" stroke="${color}" stroke-width="1.4" opacity="0.75"/>
      <circle cx="86" cy="86" r="3.4" fill="${color}"/>
    </svg>`;
}

function wrapLines(text) {
  return String(text || '')
    .split(/\n{2,}/)
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

/**
 * Builds the complete certificate document.
 *
 * @param {object} options.design    Stored template design (see DEFAULT_DESIGN).
 * @param {object} options.values    Per-certificate data.
 * @param {object} [options.page]    `{ size, orientation }`.
 * @param {boolean} [options.interactive] Adds fonts.ready hook for the browser preview.
 */
export function renderCertificateHtml(options) {
  const design = normalizeDesign(options.design);
  const v = options.values || {};
  const pageSize = PAGE_SIZES[options.page?.size] ? options.page.size : 'A4';
  const orientation = options.page?.orientation === 'portrait' ? 'portrait' : 'landscape';
  const dims = PAGE_SIZES[pageSize][orientation];

  // Colour values are sanitised here, at the single point where the stored design
  // enters the stylesheet, so every downstream interpolation is already safe.
  const rawPalette = design.palette || {};
  const palette = {
    ...rawPalette,
    background: safeColor(rawPalette.background, '#FFFFFF'),
    surface: safeColor(rawPalette.surface, '#FFFFFF'),
    text: safeColor(rawPalette.text, '#0F1B33'),
    muted: safeColor(rawPalette.muted, '#5B6B85'),
    accent: safeColor(rawPalette.accent, '#C9A227'),
    border: safeColor(rawPalette.border, '#C9A227'),
  };
  const typo = design.typography;
  const content = design.content;
  // Font stacks are whitelisted through fontStack(), so a stored value cannot
  // smuggle extra CSS tokens into the declaration.
  const bodyFont = fontStack(typo.bodyFont);
  const headingFont = fontStack(typo.headingFont);
  const recipientFont = fontStack(typo.recipientFont);

  const certificateId = escapeHtml(v.certificateId || '');
  const verifyUrl = v.verificationUrl || '';
  const eyebrow = escapeHtml(
    content.eyebrow || CERT_TYPES[v.certificateType] || CERT_TYPES.achievement
  );
  const recipient = escapeHtml(v.recipientName || 'Recipient Name');
  const award = escapeHtml(v.certificateTitle || 'Certificate Title');
  const description = wrapLines(content.description || v.description || '');
  const criteria = wrapLines(content.criteria || '');
  const logo = safeUrl(v.organizationLogoUrl);
  const signatoryImages = [safeUrl(v.signatory1Image), safeUrl(v.signatory2Image)];
  const signatoryNames = [v.signatory1Name, v.signatory2Name].filter(Boolean);

  const align = content.align || 'center';
  const headerAlign = design.header.align || 'center';

  const signatures = design.signatures.show
    ? [0, 1]
        .filter((i) => (v[`signatory${i + 1}Name`] || signatoryImages[i]))
        .map((i) => {
          const name = escapeHtml(v[`signatory${i + 1}Name`] || '');
          const title = escapeHtml(v[`signatory${i + 1}Title`] || '');
          const img = signatoryImages[i];
          return `
            <div class="signatory">
              ${img ? `<img class="signatory__mark" src="${img}" alt="" />` : ''}
              <div class="signatory__rule"></div>
              ${name ? `<div class="signatory__name">${name}</div>` : ''}
              ${title ? `<div class="signatory__title">${title}</div>` : ''}
            </div>`;
        })
        .join('')
    : '';

  const showQr = design.footer.showQr && !!verifyUrl;
  const qrMarkup = showQr
    ? qrToSvg(verifyUrl, { margin: 1, dark: palette.text, light: '#FFFFFF' })
        .replace('<svg ', '<svg class="qr" ')
    : '';

  const issueDate = v.issueDate
    ? new Date(v.issueDate).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${certificateId ? `Certificate ${certificateId}` : 'Certificate'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${googleFontsUrl()}" rel="stylesheet" />
<style>
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html, body { background:#fff; }
  body {
    font-family: ${bodyFont};
    color: ${palette.text};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    position: relative;
    width: ${dims.w}mm;
    height: ${dims.h}mm;
    overflow: hidden;
    background: ${palette.background};
    display: flex;
    flex-direction: column;
    color: ${palette.text};
  }
  .sheet__bg {
    position: absolute; inset:0; width:100%; height:100%;
    object-fit: cover; z-index:0;
  }
  .sheet__tint {
    position:absolute; inset:0; z-index:1;
    background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 100%);
  }
  .frame {
    position: absolute;
    inset: ${Number(design.frame.inset) || 14}mm;
    border-radius: ${Number(design.frame.radius) || 0}mm;
    z-index: 2;
    pointer-events: none;
    ${frameCss(design.frame, palette)}
  }
  .ornament { position:absolute; width:26mm; height:26mm; z-index:3; opacity:.85; }
  .ornament--tl { top:${(Number(design.frame.inset) || 14) + 4}mm; left:${(Number(design.frame.inset) || 14) + 4}mm; }
  .ornament--tr { top:${(Number(design.frame.inset) || 14) + 4}mm; right:${(Number(design.frame.inset) || 14) + 4}mm; }
  .ornament--bl { bottom:${(Number(design.frame.inset) || 14) + 4}mm; left:${(Number(design.frame.inset) || 14) + 4}mm; }
  .ornament--br { bottom:${(Number(design.frame.inset) || 14) + 4}mm; right:${(Number(design.frame.inset) || 14) + 4}mm; }

  .sheet__inner {
    position: relative; z-index: 4;
    flex: 1;
    display: flex; flex-direction: column;
    padding: ${(Number(design.frame.inset) || 14) + 8}mm ${(Number(design.frame.inset) || 14) + 12}mm;
  }

  .header { text-align:${headerAlign}; }
  .header__logo { height: ${Number(design.header.logoHeight) || 54}mm; width:auto; object-fit:contain; display:inline-block; }
  .header__org {
    font-family: ${headingFont};
    font-weight: ${Number(typo.headingWeight) || 700};
    font-size: ${Number(design.header.organizationSize) || 30}pt;
    letter-spacing: ${Number(typo.letterSpacing) || 4}px;
    text-transform: uppercase;
    color: ${palette.text};
    margin-top: ${logo ? 5 : 0}mm;
  }
  .header__tagline { font-size:11pt; color:${palette.muted}; letter-spacing:2px; text-transform:uppercase; margin-top:2mm; }

  .body { flex:1; display:flex; flex-direction:column; justify-content:center; text-align:${align}; padding: 6mm 0; }
  .eyebrow {
    font-family: ${headingFont};
    font-size: ${Number(typo.headingSize) || 15}pt;
    letter-spacing: ${Number(typo.letterSpacing) || 4}px;
    text-transform: uppercase;
    color: ${palette.accent};
    font-weight: 600;
  }
  .intro { font-size:13pt; color:${palette.muted}; margin-top:${(orientation === 'portrait' ? 9 : 7)}mm; }
  .recipient {
    font-family: ${recipientFont};
    font-weight: ${Number(typo.recipientWeight) || 700};
    font-size: ${Number(typo.recipientSize) || 46}pt;
    color: ${safeColor(typo.recipientColor, palette.text)};
    line-height: 1.15;
    margin: ${(orientation === 'portrait' ? 8 : 5)}mm 0;
    display: inline-block;
    ${typo.recipientUnderline === false ? '' : `border-bottom:0.7mm solid ${palette.accent}; padding-bottom:2.5mm;`}
  }
  .recipient-wrap { display:flex; justify-content:${align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'}; }
  .award {
    font-family: ${headingFont};
    font-size: ${Number(typo.headingSize) || 15}pt;
    font-weight: 600;
    color: ${palette.text};
    margin-top: ${(orientation === 'portrait' ? 9 : 6)}mm;
  }
  .award-prefix { font-size:12pt; color:${palette.muted}; margin-top:4mm; }
  .description { font-size:12pt; line-height:1.75; color:${palette.muted}; max-width: 175mm; margin:${(orientation === 'portrait' ? 8 : 5)}mm auto 0; }
  .criteria { font-size:11pt; letter-spacing:1.5px; text-transform:uppercase; color:${palette.accent}; margin-top:5mm; font-weight:600; }

  .signatures { display:flex; justify-content:space-around; align-items:flex-end; text-align:center; }
  .signatory { min-width:62mm; }
  .signatory__mark { max-height:16mm; max-width:44mm; object-fit:contain; }
  .signatory__rule { height:0.35mm; background:${palette.muted}; opacity:.55; margin: ${signatoryImages[0] ? 3 : 10}mm 0 2.5mm; }
  .signatory__name { font-size:11.5pt; font-weight:600; }
  .signatory__title { font-size:9.5pt; color:${palette.muted}; letter-spacing:.6px; text-transform:uppercase; margin-top:1mm; }

  /* Parenthesised: the previous version parsed as (\`gap\` || (40 > 0)), so the
     operator's precedence silently discarded the configured signature gap. */
  .footer { display:flex; align-items:flex-end; justify-content:space-between; margin-top:${Number(design.signatures.gap) > 0 ? Number(design.signatures.gap) : 6}mm; }
  .footer__left { font-size:9pt; color:${palette.muted}; letter-spacing:.8px; text-transform:uppercase; }
  .footer__id { font-family:'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.5px; text-transform:none; font-size:9.5pt; }
  .footer__right { display:flex; align-items:center; gap:4mm; text-align:right; }
  .footer__verify { font-size:8pt; color:${palette.muted}; line-height:1.5; word-break:break-all; max-width:62mm; }
  .qr { width:${Number(design.footer.qrSize) || 26}mm; height:${Number(design.footer.qrSize) || 26}mm; display:block; }
  .date { font-size:10.5pt; color:${palette.text}; }

  @page { size: ${pageSize} ${orientation}; margin: 0; }
</style>
</head>
<body>
  <div class="sheet">
    ${v.backgroundUrl ? `<img class="sheet__bg" src="${safeUrl(v.backgroundUrl)}" alt="" />` : ''}
    <div class="frame"></div>
    ${design.frame.ornament ? ornamentMarkup(safeColor(design.frame.color, palette.border || palette.accent)) : ''}
    <div class="sheet__inner">
      <header class="header">
        ${logo && design.header.showLogo !== false ? `<img class="header__logo" src="${logo}" alt="" />` : ''}
        <div class="header__org">${escapeHtml(v.organizationName || '')}</div>
        ${design.header.tagline ? `<div class="header__tagline">${escapeHtml(design.header.tagline)}</div>` : ''}
      </header>

      <section class="body">
        <div class="eyebrow">${eyebrow}</div>
        ${content.intro ? `<div class="intro">${escapeHtml(content.intro)}</div>` : ''}
        <div class="recipient-wrap">
          <div class="recipient">${recipient}</div>
        </div>
        ${content.awardPrefix ? `<div class="award-prefix">${escapeHtml(content.awardPrefix)}</div>` : ''}
        <div class="award">${award}</div>
        ${description ? `<div class="description">${description}</div>` : ''}
        ${criteria ? `<div class="criteria">${criteria}</div>` : ''}
        ${content.showDate !== false && issueDate ? `<div class="date" style="margin-top:${orientation === 'portrait' ? 9 : 6}mm">${issueDate}</div>` : ''}
      </section>

      ${signatures ? `<section class="signatures">${signatures}</section>` : ''}

      <footer class="footer">
        <div class="footer__left">
          ${design.footer.showCertificateId && certificateId
            ? `<div class="footer__id">${certificateId}</div>`
            : ''}
        </div>
        <div class="footer__right">
          ${design.footer.showVerifyUrl && verifyUrl
            ? `<div class="footer__verify">Verify at<br/>${escapeHtml(verifyUrl.replace(/^https?:\/\//, ''))}</div>`
            : ''}
          ${qrMarkup}
        </div>
      </footer>
    </div>
  </div>
</body>
</html>`;
}

/** Placeholder values used by the template editor's live preview. */
export function previewValues(design) {
  const normalized = normalizeDesign(design);
  return {
    certificateId: 'CR-2026-000123',
    verificationUrl: 'https://www.career-radar.space/verify/v_preview',
    recipientName: 'Recipient Full Name',
    certificateTitle: 'Certificate Title',
    description: normalized.content.description,
    certificateType: normalized.header.eyebrow ? undefined : 'achievement',
    organizationName: 'Career Radar',
    organizationLogoUrl: '',
    issueDate: new Date().toISOString().slice(0, 10),
    signatory1Name: 'Authorised Signatory',
    signatory1Title: 'Director',
    signatory2Name: '',
    signatory2Title: '',
    backgroundUrl: '',
  };
}

export default { renderCertificateHtml, normalizeDesign, DEFAULT_DESIGN, PAGE_SIZES, previewValues };