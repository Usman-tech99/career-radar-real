/**
 * Re-exports the canonical QR encoder that lives inside the Edge Function
 * bundle. Keeping one copy avoids the preview and the generated PDF drifting
 * apart (Supabase only bundles files inside `supabase/functions/<name>/`).
 */
export { encodeQR, qrToSvg, default } from '../../supabase/functions/generate-certificate-pdf/qrcode.js';