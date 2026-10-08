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
  // For the Career Radar Appreciation template, return themed preview values.
  if (normalized._templateType === 'cr_appreciation') {
    return {
      certificateId: 'CR-VOL-2026-001',
      verificationUrl: 'https://www.career-radar.space/verify/v_preview',
      recipientName: 'Recipient Name',
      departmentName: 'Design & Branding',
      issueDate: new Date().toISOString().slice(0, 10),
    };
  }
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

// ---------------------------------------------------------------------------
// Career Radar Official Certificate of Appreciation
// Exact reproduction of the client-provided design.
// ---------------------------------------------------------------------------

/**
 * Renders the official Career Radar Certificate of Appreciation.
 *
 * Layout: A4 Landscape (297mm × 210mm)
 *   - Left panel (≈30%): navy-blue with logo, star badge, mission icons
 *   - Right panel (≈70%): white/light grey with certificate content
 *   - Gold diagonal accent stripe bridging the two panels
 *
 * All text, colours, and layout positions are fixed — this is the official
 * template that cannot be edited by the general template editor.
 *
 * @param {object} v   Per-certificate values:
 *   - certificateId    Human-readable ID (CR-VOL-2026-001)
 *   - verificationUrl  Full /verify/<token> URL for the QR code
 *   - recipientName    Award recipient's full name
 *   - departmentName   Department / team name shown in the body
 *   - issueDate        ISO date string (YYYY-MM-DD)
 */
