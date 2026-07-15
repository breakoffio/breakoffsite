// Cloudflare Pages Function: per-code link previews for /invite/{code}.
// Same pattern as functions/s/[code].js; reads the public open-invite view
// (anon key, same read the page does client-side) and rewrites OG tags.

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
    const assetUrl = new URL('/invite/index.html', request.url)
    const assetRes = await env.ASSETS.fetch(assetUrl)
    let html = await assetRes.text()

    const code = params.code
    if (/^[A-Za-z0-9]{4,20}$/.test(code)) {
        try {
            const r = await fetch(
                SUPABASE_URL +
                    '/rest/v1/open_invite_public?code=eq.' +
                    encodeURIComponent(code) +
                    '&select=code,name,kind',
                {
                    headers: {
                        apikey: SUPABASE_ANON,
                        Authorization: 'Bearer ' + SUPABASE_ANON,
                    },
                    signal: AbortSignal.timeout(4000),
                }
            )
            const rows = r.ok ? await r.json() : []
            if (rows && rows.length) {
                const row = rows[0]
                const breakName = (row.name || '').trim()
                const title = breakName
                    ? 'Join "' + breakName + '" on BreakOff'
                    : 'Join a phone-free break on BreakOff'
                const desc =
                    row.kind === 'schedule'
                        ? 'A friend shared a break schedule with you. Add it and take breaks together.'
                        : 'A friend invited you to a phone-free break. Distracting apps pause until it ends.'

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
                    'https://breakoff.io/invite/' + code
                )
                html = setMeta(html, 'name', 'twitter:title', title)
                html = setMeta(html, 'name', 'twitter:description', desc)
            }
        } catch (_) {
            // Fall through to the generic static card.
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
