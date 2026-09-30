/* ================= 对路：手里有某类卡时，拿遗物 / 学天赋偶尔多出一个针对性的选项 =================
 * 不看仓库保底，纯随机：祭坛、包裹、熔炉、杂货铺、夜谈、过路人，都有一定几率多给一个「对路」选项。
 * 这些遗物和天赋平时不进随机池，只在你手里有对应的卡时才可能冒出来。
 * 主要补各流派的短板：单体兵器缺范围、成长卡缺攻速、元素流缺扩散。
 */
const hasKind=k=>G.cards.some(c=>ITEMS[c.key].kind===k);
const hasTag=t=>G.cards.some(c=>ITEMS[c.key].tag===t);
const isGrow=c=>(ITEMS[c.key].d||'').includes('【成长】');
const hasGrow=()=>G.cards.some(isGrow);
const hasAmmo=()=>G.cards.some(c=>ITEMS[c.key].ammo!=null);
const hasBig=()=>G.cards.some(c=>c.size===3);
const near=(e,R)=>B.en.filter(o=>!o.dead&&o!==e&&Math.hypot(ex(o)-ex(e),ey(o)-ey(e))<=R);
const FIT_CHANCE=.4;

Object.assign(MODL,{
  'kspd_兵器':['【兵器】卡攻击速度',1],'kspd_灯具':['【灯具】卡攻击速度',1],'kspd_火器':['【火器】卡攻击速度',1],'tspd_电':['【电】卡攻击速度',1],
  s3spd:['大型卡攻击速度',1],ammoSpd:['弹药卡攻击速度',1],growSpd:['【成长】卡攻击速度',1],
  t_splash:['【兵器】卡命中时，溅到目标身边的敌人（35%伤害）',2],
  t_groove:['【成长】卡杀敌时炸开，伤到周围的敌人',2],
  t_growspd:['【成长】卡每攒5点成长，攻击速度+4%（最多+40%）',2],
  t_ember:['烧着的敌人死了，火会窜到旁边的敌人身上',2],
  t_plague:['中毒的敌人死了，一半的毒会传给旁边的敌人',2],
  t_frostlens:['冻住敌人时，旁边的敌人减速40%',2],
  t_sweep:['【兵器】卡暴击时，目标身边的敌人挨同样一下',2]
});
/* 攻速类：按功能标签 / 元素 / 尺寸 / 弹药 / 成长 加到卡上 */
function fitSpd(c){const it=ITEMS[c.key];let s=mv('kspd_'+it.kind)+mv('tspd_'+it.tag);if(c.size===3)s+=mv('s3spd');if(it.ammo!=null)s+=mv('ammoSpd');
  if(isGrow(c)){s+=mv('growSpd');if(mv('t_growspd'))s+=Math.min(.4,Math.floor((c.grow||0)/5)*.04)*mv('t_growspd');}return s;}

