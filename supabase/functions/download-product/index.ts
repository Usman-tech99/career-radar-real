// @ts-nocheck
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Missing product id' }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: product, error: productError } = await supabase.from('products').select('file_url, title').eq('id', productId).maybeSingle();

    if (productError || !product?.file_url) {
      return new Response(JSON.stringify({ error: 'Product or file not found' }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: signedData, error: signedError } = await supabase.storage.from('product-files').createSignedUrl(product.file_url, 60);

    if (signedError || !signedData?.signedUrl) {
      return new Response(JSON.stringify({ error: 'Failed to generate download link' }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const fileRes = await fetch(signedData.signedUrl);
    if (!fileRes.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch file' }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const fileName = product.title?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'download';
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';

    return new Response(fileRes.body, {
      headers: {
        ...cors,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-cache"
      }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
