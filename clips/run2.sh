#!/bin/zsh
cd ~/Projects/site-factory
PY=~/.local/share/itty-video/.venv/bin/python
K=sites/de-poolse-winkel-igor/kf; C=sites/de-poolse-winkel-igor/clips
NEG="hands, fingers, arms, people, person, human, face, knife, spoon, ladle, jug, bottle, pitcher, cup, tools, label, text, letters, logo, watermark, deformed jar, melting glass, long stretched cucumber, elastic, duplicate objects, extra jars, morphing, cuts, jittery, blurry, worst quality"
gen(){ [ -f $C/$1.mp4 ] && return; echo "== $1 $(date +%T)"
  nice $PY tools/ltx_flf.py $K/$2.webp $K/$3.webp $C/$1.mp4 --prompt "Empty bright scene, no people. $5 One continuous shot, photoreal, soft morning window light, locked-off camera" --neg "$NEG" --seed $4 2>&1 | grep -aE "ok |Error"; }
P1="Short small pickling cucumbers, each one the size of a finger, drop one by one from just above the open jar and land upright inside it, quickly filling the jar. Rigid cucumbers, natural gravity."
P4="Clear water keeps flowing into the jar until it reaches the neck, then the thin stream fades away. A plain silver lid appears on top of the jar and the glass mists slightly. Nothing else enters the frame."
gen F1b k1 k2 41 "$P1"
gen F4b k4 k5 44 "$P4"
gen F1c k1 k2 51 "$P1"
gen F4c k4 k5 54 "$P4"
echo "== ALL DONE $(date +%T)"
