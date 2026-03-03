import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Keywords that MUST appear in title to confirm it's animal content
const ANIMAL_KEYWORDS = [
  'dog', 'puppy', 'pup', 'doggo', 'pupper', 'hound', 'retriever', 'labrador', 'corgi', 'husky', 'beagle', 'bulldog', 'poodle', 'shepherd', 'terrier', 'dachshund', 'chihuahua',
  'cat', 'kitten', 'kitty', 'meow', 'feline', 'tabby', 'calico', 'siamese',
  'pet', 'pets', 'animal', 'animals', 'mascota', 'mascotas',
  'hamster', 'rabbit', 'bunny', 'parrot', 'bird', 'turtle', 'fish', 'hedgehog', 'ferret', 'guinea pig', 'duck', 'goose', 'chicken', 'horse', 'pony', 'cow', 'pig', 'goat', 'sheep', 'deer', 'fox', 'raccoon', 'squirrel', 'otter', 'seal', 'penguin', 'koala', 'panda', 'bear', 'monkey', 'elephant', 'lion', 'tiger',
  'perro', 'gato', 'gatito', 'cachorro', 'conejo', 'pájaro', 'tortuga', 'pez', 'caballo',
  'cute', 'adorable', 'funny animal', 'aww', 'boop', 'snoot', 'zoomies', 'tippy taps', 'sploot', 'blep', 'mlem',
]

function isAnimalContent(title: string): boolean {
  const t = title.toLowerCase()
  return ANIMAL_KEYWORDS.some(kw => t.includes(kw))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const clave = url.searchParams.get('clave')
    const cronSecret = Deno.env.get('CRON_SECRET')

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

    const [redditVideos, youtubeVideos] = await Promise.all([
      extraerReddit(),
      extraerYouTube(Deno.env.get('YOUTUBE_API_KEY') || ''),
    ])

    console.log(`Extraídos: ${redditVideos.length} Reddit, ${youtubeVideos.length} YouTube`)

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
        if (!error) nuevos++
        else {
          errores++
          if (errores <= 3) console.error('Insert error:', error.message)
        }
      }
    }

    return new Response(JSON.stringify({
      mensaje: 'ok', nuevos, errores,
      total_extraidos: allVideos.length,
      reddit: redditVideos.length,
      youtube: youtubeVideos.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// --- Reddit ---
async function extraerReddit() {
  const videos: any[] = []

  // Animal-only subreddits
  const subreddits = [
    'aww', 'AnimalsBeingDerps', 'rarepuppers', 'Zoomies',
    'catvideos', 'dogvideos', 'AnimalsBeingBros',
    'IllegallySmolCats', 'tippytaps', 'WhatsWrongWithYourDog',
  ]

  for (const sub of subreddits) {
    try {
      // Use public JSON endpoint (no auth needed)
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`, {
        headers: { 'User-Agent': 'web:viralmascotas:v1.0 (by /u/viralmascotas)' },
      })

      if (!res.ok) {
        console.log(`Reddit r/${sub}: ${res.status}`)
        continue
      }

      const json = await res.json()
      const children = json.data?.children || []

      for (const child of children) {
        const post = child.data
        if (!post.url) continue

        const isRedditVideo = post.is_video || post.url.includes('v.redd.it')
        const isYouTube = post.url.includes('youtube.com') || post.url.includes('youtu.be')

        if (!isRedditVideo && !isYouTube) continue

        // Get the proper video URL for Reddit hosted videos
        let videoUrl = post.url
        if (isRedditVideo && post.media?.reddit_video?.fallback_url) {
          videoUrl = post.media.reddit_video.fallback_url
        }

        const thumbnail = (post.thumbnail?.startsWith('http'))
          ? post.thumbnail
          : (post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&') || null)

        videos.push({
          titulo: post.title?.slice(0, 200) || 'Sin título',
          url: videoUrl,
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

  console.log(`Reddit total: ${videos.length}`)
  return videos
}

// --- YouTube ---
async function extraerYouTube(apiKey: string) {
  const videos: any[] = []

  if (apiKey) {
    const queries = [
      'funny dogs compilation', 'cute kittens playing', 'funny pets 2025',
      'puppies doing funny things', 'cats being cats funny',
    ]
    for (const q of queries) {
      try {
        const res = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=20&videoCategoryId=15&key=${apiKey}`
        )
        if (!res.ok) continue
        const json = await res.json()
        for (const item of json.items || []) {
          const title = item.snippet?.title || ''
          if (!isAnimalContent(title)) continue
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

  // RSS fallback from animal-specific channels
  if (videos.length === 0) {
    console.log('Using YouTube RSS fallback')
    const channelIds = [
      'UCPIvT-zcQl2H0vabdXJGcpg', // The Dodo
      'UCGi_crMdUZnrcsvkCa8pt-g', // Kritter Klub
      'UCH1oRy1wOXgUkKI0gCR1JtQ', // Dodo Kids
      'UCVAKz2sYfQ4VW2FYRaBHUOg', // Funny Pet Videos
      'UC7lIipCMwkdhOXBKyibd73Q', // Tucker Budzyn
    ]

    for (const channelId of channelIds) {
      try {
        const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)
        if (!res.ok) continue
        const xml = await res.text()
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
        console.error('YouTube RSS error:', e)
      }
    }
  }

  console.log(`YouTube total: ${videos.length}`)
  return videos
}

function inferirCategoria(subreddit: string, title: string): string {
  const sub = subreddit.toLowerCase()
  if (sub.includes('dog') || sub.includes('pupper') || sub.includes('zoomies') || sub.includes('tippytaps')) return 'perros'
  if (sub.includes('cat') || sub.includes('smolcats')) return 'gatos'
  return inferirCategoriaTexto(title)
}

function inferirCategoriaTexto(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('dog') || t.includes('puppy') || t.includes('perro') || t.includes('cachorro') || t.includes('pup') || t.includes('pupper') || t.includes('doggo')) return 'perros'
  if (t.includes('cat') || t.includes('kitten') || t.includes('gato') || t.includes('gatito') || t.includes('kitty') || t.includes('feline')) return 'gatos'
  if (t.includes('parrot') || t.includes('hamster') || t.includes('rabbit') || t.includes('bird') || t.includes('turtle') || t.includes('fish') || t.includes('bunny')) return 'otros'
  return 'curiosidades'
}
