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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { id } = await req.json()
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Increment likes
    const { data, error } = await supabase.rpc('increment_likes', { video_id: id })

    if (error) {
      // Fallback: manual increment
      const { data: video } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', id)
        .single()

      if (video) {
        const { data: updated, error: updateError } = await supabase
          .from('videos')
          .update({ likes: (video.likes || 0) + 1 })
          .eq('id', id)
          .select('likes')
          .single()

        if (updateError) throw updateError

        return new Response(JSON.stringify({ likes: updated?.likes || 0 }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw error
    }

    return new Response(JSON.stringify({ likes: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
