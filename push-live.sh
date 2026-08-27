#!/bin/bash
# BreakOff Website publish script.
#
# IMPORTANT: pushing to GitHub does NOT put anything on breakoff.io.
# breakoff.io is served by Cloudflare Pages (project: breakoffsite) from the
# _deploy/ folder. Steps 2 and 3 below are what actually make a post live.
#
# Each week, update:
#   - the git add index.html assets/shot-home.png assets/shot-rules.png \
  assets/shot-circles.png assets/shot-host.png assets/shot-streaks.png \
  assets/shot-active-break.png assets/shot-modes.png

git commit -m "Homepage rebuild around Modes, Routines, Circles and Host

- New lead: Put your phone down. Be here.
- Modes collapsed to Flexible, Locked and Physical (QR and NFC live under Physical)
- I'm Done removed from the site
- Rules terminology moved to Routines, with real routine names
- Circles copy cut back to the benefit; Host reframed as putting a whole room on a break
- Streaks reframed away from gamification
- Current app screenshots (Rules, Circles, Host, four-tab bar), silent-mode icon removed" || echo "Nothing new to commit."

git push origin main
echo "Step 1 done: pushed source to GitHub."
echo ""

# ---------------------------------------------------------------------------
# 2. Sync the site into _deploy/ (this is what Cloudflare Pages uploads)
#    Everything not excluded here gets published.
# ---------------------------------------------------------------------------
rsync -a --delete \
  --exclude '.git/' \
  --exclude '.claude/' \
  --exclude '.wrangler/' \
  --exclude '_deploy/' \
  --exclude '_to_delete/' \
  --exclude 'Agent/' \
  --exclude 'functions/' \
  --exclude 'blog/drafts/' \
  --exclude '*.md' \
  --exclude '*.bak' \
  --exclude '*.command' \
  --exclude 'push-live.sh' \
  ./ _deploy/

echo "Step 2 done: synced _deploy/."
echo ""

# NOTE: functions/ is excluded above because it was never part of the live
# deploy as of the July 11 baseline. If you want Cloudflare Pages Functions
# (functions/invite/[code].js, functions/s/[code].js) to go live, delete that
# exclude line and test /invite/<code> and /s/<code> after deploying.

# ---------------------------------------------------------------------------
# 3. Deploy to Cloudflare Pages
# ---------------------------------------------------------------------------
npx wrangler pages deploy _deploy \
  --project-name=breakoffsite \
  --commit-dirty=true

echo "Step 3 done: deploy submitted."
echo ""

# ---------------------------------------------------------------------------
# 4. Verify the post is actually reachable before reporting success
# ---------------------------------------------------------------------------
POST_URL="https://breakoff.io/"
echo "Verifying $POST_URL"

for i in 1 2 3 4 5 6; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "$POST_URL")
  HAS=$(curl -s "$POST_URL" | grep -c "Put your phone down" || true)
  if [ "$CODE" = "200" ] && [ "$HAS" -gt 0 ]; then
    echo ""
    echo "LIVE: $POST_URL is serving the new homepage."
    exit 0
  fi
  echo "  attempt $i: HTTP $CODE, retrying in 10s"
  sleep 10
done

echo ""
echo "WARNING: $POST_URL is still not returning 200."
echo "The post is committed and _deploy/ is synced, but it is NOT confirmed live."
exit 1
