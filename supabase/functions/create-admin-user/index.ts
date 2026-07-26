// @ts-ignore: Suppress local module resolution error for the editor environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare global Deno namespace properties so the editor linter recognizes it immediately
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error("Missing authorization header");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    // Verify is super_admin
    const { data: roleData } = await sb.from('user_roles').select('role').eq('user_id', user.id).single();
    if (roleData?.role !== 'super_admin') throw new Error("Unauthorized");

    const { email, password, role, fullName, role_label, permissions } = await req.json();

    // Create user in auth schema
    const { data: newAuthUser, error: createError } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    });

    if (createError) throw createError;

    // Insert user_roles
    await sb.from('user_roles').insert({
      user_id: newAuthUser.user.id,
      role: role,
      role_label: role_label || '',
      permissions: permissions || []
    });

    return new Response(JSON.stringify({ success: true, user: newAuthUser.user }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error('create-admin-user error:', error);
    return new Response(JSON.stringify({ error: "Operation failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});