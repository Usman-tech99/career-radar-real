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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return new Response(JSON.stringify({ error: 'Missing product id' }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: product, error: productError } = await sb.from('products').select('file_url, title, is_free').eq('id', productId).maybeSingle();

    if (productError || !product?.file_url) {
      return new Response(JSON.stringify({ error: 'Product or file not found' }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    if (!product.is_free) {
      const { data: order } = await sb.from('delivered_orders').select('id').eq('user_id', user.id).eq('product_id', productId).maybeSingle();
      if (!order) {
        return new Response(JSON.stringify({ error: 'Purchase required' }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
      }
    }

    const { data: signedData, error: signedError } = await sb.storage.from('product-files').createSignedUrl(product.file_url, 60);

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
    console.error('download-product error:', error);
    return new Response(JSON.stringify({ error: 'Download failed' }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
