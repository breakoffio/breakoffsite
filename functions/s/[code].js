// Cloudflare Pages Function: per-code link previews for /s/{code}.
//
// iMessage, Slack, and social crawlers read Open Graph tags from the HTML
// they fetch. The static /s/index.html carries a generic card; this
// function fetches the share row (same public REST read the page itself
// does client-side, anon key only) and rewrites the OG/Twitter tags so the
// card says who is hosting and what the break is called. Falls back to the
// untouched static page on any failure. Humans see the exact same page
// either way; only the <head> metadata differs.

const SUPABASE_URL = 'https://qpoywatpflqdbpfejnas.supabase.co'
const SUPABASE_ANON =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb3l3YXRwZmxxZGJwZmVqbmFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTU0OTcsImV4cCI6MjA4NzczMTQ5N30.2hJnOumhVxRLaniBkuX6ukGDHbJ5z4RJgcSC7lysoVw'

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function setMeta(html, attr, key, value) {
    const re = new RegExp(
        '(' + attr + '="' + key + '"\\s+content=")[^"]*(")',
        'i'
    )
    return html.replace(re, '$1' + esc(value) + '$2')
}

export async function onRequestGet(context) {
    const { params, request, env } = context
    const assetUrl = new URL('/s/index.html', request.url)
    const assetRes = await env.ASSETS.fetch(assetUrl)
    let html = await assetRes.text()

    const code = params.code
    if (/^[A-Za-z0-9]{4,20}$/.test(code)) {
        try {
            const r = await fetch(
                SUPABASE_URL +
                    '/rest/v1/schedule_shares?code=eq.' +
                    encodeURIComponent(code) +
                    '&select=title,business_name,description,share_type',
                {
                    headers: {
                        apikey: SUPABASE_ANON,
                        Authorization: 'Bearer ' + SUPABASE_ANON,
                    },
                    // Keep crawlers fast even if the DB is slow.
                    signal: AbortSignal.timeout(4000),
                }
            )
            const rows = r.ok ? await r.json() : []
            if (rows && rows.length) {
                const row = rows[0]
                const breakName = (row.title || '').trim()
                const host = (row.business_name || '').trim()
                const title = breakName
                    ? 'Join "' + breakName + '" on BreakOff'
                    : 'Join a phone-free break on BreakOff'
                const desc = (row.description || '').trim()
                    ? row.description.trim()
                    : host
                      ? host + ' invites you to a phone-free break. Distracting apps pause until it ends.'
                      : 'A phone-free break. Distracting apps pause until it ends.'

                html = html.replace(
                    /<title>[^<]*<\/title>/i,
                    '<title>' + esc(title) + '</title>'
                )
                html = setMeta(html, 'property', 'og:title', title)
                html = setMeta(html, 'property', 'og:description', desc)
                html = setMeta(
                    html,
                    'property',
                    'og:url',
                    'https://breakoff.io/s/' + code
                )
                html = setMeta(html, 'name', 'twitter:title', title)
                html = setMeta(html, 'name', 'twitter:description', desc)
            }
        } catch (_) {
            // Any failure -> generic static card. Never block the page.
        }
    }

    return new Response(html, {
        status: 200,
        headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'public, max-age=300',
        },
    })
}
