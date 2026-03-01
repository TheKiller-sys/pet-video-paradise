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
    const adminPassword = Deno.env.get('ADMIN_PASSWORD')
    const authHeader = req.headers.get('x-admin-password')

    if (!adminPassword || authHeader !== adminPassword) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const url = new URL(req.url)

    if (req.method === 'DELETE') {
      const id = url.searchParams.get('id')
      if (!id) throw new Error('ID requerido')

      const { error } = await supabase.from('videos').delete().eq('id', id)
      if (error) throw error

      return new Response(JSON.stringify({ mensaje: 'Video eliminado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (req.method === 'GET') {
      // Admin: get all videos including inactive
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = (page - 1) * limit

      const { data, count, error } = await supabase
        .from('videos')
        .select('*', { count: 'exact' })
        .order('fecha_extraccion', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      // Stats
      const { count: totalYoutube } = await supabase
        .from('videos').select('*', { count: 'exact', head: true }).eq('fuente', 'youtube')
      const { count: totalReddit } = await supabase
        .from('videos').select('*', { count: 'exact', head: true }).eq('fuente', 'reddit')
      const { count: totalPerros } = await supabase
        .from('videos').select('*', { count: 'exact', head: true }).eq('categoria', 'perros')
      const { count: totalGatos } = await supabase
        .from('videos').select('*', { count: 'exact', head: true }).eq('categoria', 'gatos')

      return new Response(JSON.stringify({
        videos: data || [],
        total: count || 0,
        stats: {
          youtube: totalYoutube || 0,
          reddit: totalReddit || 0,
          perros: totalPerros || 0,
          gatos: totalGatos || 0,
        },
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Método no soportado' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
