#!/usr/bin/env bash
# Renders static/og-image.jpg from card.html. Override CHROME to point at a browser.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
OUT="../../static/og-image.jpg"
FLAGS=(--headless --no-sandbox --disable-gpu --hide-scrollbars)

cp ../../static/brendan-profile.webp .
# Chromium reserves ~87 CSS px of the window for browser UI, so ask for 630+87.
"$CHROME" "${FLAGS[@]}" --force-device-scale-factor=2 --window-size=1200,717 \
  --screenshot=card-2x.png "file://$PWD/card.html" 2>/dev/null

cat > .shrink.html <<'HTML'
<!doctype html><html><body><script>
const img=new Image();
img.onload=()=>{
  const c=document.createElement('canvas');c.width=1200;c.height=630;
  const x=c.getContext('2d');x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';
  x.drawImage(img,0,0,2400,1260,0,0,1200,630);
  const d=document.createElement('div');d.textContent=c.toDataURL('image/jpeg',0.92);
  document.body.appendChild(d);
};
img.src='card-2x.png';
</script></body></html>
HTML

"$CHROME" --headless --no-sandbox --disable-gpu --allow-file-access-from-files \
  --virtual-time-budget=8000 --dump-dom "file://$PWD/.shrink.html" 2>/dev/null \
  | grep -o 'data:image/jpeg;base64,[A-Za-z0-9+/=]*' | head -1 \
  | sed 's/^data:image\/jpeg;base64,//' \
  | python3 -c "import base64,sys;sys.stdout.buffer.write(base64.b64decode(sys.stdin.read().strip()))" > "$OUT"

rm -f card-2x.png .shrink.html brendan-profile.webp
echo "Wrote $OUT ($(wc -c < "$OUT") bytes)"
