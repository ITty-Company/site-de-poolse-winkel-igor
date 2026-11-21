#!/bin/zsh
cd ~/Projects/site-factory
PY=~/.local/share/itty-video/.venv/bin/python
K=sites/de-poolse-winkel-igor/kf; C=sites/de-poolse-winkel-igor/clips
NEG="hands, fingers, arms, people, person, human, face, knife, spoon, ladle, jug, bottle, tools, label, text, letters, logo, watermark, deformed jar, melting glass, duplicate objects, extra jars, morphing, cuts, jittery, blurry, worst quality"
gen(){ # name a b seed prompt
  [ -f $K/$2.webp ] && [ -f $K/$3.webp ] || { echo "skip $1 (no kf)"; return; }
  [ -f $C/$1.mp4 ] && return
  echo "== $1 $(date +%T)"
  nice $PY tools/ltx_flf.py $K/$2.webp $K/$3.webp $C/$1.mp4 --prompt "Empty bright scene, nothing enters the frame except what falls or pours from above, no people. $5 One continuous shot, photoreal, soft morning window light" --neg "$NEG" --seed $4 2>&1 | grep -aE "ok |Error"
}
gen F1 k1 k2 31 "Small fresh green pickling cucumbers drop gently from above into the empty glass jar on the windowsill and settle upright side by side until the jar is full. Static camera."
gen F2 k2 k3 32 "Dill flower heads, peeled garlic cloves and yellow mustard seeds fall softly from above into the open jar of cucumbers and settle between them. Static camera."
gen F3 k3 k4 33 "A thin clear stream of water pours straight down from above into the open jar, the water level rises to half, small bubbles rise, sunlight caustics ripple on the sill. Static camera."
gen F4 k4 k5 34 "The water keeps rising to the neck of the jar, the stream stops, a plain silver metal lid descends from above and settles on the jar, light condensation appears. Static camera."
gen F5 k5 k6 35 "Time-lapse: sunlight and shadows slowly move across the windowsill from midday to warm golden hour, the cucumbers slowly darken to olive green, the brine turns softly golden, tiny bubbles rise. Static camera."
gen O1 k10 k11 36 "The camera walks slowly and steadily forward along the brick pavement and turns gently to the right toward the shop window with glass jars. Quiet street, no people, no cars."
gen W1 k7 k8 37 "Slow lateral camera truck to the right along the wooden shop shelf, from the jars to the shelf with rye bread. No people."
gen W2 k8 k9 38 "The camera keeps trucking right with a slight push-in, from the bread shelf to the end of the wooden counter with sausage, cheese and sweets. No people."
gen C1 k12 k12 39 "Locked-off camera. The sheer curtain sways very gently, dust motes drift in the sunbeam, light outside shifts softly. Nothing else moves."
echo "== ALL DONE $(date +%T)"
