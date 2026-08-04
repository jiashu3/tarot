// 下载公有领域 Rider-Waite-Smith (1909) 全套 78 张牌图
// 来源: Wikimedia Commons, 通过 API 解析 480px 缩略图直链后下载, 带重试
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'images');
await mkdir(OUT, { recursive: true });

const MAJOR_NAMES = [
  'Fool', 'Magician', 'High_Priestess', 'Empress', 'Emperor', 'Hierophant',
  'Lovers', 'Chariot', 'Strength', 'Hermit', 'Wheel_of_Fortune', 'Justice',
  'Hanged_Man', 'Death', 'Temperance', 'Devil', 'Tower', 'Star', 'Moon',
  'Sun', 'Judgement', 'World',
];

// id -> Commons 文件名
const FILES = [];
MAJOR_NAMES.forEach((n, i) => {
  FILES.push([`m${String(i).padStart(2, '0')}`, `RWS_Tarot_${String(i).padStart(2, '0')}_${n}.jpg`]);
});
for (const [prefix, suit] of [['w', 'Wands'], ['c', 'Cups'], ['s', 'Swords'], ['p', 'Pents']]) {
  for (let i = 1; i <= 14; i++) {
    FILES.push([`${prefix}${String(i).padStart(2, '0')}`, `${suit}${String(i).padStart(2, '0')}.jpg`]);
  }
}

const UA = { 'User-Agent': 'TarotAppImageFetch/1.0 (personal tarot web app; contact: local-user)' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJsonWithRetry(url, tries = 4) {
  for (let t = 0; t < tries; t++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (r.ok) return await r.json();
    } catch { /* retry */ }
    await sleep(1000 * (t + 1));
  }
  throw new Error('API 请求失败: ' + url.slice(0, 120));
}

// 1) 批量解析 thumburl (每批 40 个)
async function resolveThumbUrls() {
  const map = new Map();
  for (let i = 0; i < FILES.length; i += 40) {
    const batch = FILES.slice(i, i + 40);
    const titles = batch.map(([, f]) => 'File:' + f).join('|');
    const url = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&redirects=1'
      + '&prop=imageinfo&iiprop=url&iiurlwidth=480&titles=' + encodeURIComponent(titles);
    const data = await fetchJsonWithRetry(url);
    const pages = data?.query?.pages ?? {};
    for (const p of Object.values(pages)) {
      const title = (p.title ?? '').replace(/^File:/, '').replace(/ /g, '_');
      const thumb = p.imageinfo?.[0]?.thumburl;
      if (thumb) map.set(title, thumb);
    }
  }
  return map;
}

// 2) 下载, 并发 6, 每个最多重试 4 次
async function downloadOne(id, url) {
  const dest = path.join(OUT, `${id}.jpg`);
  for (let t = 0; t < 4; t++) {
    try {
      const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(45000) });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 4000) { await writeFile(dest, buf); return true; }
      }
    } catch { /* retry */ }
    await sleep(1200 * (t + 1));
  }
  return false;
}

const thumbs = await resolveThumbUrls();
console.log(`解析到 ${thumbs.size}/${FILES.length} 个图片地址`);

const failed = [];
let done = 0;
for (let i = 0; i < FILES.length; i += 6) {
  await Promise.all(FILES.slice(i, i + 6).map(async ([id, file]) => {
    const url = thumbs.get(file);
    if (!url || !(await downloadOne(id, url))) failed.push(`${id} <- ${file}`);
    done++;
    if (done % 12 === 0) console.log(`进度 ${done}/${FILES.length}`);
  }));
}

console.log(failed.length ? `失败 ${failed.length} 张:\n${failed.join('\n')}` : '全部 78 张下载完成 ✓');
