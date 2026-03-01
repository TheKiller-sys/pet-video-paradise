import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const categoria = url.searchParams.get('categoria')
    const offset = (page - 1) * limit

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    let query = supabase
      .from('videos')
      .select('*', { count: 'exact' })
      .eq('activo', true)
      .order('fecha_extraccion', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categoria && categoria !== 'todos') {
      query = query.eq('categoria', categoria)
    }

    const { data: videos, count, error } = await query

    if (error) throw error

    const totalPages = Math.ceil((count || 0) / limit)

    return new Response(JSON.stringify({
      videos: videos || [],
      totalPages,
      currentPage: page,
      total: count || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
