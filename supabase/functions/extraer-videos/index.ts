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
    const clave = url.searchParams.get('clave')
    const cronSecret = Deno.env.get('CRON_SECRET')

    if (!cronSecret || clave !== cronSecret) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Extract from Reddit and YouTube in parallel
    const [redditVideos, youtubeVideos] = await Promise.all([
      extraerReddit(),
      extraerYouTube(Deno.env.get('YOUTUBE_API_KEY') || ''),
    ])

    const allVideos = [...redditVideos, ...youtubeVideos]
    let nuevos = 0

    for (const video of allVideos) {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('videos')
        .select('id')
        .eq('url', video.url)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabase.from('videos').insert(video)
        if (!error) nuevos++
      }
    }

    return new Response(JSON.stringify({
      mensaje: 'ok',
      nuevos,
      total_extraidos: allVideos.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error en extracción:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// --- Reddit Scraper ---
async function extraerReddit() {
  const subreddits = ['aww', 'funnyanimals', 'AnimalsBeingDerps', 'rarepuppers', 'catvideos', 'dogvideos']
  const videos: any[] = []

  for (const sub of subreddits) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25`, {
        headers: { 'User-Agent': 'ViralMascotas/1.0' },
      })
      if (!res.ok) continue
      const json = await res.json()

      for (const child of json.data?.children || []) {
        const post = child.data
        if (!post.url) continue

        const isVideo = post.url.includes('v.redd.it') || post.is_video
        if (!isVideo) continue

        const thumbnail = (post.thumbnail && post.thumbnail.startsWith('http'))
          ? post.thumbnail
          : null

        videos.push({
          titulo: post.title?.slice(0, 200) || 'Sin título',
          url: post.url,
          thumbnail,
          fuente: 'reddit',
          categoria: inferirCategoria(sub, post.title || ''),
          fecha_extraccion: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error(`Error extrayendo de r/${sub}:`, e)
    }
  }
  return videos
}

// --- YouTube Scraper ---
async function extraerYouTube(apiKey: string) {
  if (!apiKey) return []

  const queries = ['funny dogs', 'funny cats', 'cute pets', 'animales graciosos']
  const videos: any[] = []

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=25&key=${apiKey}`
      )
      if (!res.ok) continue
      const json = await res.json()

      for (const item of json.items || []) {
        const title = item.snippet?.title || ''
        videos.push({
          titulo: title.slice(0, 200),
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
          fuente: 'youtube',
          categoria: inferirCategoriaTexto(title),
          fecha_extraccion: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error('Error extrayendo de YouTube:', e)
    }
  }
  return videos
}

function inferirCategoria(subreddit: string, title: string): string {
  const sub = subreddit.toLowerCase()
  if (sub.includes('dog') || sub.includes('pupper')) return 'perros'
  if (sub.includes('cat')) return 'gatos'
  return inferirCategoriaTexto(title)
}

function inferirCategoriaTexto(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('dog') || t.includes('puppy') || t.includes('perro') || t.includes('cachorro')) return 'perros'
  if (t.includes('cat') || t.includes('kitten') || t.includes('gato') || t.includes('gatito')) return 'gatos'
  return 'otros'
}
