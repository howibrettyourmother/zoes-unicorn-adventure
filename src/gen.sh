# TTS voice pipeline: piper (amy) -> brighten/pitch-up -> trim leading/trailing silence -> 32k mono mp3
set -e
mkdir -p /tmp/zua && cd /tmp/zua
[ -f silent.mp3 ] || ffmpeg -y -loglevel error -f lavfi -i anullsrc=r=24000:cl=mono -t 1 -b:a 32k silent.mp3
while IFS='|' read -r k t v; do
  [ -z "$k" ] && continue
  [ -f $k.mp3 ] && [ "$FORCE" != 1 ] && continue
  LS=0.88; case $k in c*) LS=0.8;; esac
  echo "$t" | /tmp/tts/bin/piper -m /tmp/voices/en_US-$v-medium.onnx -f raw_$k.wav --length-scale $LS --noise-scale 0.75 >/dev/null 2>&1
  ffmpeg -y -loglevel error -i raw_$k.wav -af "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,asetrate=22050*1.22,aresample=24000,atempo=0.9,highpass=f=140,equalizer=f=3500:t=q:w=1:g=3,acompressor=threshold=-18dB:ratio=3,volume=1.8,alimiter=limit=0.95" -ac 1 -ar 24000 -b:a 32k $k.mp3
  echo $k $(stat -c%s $k.mp3)
done < /workspace/zoes-unicorn-adventure/src/lines.txt