Object.assign(RELICS,{
  scabbard:{n:'旋风刀鞘',t:1,ico:'claw:w',fit:()=>hasKind('兵器'),m:{t_splash:1},
    on:{hit:(n,x)=>{if(x.splash||!x.src||kindOf(x.src)!=='兵器'||!x.a)return;const R=16*K();const ns=near(x.e,R);if(!ns.length)return;
      ring(ex(x.e),ey(x.e)-5,2,R,'#e3e9f0',.2);for(const o of ns)hurt(o,x.a*.35*n,x.src,false,{splash:1});}},
    f:'刀出鞘的时候带着风，风也会割人。'},
  chant:{n:'磨刀号子',t:1,ico:'scroll:w',fit:()=>hasKind('兵器'),m:{'kspd_兵器':.15},f:'嘿——哟。一声号子，一下刀。'},
  groove:{n:'血槽',t:2,ico:'claw:R',fit:hasGrow,m:{t_groove:1},
    on:{kill:(n,x)=>{const s=x.src;if(!s||!isGrow(s)||!s.el)return;const X=ex(x.e),Y=ey(x.e)-4,R=18*K();const amt=stats(s,B.t).total*.6*n;
      ring(X,Y,2,R,'#ff5a5a',.25);later(.03,()=>{for(const o of B.en)if(!o.dead&&Math.hypot(ex(o)-X,ey(o)-Y)<=R)hurt(o,amt,s,false,{splash:1});});}},
    f:'刀身上那道槽，是给血留的路。'},
  grit:{n:'砥石粉',t:1,ico:'potion:w',fit:hasGrow,m:{t_growspd:1},f:'磨下来的粉也别扔，撒在刃上，刀会记得。'},
  bellows:{n:'余烬风箱',t:1,ico:'boot:o',fit:()=>hasTag('火'),m:{t_ember:1},
    on:{kill:(n,x)=>{if(!x.burning)return;const e=x.e;const ns=near(e,18*K());if(!ns.length)return;ring(ex(e),ey(e)-5,2,18*K(),'#ef7d57',.25);
      for(const o of ns){o.burnT=Math.max(o.burnT,3);o.burnD=Math.max(o.burnD,e.burnD*(.6+.2*n));o.burnSrc=e.burnSrc;}}},
    f:'呼——一口气，火就换了个地方烧。'},
  rat:{n:'疫鼠',t:1,ico:'shroom:l',fit:()=>hasTag('毒'),m:{t_plague:1},
    on:{kill:(n,x)=>{if(!x.poisoned)return;const e=x.e;const ns=near(e,18*K());if(!ns.length)return;ring(ex(e),ey(e)-5,2,18*K(),'#7ddc5f',.25);
      for(const o of ns.slice(0,4)){o.poisonT=Math.max(o.poisonT,3);o.poisonD+=e.poisonD*.5*n;if(!o.poisonSrc)o.poisonSrc=e.poisonSrc;}}},
    f:'笼子是空的。它自己出去了。'},
  coil:{n:'蓄电线圈',t:1,ico:'ring:Y',fit:()=>hasTag('电'),m:{'tspd_电':.15},f:'绕了九百九十九圈，最后一圈留给雷。'},
  frostlens:{n:'霜镜',t:1,ico:'gem:C',fit:()=>hasTag('冰'),m:{t_frostlens:1},
    on:{freeze:(n,x)=>{const e=x.e;if(!e)return;for(const o of near(e,20*K())){o.slowT=Math.max(o.slowT,2);o.slowA=Math.min(.85,Math.max(o.slowA,.4*(o.d.boss?.5:1)));}}},
    f:'镜子里的冬天，比外面来得早。'},
  loader:{n:'快装弹带',t:1,ico:'badge:N',fit:hasAmmo,m:{ammoSpd:.2},f:'弹一颗一颗排好，手就不会抖。'},
  pulley:{n:'滑轮组',t:1,ico:'ring:N',fit:hasBig,m:{s3spd:.15},f:'绳子多绕两圈，大家伙也抬得快。'},
  lampfair:{n:'灯会',t:1,ico:'orb:y',fit:()=>hasKind('灯具'),m:{'kspd_灯具':.15},f:'一年一次。今年提前了，就在城墙上办。'},
  fusebox:{n:'引信盒',t:1,ico:'book:o',fit:()=>hasKind('火器'),m:{'kspd_火器':.15},f:'每根引信都剪得一样长。'}
});
Object.assign(TALENTS,{
  f_sweep:{n:'横扫',cat:'atk',r:1,fit:()=>hasKind('兵器'),m:{t_sweep:1},say:'一刀下去，旁边那个也别想跑。',
    on:{crit:x=>{if(!x.src||kindOf(x.src)!=='兵器'||!x.a||!x.e)return;for(const o of near(x.e,16*K()))hurt(o,x.a,x.src,false,{splash:1});}}},
  f_hone:{n:'越磨越快',cat:'atk',r:1,fit:hasGrow,m:{growSpd:.2},say:'刀越利，手越快。'},
  f_quick:{n:'快手',cat:'tech',r:0,fit:()=>hasKind('兵器')||hasAmmo(),m:{'kspd_兵器':.08,ammoSpd:.1},say:'拔刀、上弦、装弹，都得快。'}
});

function fitRelic(have,chance){if(Math.random()>=(chance==null?FIT_CHANCE:chance))return null;
  const p=Object.keys(RELICS).filter(k=>{const R0=RELICS[k];return R0.fit&&R0.fit()&&!have.includes(k)&&!(R0.u&&G.relics.includes(k));});return p.length?pick(p):null;}
function withFit(list,chance){const k=fitRelic(list,chance);return k?list.concat(k):list;}
function fitTalent(have){if(Math.random()>=FIT_CHANCE)return null;
  const p=Object.keys(TALENTS).filter(id=>TALENTS[id].fit&&TALENTS[id].fit()&&talentOk(id)&&!have.includes(id));return p.length?pick(p):null;}
const FIT_TAG='<small class="gt fit">对路</small>';