export function renderCareerRadarAppreciationHtml(v = {}) {
  const certificateId = escapeHtml(v.certificateId || '');
  const recipientName = escapeHtml(v.recipientName || 'Recipient Name');
  const rawDept = v.departmentName || 'Your Department';
  const departmentName = escapeHtml(String(rawDept).replace(/[\[\]]/g, '').trim());
  const verifyUrl = v.verificationUrl || '';
  const certificateTitle = v.certificateTitle || v.title || 'Certificate of Appreciation';
  const customDesc = v.description ? escapeHtml(v.description) : '';
  const achievement = v.achievement ? escapeHtml(v.achievement) : '';
  const signatory1Name = escapeHtml(v.signatory1Name || 'HASNAIN SHAKEEL AHMED');
  const signatory1Title = escapeHtml(v.signatory1Title || 'Founder & CEO');

  let subTitle = 'OF APPRECIATION';
  const cleanTitle = (certificateTitle || '').trim();
  if (cleanTitle) {
    if (cleanTitle.toLowerCase().startsWith('certificate of ')) {
      subTitle = 'OF ' + escapeHtml(cleanTitle.slice(15).toUpperCase());
    } else if (cleanTitle.toLowerCase().startsWith('of ')) {
      subTitle = escapeHtml(cleanTitle.toUpperCase());
    } else {
      subTitle = escapeHtml(cleanTitle.toUpperCase());
    }
  }

  const issueDate = v.issueDate
    ? new Date(v.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';
  const issueDateParts = issueDate.split('/');
  const issueDay   = issueDateParts[0] || '';
  const issueMonth = issueDateParts[1] || '';
  const issueYear  = issueDateParts[2] || '';

  const showQr = !!verifyUrl;
  const qrMarkup = showQr
    ? qrToSvg(verifyUrl, { margin: 1, dark: '#0F1B33', light: '#FFFFFF' })
        .replace('<svg ', '<svg class="cr-qr" ')
    : '';

  // Career Radar logo — approximated with SVG shapes matching the original circular badge
  const logoSvg = `<svg viewBox="0 0 120 120" class="cr-logo" xmlns="http://www.w3.org/2000/svg" aria-label="Career Radar">
    <!-- Outer ring -->
    <circle cx="60" cy="60" r="58" fill="white" stroke="#C9A227" stroke-width="2.5"/>
    <!-- Radar waves -->
    <circle cx="60" cy="60" r="44" fill="none" stroke="#0F1B33" stroke-width="1.5" opacity="0.3"/>
    <circle cx="60" cy="60" r="32" fill="none" stroke="#0F1B33" stroke-width="1.5" opacity="0.4"/>
    <circle cx="60" cy="60" r="20" fill="none" stroke="#0F1B33" stroke-width="1.5" opacity="0.5"/>
    <!-- Briefcase body -->
    <rect x="40" y="62" width="40" height="28" rx="4" fill="#0F1B33"/>
    <rect x="48" y="57" width="24" height="8" rx="3" fill="#0F1B33"/>
    <line x1="60" y1="62" x2="60" y2="90" stroke="white" stroke-width="2" opacity="0.4"/>
    <!-- Graduation cap -->
    <polygon points="60,32 80,42 60,52 40,42" fill="#C9A227"/>
    <line x1="80" y1="42" x2="80" y2="54" stroke="#C9A227" stroke-width="2.5"/>
    <circle cx="80" cy="55" r="2.5" fill="#C9A227"/>
    <!-- Arrow target pin -->
    <line x1="72" y1="34" x2="85" y2="22" stroke="#C9A227" stroke-width="2" stroke-linecap="round"/>
    <polygon points="88,19 83,24 78,20 82,14" fill="#C9A227"/>
  </svg>`;

  // Star icon for badge
  const starSvg = `<svg viewBox="0 0 24 24" class="cr-star-icon" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#C9A227" stroke="#C9A227" stroke-width="1" stroke-linejoin="round"/>
  </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>${certificateId ? `Certificate ${certificateId}` : 'Career Radar Certificate of Appreciation'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Inter:wght@300;400;500;600;700;800;900&display=block" rel="stylesheet"/>
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html, body { background: #fff; }
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Page shell ── */
.cr-sheet {
  position: relative;
  width: 297mm;
  height: 210mm;
  overflow: hidden;
  background: #F8F9FA;
  display: flex;
  flex-direction: row;
}

/* ── Left navy panel ── */
.cr-left {
  position: relative;
  width: 88mm;
  height: 210mm;
  background: #0F1B33;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10mm 6mm 8mm;
  overflow: hidden;
  z-index: 1;
}

/* Decorative angled gold stripes on left panel */
.cr-left::before {
  content: '';
  position: absolute;
  top: -10mm;
  right: -8mm;
  width: 20mm;
  height: 240mm;
  background: linear-gradient(135deg, #C9A227 0%, #E8C547 40%, #C9A227 100%);
  transform: rotate(-15deg);
  z-index: 0;
  opacity: 0.9;
}
.cr-left::after {
  content: '';
  position: absolute;
  top: -10mm;
  right: -16mm;
  width: 10mm;
  height: 240mm;
  background: linear-gradient(135deg, #C9A227 0%, #E8C547 50%, #C9A227 100%);
  transform: rotate(-15deg);
  z-index: 0;
  opacity: 0.5;
}

/* Bottom-left geometric corner accent */
.cr-left-bottom-accent {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: 40mm solid rgba(201,162,39,0.25);
  border-top: 40mm solid transparent;
  z-index: 0;
}

/* Top-left corner triangle accent */
.cr-left-top-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-right: 30mm solid rgba(201,162,39,0.12);
  border-bottom: 30mm solid transparent;
  z-index: 0;
}

.cr-left-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
}

/* Logo */
.cr-logo { width: 42mm; height: 42mm; }

/* Brand name below logo */
.cr-brand {
  margin-top: 3mm;
  text-align: center;
}
.cr-brand-name {
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 12.5pt;
  letter-spacing: 0.5px;
}
.cr-brand-career { color: white; }
.cr-brand-radar { color: #C9A227; }
.cr-brand-tagline {
  font-size: 6pt;
  color: rgba(255,255,255,0.7);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-top: 0.5mm;
}
.cr-brand-dots {
  color: #C9A227;
  font-size: 7pt;
  letter-spacing: 2px;
  margin-top: 0.5mm;
}
.cr-brand-mission {
  font-size: 5.5pt;
  color: rgba(255,255,255,0.6);
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-top: 0.5mm;
}

/* Gold star badge */
.cr-star-badge {
  margin-top: auto;
  margin-bottom: 5mm;
  width: 18mm;
  height: 18mm;
  background: linear-gradient(135deg, #C9A227, #E8C547, #C9A227);
  clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Hexagon badge for star */
.cr-hex-badge {
  width: 15mm;
  height: 15mm;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cr-star-icon { width: 10mm; height: 10mm; }

/* Mission items */
.cr-mission-items {
  display: flex;
  flex-direction: column;
  gap: 2mm;
  width: 100%;
  margin-top: 2mm;
}
.cr-mission-item {
  display: flex;
  align-items: center;
  gap: 2.5mm;
  font-size: 7pt;
  color: rgba(255,255,255,0.85);
}
.cr-mission-dot {
  width: 3mm;
  height: 3mm;
  border-radius: 50%;
  background: #C9A227;
  flex-shrink: 0;
}

/* ── Right white panel ── */
.cr-right {
  flex: 1;
  position: relative;
  height: 210mm;
  background: white;
  display: flex;
  flex-direction: column;
  padding: 8mm 10mm 6mm 14mm;
  overflow: hidden;
}

/* Decorative large circle watermark on right side */
.cr-right::before {
  content: '';
  position: absolute;
  right: -20mm;
  top: 50%;
  transform: translateY(-50%);
  width: 80mm;
  height: 80mm;
  border-radius: 50%;
  border: 8mm solid rgba(15,27,51,0.04);
  z-index: 0;
}
.cr-right::after {
  content: '';
  position: absolute;
  right: -28mm;
  top: 50%;
  transform: translateY(-50%);
  width: 100mm;
  height: 100mm;
  border-radius: 50%;
  border: 4mm solid rgba(15,27,51,0.03);
  z-index: 0;
}

/* Diagonal gold accent top-right area */
.cr-right-accent {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-right: 55mm solid #F8F9FA;
  border-bottom: 55mm solid transparent;
  z-index: 0;
}

.cr-right-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Certificate ID top-right */
.cr-cert-id-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 2mm;
}
.cr-cert-id {
  font-family: 'Courier New', Courier, monospace;
  font-size: 7.5pt;
  font-weight: 600;
  color: #64748B;
  letter-spacing: 0.8px;
}

/* Main heading */
.cr-heading-block {
  text-align: center;
  margin-bottom: 2mm;
}
.cr-title-main {
  font-family: 'Arial Black', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-weight: 900;
  font-size: 32pt;
  color: #0B1B3D;
  letter-spacing: 5px;
  text-transform: uppercase;
  line-height: 1;
}
.cr-title-sub {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 10.5pt;
  font-weight: 700;
  color: #C9993C;
  letter-spacing: 6px;
  text-transform: uppercase;
  margin-top: 1.5mm;
}
.cr-title-star {
  color: #C9993C;
  font-size: 12pt;
  display: block;
  margin-top: 1mm;
}

/* Divider lines flanking recipient */
.cr-divider-row {
  display: flex;
  align-items: center;
  gap: 2mm;
  margin: 1mm 0;
}
.cr-divider-line {
  flex: 1;
  height: 0.4mm;
  background: linear-gradient(to right, transparent, #C9993C 30%, #C9A227 70%, transparent);
}

/* Proudly presented line */
.cr-presented-to {
  text-align: center;
  font-family: 'Inter', sans-serif;
  font-size: 7pt;
  font-weight: 700;
  color: #64748B;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin: 1.5mm 0;
}

/* Recipient name */
.cr-recipient {
  font-family: 'Great Vibes', cursive;
  font-size: 40pt;
  color: #0B1B3D;
  text-align: center;
  line-height: 1.15;
  padding: 0 4mm;
  white-space: nowrap;
  font-weight: normal;
}

/* Body text */
.cr-body-text {
  text-align: center;
  margin-top: 2mm;
  flex: 1;
}
.cr-recognition-line {
  font-size: 8.5pt;
  color: #334155;
  line-height: 1.6;
}
.cr-dept-inline {
  color: #C9A227;
  font-weight: 700;
}
.cr-brand-inline {
  font-weight: 700;
  color: #0F1B33;
}
.cr-dedication {
  font-size: 8pt;
  color: #64748B;
  line-height: 1.6;
  margin-top: 1.5mm;
  max-width: 170mm;
}
.cr-appreciation {
  font-size: 8.5pt;
  font-weight: 700;
  color: #0F1B33;
  margin-top: 1.5mm;
}
.cr-thankyou {
  font-family: 'Georgia', serif;
  font-size: 8.5pt;
  font-style: italic;
  color: #D4A017;
  margin-top: 1.5mm;
}

/* Footer row: signature + date + QR */
.cr-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 2mm;
}

/* Signature block */
.cr-signatory {
  text-align: center;
  min-width: 50mm;
}
.cr-sig-script {
  font-family: 'Great Vibes', cursive;
  font-size: 30pt;
  color: #0F1B33;
  line-height: 1;
  margin-bottom: -1mm;
  text-align: center;
  font-weight: normal;
}
.cr-sig-img {
  max-height: 14mm;
  max-width: 48mm;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}
.cr-sig-rule {
  width: 50mm;
  height: 0.4mm;
  background: #0F1B33;
  margin: 1.5mm auto 1.5mm;
  opacity: 0.25;
}
.cr-sig-name {
  font-family: 'Inter', sans-serif;
  font-size: 8.5pt;
  font-weight: 800;
  color: #0F1B33;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.cr-sig-role {
  font-family: 'Inter', sans-serif;
  font-size: 7.5pt;
  font-weight: 700;
  color: #C9993C;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  margin-top: 0.5mm;
}
.cr-sig-org {
  font-family: 'Inter', sans-serif;
  font-size: 7.5pt;
  font-weight: 700;
  color: #0F1B33;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  margin-top: 0.5mm;
}

/* Bottom-right corner triangle for DATE */
.cr-date-corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 55mm;
  height: 45mm;
  pointer-events: none;
  z-index: 5;
}
.cr-date-corner-svg {
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}
.cr-date-corner-content {
  position: absolute;
  right: 7mm;
  bottom: 6mm;
  text-align: center;
  z-index: 6;
}
.cr-date-corner-label {
  font-size: 7.5pt;
  font-weight: 700;
  color: #C9993C;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 1.5mm;
  font-family: 'Inter', sans-serif;
}
.cr-date-corner-value {
  font-size: 8.5pt;
  font-weight: 600;
  color: #FFFFFF;
  border-bottom: 0.4mm solid #C9993C;
  padding-bottom: 0.8mm;
  min-width: 24mm;
  letter-spacing: 1px;
  font-family: 'Inter', sans-serif;
}

/* QR block */
.cr-qr-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1mm;
}
.cr-qr {
  width: 18mm;
  height: 18mm;
  display: block;
}

@page { size: A4 landscape; margin: 0; }
</style>
</head>
<body>
  <div class="cr-sheet">
    <!-- Left navy panel -->
    <div class="cr-left">
      <div class="cr-left-top-accent"></div>
      <div class="cr-left-bottom-accent"></div>
      <div class="cr-left-content">
        ${logoSvg}
        <div class="cr-brand">
          <div class="cr-brand-name">
            <span class="cr-brand-career">Career</span><span class="cr-brand-radar">Radar</span>
          </div>
          <div class="cr-brand-tagline">— Your Opportunity Scanner —</div>
          <div class="cr-brand-dots">★</div>
          <div class="cr-brand-mission">Find. Prepare. Succeed.</div>
        </div>

        <div class="cr-hex-badge" style="margin-top: 6mm;">
          ${starSvg}
        </div>

        <div class="cr-mission-items" style="margin-top: 6mm;">
          <div class="cr-mission-item">
            <div class="cr-mission-dot"></div>
            <span>Find Opportunities</span>
          </div>
          <div class="cr-mission-item">
            <div class="cr-mission-dot"></div>
            <span>Prepare Yourself</span>
          </div>
          <div class="cr-mission-item">
            <div class="cr-mission-dot"></div>
            <span>Succeed Globally</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right white panel -->
    <div class="cr-right">
      <div class="cr-right-accent"></div>
      <div class="cr-right-content">

        <!-- Certificate ID -->
        <div class="cr-cert-id-row">
          <span class="cr-cert-id">${certificateId}</span>
        </div>

        <!-- Main heading -->
        <div class="cr-heading-block">
          <div class="cr-title-main">CERTIFICATE</div>
          <div class="cr-title-sub">${subTitle}</div>
          <span class="cr-title-star">★</span>
        </div>

        <!-- Proudly presented to -->
        <div class="cr-presented-to">Proudly Presented To</div>

        <!-- Recipient name with decorative lines -->
        <div class="cr-divider-row">
          <div class="cr-divider-line"></div>
          <div class="cr-recipient">${recipientName}</div>
          <div class="cr-divider-line"></div>
        </div>

        <!-- Body -->
        <div class="cr-body-text">
          ${customDesc ? `
            <div class="cr-recognition-line" style="max-width: 170mm; margin: 0 auto 3mm; line-height: 1.7;">
              ${customDesc}
            </div>
          ` : (() => {
            const t = (v.certificateType || cleanTitle || '').toLowerCase();
            if (t.includes('completion') || t.includes('course') || t.includes('bootcamp')) {
              return `
                <div class="cr-recognition-line">
                  for successfully completing the comprehensive program and coursework in<br/>
                  <span class="cr-dept-inline">${departmentName}</span> at <span class="cr-brand-inline">Career Radar.</span>
                </div>
                <div class="cr-dedication">
                  Demonstrating technical proficiency, perseverance, and dedication to professional excellence and career advancement.
                </div>
                <div class="cr-appreciation">
                  We commend your hard work, dedication, and successful completion.
                </div>
              `;
            }
            if (t.includes('internship') || t.includes('intern')) {
              return `
                <div class="cr-recognition-line">
                  in recognition of successful completion of the professional internship in<br/>
                  <span class="cr-dept-inline">${departmentName}</span> at <span class="cr-brand-inline">Career Radar.</span>
                </div>
                <div class="cr-dedication">
                  Exhibiting exemplary initiative, practical skill application, teamwork, and strong professional ethics during the tenure.
                </div>
                <div class="cr-appreciation">
                  We commend your active contribution and commendable service.
                </div>
              `;
            }
            if (t.includes('achievement') || t.includes('honor') || t.includes('excellence')) {
              return `
                <div class="cr-recognition-line">
                  in recognition of outstanding achievement, performance, and distinguished excellence in<br/>
                  <span class="cr-dept-inline">${departmentName}</span> at <span class="cr-brand-inline">Career Radar.</span>
                </div>
                <div class="cr-dedication">
                  Recognizing extraordinary capability, perseverance, and leadership that set a high standard of professional excellence.
                </div>
                <div class="cr-appreciation">
                  We celebrate your outstanding accomplishments and remarkable success.
                </div>
              `;
            }
            if (t.includes('participation') || t.includes('attend')) {
              return `
                <div class="cr-recognition-line">
                  in recognition of active participation and engagement in<br/>
                  <span class="cr-dept-inline">${departmentName}</span> organized by <span class="cr-brand-inline">Career Radar.</span>
                </div>
                <div class="cr-dedication">
                  Demonstrating passion for continuous learning, networking, and professional skill enhancement.
                </div>
                <div class="cr-appreciation">
                  We appreciate your enthusiastic engagement and meaningful contribution.
                </div>
              `;
            }
            return `
              <div class="cr-recognition-line">
                in recognition of valuable contributions in the<br/>
                <span class="cr-dept-inline">${departmentName}</span> at <span class="cr-brand-inline">Career Radar.</span>
              </div>
              <div class="cr-dedication">
                Your dedication, professionalism, and commitment<br/>
                have played an important role in supporting our mission of helping<br/>
                students and early-career professionals discover opportunities,<br/>
                develop skills, and build successful careers.
              </div>
              <div class="cr-appreciation">
                We sincerely appreciate your time, effort, and positive<br/>impact on our community.
              </div>
            `;
          })()}
          ${achievement ? `<div class="cr-appreciation" style="color: #C9A227; margin: 2mm 0;">★ ${achievement} ★</div>` : ''}
          <div class="cr-thankyou">${(() => {
            const t = (v.certificateType || cleanTitle || '').toLowerCase();
            if (t.includes('completion') || t.includes('internship')) return 'Wishing you continued success in your professional journey!';
            if (t.includes('achievement')) return 'Continue inspiring others and reaching new heights!';
            return 'Thank you for being an essential part of Career Radar!';
          })()}</div>
        </div>

        <!-- Footer -->
        <div class="cr-footer" style="padding-right: 55mm; align-items: flex-end;">
          <!-- QR Code -->
          ${showQr ? `<div class="cr-qr-block">${qrMarkup}</div>` : '<div></div>'}

          <!-- Signature -->
          <div class="cr-signatory">
            ${v.signatory1Image ? `
              <img src="${safeUrl(v.signatory1Image)}" class="cr-sig-img" alt="Signature" />
            ` : `
              <div class="cr-sig-script">${v.signatory1Name ? escapeHtml(v.signatory1Name.split(' ')[0]) : 'Hasnain'}</div>
            `}
            <div class="cr-sig-rule"></div>
            <div class="cr-sig-name">${signatory1Name}</div>
            <div class="cr-sig-role">${signatory1Title}</div>
            <div class="cr-sig-org">Career Radar</div>
          </div>
        </div>

        <!-- Corner Date triangle -->
        <div class="cr-date-corner">
          <svg viewBox="0 0 210 170" class="cr-date-corner-svg" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="dateBladeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9B6E1F" />
                <stop offset="50%" stopColor="#C9A227" />
                <stop offset="100%" stopColor="#E5C46E" />
              </linearGradient>
            </defs>
            <polygon points="0,170 210,0 210,16 16,170" fill="url(#dateBladeGrad)" />
            <polygon points="14,170 210,14 210,170" fill="#0B1B3D" />
          </svg>
          <div class="cr-date-corner-content">
            <div class="cr-date-corner-label">DATE</div>
            <div class="cr-date-corner-value">${issueDay} / ${issueMonth} / ${issueYear}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Preview values for the Career Radar Appreciation template specifically.
 * Used by the live preview in the admin panel.
 */
export function previewCareerRadarAppreciation() {
  return {
    certificateId: 'CR-VOL-2026-001',
    verificationUrl: 'https://www.career-radar.space/verify/v_preview',
    recipientName: 'Recipient Name',
    departmentName: 'Design & Branding',
    issueDate: new Date().toISOString().slice(0, 10),
  };
}

export default { renderCertificateHtml, normalizeDesign, DEFAULT_DESIGN, PAGE_SIZES, previewValues, renderCareerRadarAppreciationHtml, previewCareerRadarAppreciation };