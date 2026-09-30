/* ================= 熟练：轻量的局外成长 =================
 * 每个守夜人各自记账：守住一夜记 1 点，守到黎明额外 +2。攒够了升一级，开局多点小便宜。
 * 存在 chain-meta-v1 的 mast 里，跟成就、长夜一起，删单局存档不丢。
 */
const MAST_LV=[5,15,30,50];
const MAST_PERK=['开局多 2 金','夜谈多一个候选','开局带一件普通遗物','开局第一张卡升到银'];
const MAST_SHORT=['多2金','夜谈多一选','送遗物','首卡升银'];
function mastPts(h){return((META.mast||{})[h||G.hero])||0;}
function mastLv(h){const p=mastPts(h);return MAST_LV.filter(n=>p>=n).length;}
function mastNext(h){const p=mastPts(h),n=MAST_LV.find(x=>p<x);return n?n-p:0;}
function mastHtml(h){const lv=mastLv(h),nx=mastNext(h);
  return `<span class="hmast">熟练 <b>${lv}</b>${nx?`<small>差${nx}夜</small>`:''}</span>`;}
/* 开局时按等级发放 */
function mastStart(){const lv=mastLv();if(!lv)return;
  G.gold+=2;
  if(lv>=3){const r=rollGear(1,0,0)[0];if(r){G.relics.push(r);const w=RELICS[r].m.wall;if(w){G.wallMax=Math.max(5,G.wallMax+w);G.wall=Math.min(G.wallMax,G.wall+Math.max(0,w));}recalcMods();renderRelics(true);}}
  if(lv>=4){const c=G.cards.find(x=>x.tier<1);if(c)c.tier++;}}
/* 一局结束时记账，返回这局加了多少、有没有升级 */
function mastGain(win){const h=G.hero;const add=win?G.maxRound+2:Math.max(0,G.round-1);if(!add)return null;
  const lv0=mastLv(h);META.mast=META.mast||{};META.mast[h]=mastPts(h)+add;saveMeta();const lv=mastLv(h);
  return{add,lv,up:lv>lv0?MAST_PERK[lv-1]:null};}
function mastNote(m){if(!m)return '';
  return `<div class="newheat">${HEROES[G.hero].n}的熟练 +${m.add}${m.up?`，升到 <b>${m.lv}</b> 级：${m.up}`:`（${m.lv} 级）`}</div>`;}
