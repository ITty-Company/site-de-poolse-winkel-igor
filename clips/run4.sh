#!/bin/zsh
cd ~/Projects/site-factory
PY=~/.local/share/itty-video/.venv/bin/python
K=sites/de-poolse-winkel-igor/kf; C=sites/de-poolse-winkel-igor/clips
NEG="hands, fingers, arms, people, person, text, letters, logo, watermark, deformed, melting, duplicate objects, morphing, cuts, jittery, blurry, worst quality"
gen(){ [ -f $C/$1.mp4 ] && return; echo "== $1 $(date +%T)"
  nice $PY tools/ltx_flf.py $K/$2.webp $K/$3.webp $C/$1.mp4 --prompt "Empty shop, no people. $5 One continuous shot, photoreal, soft morning window light" --neg "$NEG" --seed $4 2>&1 | grep -aE "ok |Error"; }
gen W1f k7f k8f 37 "Slow lateral camera truck to the right along the wooden shop shelf, from the jars to the shelf with rye bread."
gen W2f k8f k9 38 "The camera keeps trucking right with a slight push-in, from the bread shelf to the end of the wooden counter with sausage, cheese and sweets."
gen C1f k12f k12f 39 "Locked-off camera. The sheer curtain sways very gently, dust motes drift in the sunbeam, light outside shifts softly. Nothing else moves."
echo "== ALL DONE $(date +%T)"
