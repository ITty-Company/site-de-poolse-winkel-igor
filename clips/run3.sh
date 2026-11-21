#!/bin/zsh
while pgrep -f "zsh run2.sh" >/dev/null; do sleep 10; done
cd ~/Projects/site-factory
PY=~/.local/share/itty-video/.venv/bin/python
K=sites/de-poolse-winkel-igor/kf; C=sites/de-poolse-winkel-igor/clips
NEG="hands, fingers, people, jug, bottle, tools, text, logo, falling objects, vertical stream, long green line, snake, stretched, elastic, liquid, deformed jar, melting glass, extra jars, cuts, jittery, blurry, worst quality"
gen(){ [ -f $C/$1.mp4 ] && return; echo "== $1 $(date +%T)"
  nice $PY tools/ltx_flf.py $K/$2.webp $K/$3.webp $C/$1.mp4 --prompt "$5" --neg "$NEG" --seed $4 2>&1 | grep -aE "ok |Error"; }
P="Stop-motion time-lapse on a sunny windowsill, locked-off camera: inside the empty glass jar, short rigid green pickling cucumbers appear one after another, standing upright, until the jar is tightly packed. The space above the jar stays empty, nothing falls, nothing enters the frame. Photoreal, soft morning light."
gen F1d k1 k2 61 "$P"
gen F1e k1 k2 71 "$P"
echo "== ALL DONE $(date +%T)"
