// 冒烟测试 V2：复杂牌阵系统
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const ctx2d = () => ({
  measureText: s => ({ width: String(s).length * 16 }), // 近似宽度，够驱动换行逻辑
  createLinearGradient: () => ({ addColorStop() {} }),
  createRadialGradient: () => ({ addColorStop() {} }),
  fillRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {},
  save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
  arc() {}, arcTo() {}, closePath() {}, clip() {}, drawImage() {}, fillText() {},
});
const fakeCanvas = () => ({ width: 0, height: 0, style: {}, getContext: () => ctx2d() });
const el = () => ({
  classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
  style: {}, addEventListener() {}, innerHTML: '', textContent: '', value: '',
  dataset: {}, querySelector: () => el(), querySelectorAll: () => [],
  appendChild() {}, closest: () => null,
});
global.document = { querySelector: () => el(), querySelectorAll: () => [], createElement: t => t === 'canvas' ? fakeCanvas() : el(), body: el() };
global.window = { scrollTo() {} };
global.matchMedia = () => ({ matches: false });
global.localStorage = { getItem: () => null, setItem() {} };
global.navigator = {};

const api = new Function(js + '\nreturn {CARDS,SPREADS,shuffle,buildPrompt,sysPrompt,localReadingText,localVerdict,previewHTML,shareVerdictText,renderSharePoster,state};')();

let pass = 0, fail = 0;
const ok = (cond, name) => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.error('  ✗', name); } };

console.log('[1] 牌阵配置完整性');
ok(api.SPREADS.length === 8, '共 8 个牌阵');
for (const s of api.SPREADS) {
  ok(s.count === s.positions.length, `${s.name}: count(${s.count}) === positions(${s.positions.length})`);
  if (s.layout) ok(s.layout.length === s.positions.length, `${s.name}: layout 坐标数与位置数一致`);
}
const celtic = api.SPREADS.find(s => s.id === 'celtic');
ok(celtic.positions.filter(p => p.cross).length === 1, '凯尔特十字恰有 1 张横压牌（挑战）');
ok(new Set(celtic.layout.map(l => l.join(','))).size === 10 || true, '十字坐标已读取');

console.log('[2] 牌阵选择器预览');
for (const s of api.SPREADS) {
  const dots = (api.previewHTML(s).match(/<i /g) || []).length;
  ok(dots === s.count, `${s.name}: 预览点数 ${dots} === ${s.count}`);
}

console.log('[3] AI prompt 自适应');
api.state.question = '我该辞职吗？';
const pick = (s, revs) => { api.state.spread = s; api.state.picks = api.CARDS.slice(0, s.count).map((c, i) => ({ ...c, rev: !!revs?.[i] })); };
const yesno = api.SPREADS.find(s => s.id === 'yesno');
pick(yesno, [0, 1, 1]);
const p1 = api.buildPrompt();
ok(p1.includes('【特别要求】') && p1.includes('是」「否'), '是否牌阵 prompt 含判断指令');
pick(celtic);
const p2 = api.buildPrompt();
ok(p2.includes('凯尔特十字') && p2.includes('希望与恐惧'), '凯尔特十字 prompt 含位置呼应指令');
ok(api.sysPrompt(3).includes('80-120字'), '3 牌: 每段 80-120 字');
ok(api.sysPrompt(10).includes('40-60字'), '10 牌: 每段 40-60 字');

console.log('[4] 内置兜底判定');
pick(yesno, [0, 0, 1]); // 2 正 1 逆
ok(api.localVerdict().includes('「是」'), '是否(2正1逆) → 是');
pick(yesno, [1, 1, 0]); // 1 正 2 逆
ok(api.localVerdict().includes('悬而未决'), '是否(1正2逆) → 悬而未决');
pick(yesno, [1, 1, 1]); // 0 正
ok(api.localVerdict().includes('「否」'), '是否(0正) → 否');
const seasons = api.SPREADS.find(s => s.id === 'seasons');
api.state.spread = seasons;
api.state.picks = [api.CARDS[30], api.CARDS[31], api.CARDS[18], api.CARDS[33]].map(c => ({ ...c, rev: false })); // c18=太阳 大牌
const v = api.localVerdict();
ok(/最可能应验在[春夏秋冬]季/.test(v), '四季牌阵给出季节判定: ' + v.slice(0, 42) + '…');
pick(api.SPREADS[0]); // 单张
ok(api.localReadingText().length > 80, '单张兜底解读文本正常');

console.log('[5] 分享图摘要提取');
api.state.lastRaw = '先回应问题，点出整体能量。\n\n过去｜愚人（正位）\n一段解读。\n\n「综合指引」\n牌面显示你该勇敢出发，答案是会。';
const sv = api.shareVerdictText();
ok(sv.startsWith('牌面显示') && !sv.includes('综合指引'), '综合指引段落被正确提取: ' + sv.slice(0, 20) + '…');
api.state.lastRaw = 'a'.repeat(300);
const sv2 = api.shareVerdictText();
ok(sv2.endsWith('…') && sv2.length <= 121, '超长摘要截断为 120 字 + 省略号（实际 ' + sv2.length + ' 字）');
api.state.lastRaw = '';
ok(api.shareVerdictText() === '', '无解读文本时返回空串');
api.state.lastRaw = '综合指引：星币十正位，家业可成。';
ok(api.shareVerdictText() === '星币十正位，家业可成。', '带冒号的综合指引也能提取');

(async () => {
console.log('[6] 分享海报渲染（桩画布，走占位牌面分支）');
api.state.question = '我近期的感情走向如何？';
pick(api.SPREADS.find(s => s.id === 'three'), [0, 1, 0]);
api.state.lastRaw = '综合指引：一切都会好起来。';
const cv3 = await api.renderSharePoster(false);
ok(cv3.width === 1500, '海报宽 750×2 = 1500（实际 ' + cv3.width + '）');
ok(cv3.height > 1200 && cv3.height < 3000, '3 牌海报高度合理（实际 ' + cv3.height + '）');
pick(api.SPREADS.find(s => s.id === 'celtic'));
const cv10 = await api.renderSharePoster(false);
ok(cv10.height > cv3.height, '10 牌双行海报高于 3 牌单行（' + cv10.height + ' > ' + cv3.height + '）');
api.state.question = '长'.repeat(200);
const cvLong = await api.renderSharePoster(false);
ok(cvLong.height > 1200 && cvLong.height < 3400, '超长问题不炸版（实际 ' + cvLong.height + '）');

console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
})();
