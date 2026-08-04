#!/usr/bin/env bash
# 下载公有领域 RWS (1909) 全套 78 张牌图 —— 通过 Commons Special:FilePath (480px 缩略图)
set -u
cd "$(dirname "$0")/.."
mkdir -p images

MAJORS=(Fool Magician High_Priestess Empress Emperor Hierophant Lovers Chariot Strength Hermit Wheel_of_Fortune Justice Hanged_Man Death Temperance Devil Tower Star Moon Sun Judgement World)

: > /tmp/tarot_dl_jobs.txt
for i in "${!MAJORS[@]}"; do
  printf 'm%02d|RWS_Tarot_%02d_%s.jpg\n' "$i" "$i" "${MAJORS[$i]}" >> /tmp/tarot_dl_jobs.txt
done
for pair in "w Wands" "c Cups" "s Swords" "p Pents"; do
  set -- $pair
  for i in $(seq 1 14); do
    printf '%s%02d|%s%02d.jpg\n' "$1" "$i" "$2" "$i" >> /tmp/tarot_dl_jobs.txt
  done
done

dl_one() {
  local id="$1" file="$2" url
  url="https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=480"
  for t in 1 2 3 4; do
    if curl -sL --fail --max-time 60 -o "images/${id}.jpg" "$url" && [ "$(stat -c%s "images/${id}.jpg" 2>/dev/null || echo 0)" -gt 4000 ]; then
      return 0
    fi
    sleep $((t * 2))
  done
  echo "FAIL ${id} <- ${file}"
  return 1
}
export -f dl_one

xargs -P 6 -I{} bash -c 'IFS="|" read -r id f <<< "{}"; dl_one "$id" "$f"' < /tmp/tarot_dl_jobs.txt

ok=$(find images -name '*.jpg' -size +4000c | wc -l)
echo "完成: ${ok}/78 张"
