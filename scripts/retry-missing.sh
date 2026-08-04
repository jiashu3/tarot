#!/usr/bin/env bash
# 只补下载缺失/损坏的牌图，可反复运行直到 78/78
set -u
cd "$(dirname "$0")/.."
mkdir -p images

MAJORS=(Fool Magician High_Priestess Empress Emperor Hierophant Lovers Chariot Strength Hermit Wheel_of_Fortune Justice Hanged_Man Death Temperance Devil Tower Star Moon Sun Judgement World)

: > /tmp/tarot_retry_jobs.txt
for i in "${!MAJORS[@]}"; do
  id=$(printf 'm%02d' "$i")
  [ -s "images/${id}.jpg" ] && [ "$(stat -c%s "images/${id}.jpg")" -gt 4000 ] && continue
  printf '%s|RWS_Tarot_%02d_%s.jpg\n' "$id" "$i" "${MAJORS[$i]}" >> /tmp/tarot_retry_jobs.txt
done
for pair in "w Wands" "c Cups" "s Swords" "p Pents"; do
  set -- $pair
  for i in $(seq 1 14); do
    id=$(printf '%s%02d' "$1" "$i")
    [ -s "images/${id}.jpg" ] && [ "$(stat -c%s "images/${id}.jpg")" -gt 4000 ] && continue
    printf '%s|%s%02d.jpg\n' "$id" "$2" "$i" >> /tmp/tarot_retry_jobs.txt
  done
done

n=$(wc -l < /tmp/tarot_retry_jobs.txt)
echo "待补: ${n} 张"
[ "$n" -eq 0 ] && echo "已齐全 ✓" && exit 0

dl_one() {
  local id="$1" file="$2" url
  url="https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=480"
  for t in 1 2 3 4 5; do
    if curl -sL --fail --max-time 90 -o "images/${id}.jpg" "$url" && [ "$(stat -c%s "images/${id}.jpg" 2>/dev/null || echo 0)" -gt 4000 ]; then
      return 0
    fi
    sleep $((t * 3))
  done
  echo "FAIL ${id} <- ${file}"
  return 1
}
export -f dl_one

xargs -P 4 -I{} bash -c 'IFS="|" read -r id f <<< "{}"; dl_one "$id" "$f"' < /tmp/tarot_retry_jobs.txt

ok=$(find images -name '*.jpg' -size +4000c | wc -l)
echo "当前: ${ok}/78 张"
