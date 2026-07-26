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

    const { targetUserId } = await req.json();
    if (!targetUserId) throw new Error("targetUserId is required");
    
    // Prevent deleting self
    if (targetUserId === user.id) throw new Error("Cannot delete yourself");

    // Delete user in auth schema (CASCADE handles the rest)
    const { error: deleteError } = await sb.auth.admin.deleteUser(targetUserId);

    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error('delete-admin-user error:', error);
    return new Response(JSON.stringify({ error: "Operation failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});