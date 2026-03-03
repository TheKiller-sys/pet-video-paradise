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

    // If clave is provided, validate it
    if (clave && cronSecret && clave !== cronSecret) {
      return new Response(JSON.stringify({ error: 'Clave incorrecta' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Extract from Reddit (OAuth) and YouTube (API or RSS) in parallel
    const [redditVideos, youtubeVideos] = await Promise.all([
      extraerRedditOAuth(),
      extraerYouTube(Deno.env.get('YOUTUBE_API_KEY') || ''),
    ])

    console.log(`Extraídos: ${redditVideos.length} de Reddit, ${youtubeVideos.length} de YouTube`)

    const allVideos = [...redditVideos, ...youtubeVideos]
    let nuevos = 0
    let errores = 0

    for (const video of allVideos) {
      const { data: existing } = await supabase
        .from('videos')
        .select('id')
        .eq('url', video.url)
        .maybeSingle()

      if (!existing) {
        const { error } = await supabase.from('videos').insert(video)
        if (!error) {
          nuevos++
        } else {
          errores++
          if (errores <= 3) console.error('Error insertando:', error.message)
        }
      }
    }

    return new Response(JSON.stringify({
      mensaje: 'ok',
      nuevos,
      errores,
      total_extraidos: allVideos.length,
      reddit: redditVideos.length,
      youtube: youtubeVideos.length,
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

// --- Reddit OAuth Scraper ---
async function extraerRedditOAuth() {
  const videos: any[] = []

  // Get OAuth token using application-only auth
  let accessToken = ''
  try {
    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('JvR5fTn0dfr2WaxcrIk5RA:'),  // Public read-only client
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'web:viralmascotas:v1.0',
      },
      body: 'grant_type=client_credentials',
    })

    if (tokenRes.ok) {
      const tokenData = await tokenRes.json()
      accessToken = tokenData.access_token
      console.log('Reddit OAuth token obtained')
    } else {
      console.log(`Reddit OAuth failed: ${tokenRes.status}`)
    }
  } catch (e) {
    console.error('Reddit OAuth error:', e)
  }

  const subreddits = ['aww', 'funnyanimals', 'AnimalsBeingDerps', 'rarepuppers', 'catvideos', 'dogvideos']

  for (const sub of subreddits) {
    try {
      let res: Response

      if (accessToken) {
        // Use OAuth API
        res = await fetch(`https://oauth.reddit.com/r/${sub}/hot?limit=25&raw_json=1`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'web:viralmascotas:v1.0',
          },
        })
      } else {
        // Fallback: try RSS feed
        res = await fetch(`https://www.reddit.com/r/${sub}/hot.rss?limit=25`, {
          headers: { 'User-Agent': 'web:viralmascotas:v1.0' },
        })

        if (res.ok) {
          console.log(`Reddit r/${sub}: RSS fallback used`)
          // RSS doesn't give us structured video data, skip
          continue
        }
        continue
      }

      console.log(`Reddit r/${sub}: status ${res.status}`)
      if (!res.ok) continue

      const json = await res.json()
      const children = json.data?.children || []

      for (const child of children) {
        const post = child.data
        if (!post.url) continue

        const isRedditVideo = post.url.includes('v.redd.it') || post.is_video
        const isYouTube = post.url.includes('youtube.com') || post.url.includes('youtu.be')

        if (!isRedditVideo && !isYouTube) continue

        const thumbnail = (post.thumbnail && post.thumbnail.startsWith('http'))
          ? post.thumbnail
          : (post.preview?.images?.[0]?.source?.url || null)

        videos.push({
          titulo: post.title?.slice(0, 200) || 'Sin título',
          url: post.url,
          thumbnail,
          fuente: isYouTube ? 'youtube' : 'reddit',
          categoria: inferirCategoria(sub, post.title || ''),
          fecha_extraccion: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error(`Error r/${sub}:`, e)
    }
  }
  console.log(`Reddit total: ${videos.length} videos`)
  return videos
}

// --- YouTube Scraper ---
async function extraerYouTube(apiKey: string) {
  const videos: any[] = []

  if (apiKey) {
    // Try YouTube Data API
    const queries = ['funny dogs', 'funny cats', 'cute pets', 'animales graciosos mascotas']
    for (const q of queries) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=25&videoCategoryId=15&key=${apiKey}`
        )
        console.log(`YouTube API "${q}": status ${res.status}`)
        if (!res.ok) {
          const err = await res.text()
          console.error(`YouTube API error: ${err.substring(0, 200)}`)
          continue
        }
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
        console.error('YouTube API error:', e)
      }
    }
  }

  // If API didn't work, use YouTube RSS feeds from popular pet channels
  if (videos.length === 0) {
    console.log('YouTube API unavailable, using RSS fallback')
    const channelIds = [
      'UCPIvT-zcQl2H0vabdXJGcpg', // The Dodo
      'UC-RA5BzE_BnZhf5iVdNF1hA', // Funny Animals Life  
      'UClFSU9_bUb4Rc6OYfTt5SPw', // Funny Pets
      'UCGi_crMdUZnrcsvkCa8pt-g', // Kritter Klub
      'UCH1oRy1wOXgUkKI0gCR1JtQ', // Dodo Kids
    ]

    for (const channelId of channelIds) {
      try {
        const res = await fetch(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
        )
        console.log(`YouTube RSS channel ${channelId}: status ${res.status}`)
        if (!res.ok) continue

        const xml = await res.text()
        // Parse entries from XML
        const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || []

        for (const entry of entries.slice(0, 10)) {
          const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/)
          const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/)

          if (titleMatch && videoIdMatch) {
            const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            const videoId = videoIdMatch[1]
            videos.push({
              titulo: title.slice(0, 200),
              url: `https://www.youtube.com/watch?v=${videoId}`,
              thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              fuente: 'youtube',
              categoria: inferirCategoriaTexto(title),
              fecha_extraccion: new Date().toISOString(),
            })
          }
        }
      } catch (e) {
        console.error(`YouTube RSS error:`, e)
      }
    }
  }

  console.log(`YouTube total: ${videos.length} videos`)
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
  if (t.includes('dog') || t.includes('puppy') || t.includes('perro') || t.includes('cachorro') || t.includes('pup')) return 'perros'
  if (t.includes('cat') || t.includes('kitten') || t.includes('gato') || t.includes('gatito') || t.includes('kitty')) return 'gatos'
  if (t.includes('parrot') || t.includes('hamster') || t.includes('rabbit') || t.includes('bird') || t.includes('turtle')) return 'otros'
  return 'curiosidades'
}
