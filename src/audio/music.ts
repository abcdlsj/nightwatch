/* 背景音乐：WebAudio 现场合成，跟着场景换曲。
 * 曲谱格式：prog 每小节一个和弦 [根音, m小/M大]，每小节 16 步；
 * bass/arp 每字符一步：x 根音、5 五度、o 高八度、数字=和弦第几个音；lead 空格分隔：数字起音、- 延长、. 休止
 * Background music: synthesized live with WebAudio and switched per scene. Score format: prog is one chord per bar [root, m minor/M major], 16 steps per bar; each character in bass/arp is one step: x root, 5 fifth, o octave up, a digit = which chord tone; lead is space-separated: a digit starts a note, - sustains, . rests
 */
import { SFX } from './sfx';

interface Song {
  bpm: number; prog: [number, string][]; bass: string; bv: number; bt: OscillatorType;
  arp?: string; av: number; at: OscillatorType; ao: number;
  lead?: string[][]; lv?: number; lt?: OscillatorType; box?: number;
  k?: string; s?: string; h?: string;
}
const RAW: Record<string, any> = {
  title: { bpm: 64, prog: [[45, 'm'], [41, 'M'], [48, 'M'], [43, 'M']], bass: 'x.......5.......', bv: 0.035, bt: 'triangle', arp: '0...1...2...1...', av: 0.016, at: 'triangle', ao: 24,
    lead: ['76 - - - - - - - 72 - - - - - - -', '. . . . 69 - - - 72 - - - . . . .', '. . . . 67 - - - 72 - - - 76 - - -', '74 - - - - - - - . . . . . . . .'], lv: 0.02, lt: 'sine' },
  /* 备战：八音盒里那首「师父的曲子」 / prep: the music-box tune 'The Master's Song' */
  shop: { bpm: 96, prog: [[48, 'M'], [45, 'm'], [41, 'M'], [43, 'M']], bass: 'x...5...x...5...', bv: 0.03, bt: 'triangle', arp: '0.2.1.2.0.2.1.2.', av: 0.009, at: 'sine', ao: 12,
    lead: ['76 . 79 . 84 . 79 . 77 . 76 . 74 - . .', '72 . 74 . 76 . 79 . 76 - . . 72 - . .', '77 . 76 . 74 . 72 . 69 . 72 . 77 - . .', '79 . 77 . 76 . 74 . 71 - . . 74 - . .'], lv: 0.03, lt: 'sine', box: 1 },
  battle: { bpm: 132, prog: [[45, 'm'], [41, 'M'], [43, 'M'], [40, 'm']], bass: 'x.x.o.x.x.x.o.x.', bv: 0.02, bt: 'square', arp: '0.1.2.1.0.1.2.1.', av: 0.006, at: 'square', ao: 24,
    lead: ['76 - . 76 . 72 - . 74 - . 72 . 69 - .', '77 - . 77 . 72 - . 76 - . 72 . 69 - .', '79 - . 79 . 74 - . 77 - . 74 . 71 - .', '76 - . 79 . 83 - . 81 - . 79 . 76 - .'], lv: 0.018, lt: 'triangle',
    k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' },
  /* 后几夜的战斗：放慢、走小调，Neapolitan 降二级和属大三和弦压出紧张感 / battles in the late nights: slower and minor, with a Neapolitan flat-II and a major dominant for tension */
  dread: { bpm: 112, prog: [[45, 'm'], [46, 'M'], [41, 'M'], [40, 'M']], bass: 'x.x.x.x.x.x.x.x.', bv: 0.024, bt: 'triangle', arp: '0...2...1...2...', av: 0.007, at: 'square', ao: 12,
    lead: ['76 - - - - - 74 - 72 - - - 71 - - -', '74 - - - - - 77 - 74 - - - 70 - - -', '72 - - - 69 - - - 72 - - - 76 - - -', '76 - - - - - - - 71 - - - 68 - - -'], lv: 0.018, lt: 'triangle',
    k: 'x.......x.......', s: '........x.......', h: '..x...x...x...x.' },
  boss: { bpm: 144, prog: [[38, 'm'], [46, 'M'], [43, 'm'], [45, 'M']], bass: 'xxo.xxo.xxo.xxo.', bv: 0.017, bt: 'sawtooth', arp: '0.1.2.1.0.1.2.1.', av: 0.006, at: 'square', ao: 24,
    lead: ['74 - - - 77 - - - 81 - - - 80 - 81 -', '82 - - - 81 - - - 77 - - - 74 - - -', '79 - - - 82 - - - 86 - - - 84 - 82 -', '81 - - - 85 - - - 88 - - - 85 - 81 -'], lv: 0.018, lt: 'triangle',
    k: 'x...x...x...x...', s: '....x.......x.x.', h: '..x...x...x...x.' },
  over: { bpm: 58, prog: [[45, 'm'], [50, 'm'], [45, 'm'], [40, 'M']], bass: 'x...............', bv: 0.03, bt: 'triangle', arp: '0...1...2...1...', av: 0.014, at: 'sine', ao: 24 },
};
const SONGS: Record<string, Song> = {};
for (const k in RAW) SONGS[k] = { ...RAW[k], lead: RAW[k].lead?.map((b: string) => b.split(' ')) };

const mid = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
let on = true,
  mood: string | null = null,
  cur: Song | null = null,
  pend: string | null = null,
  swAt = 0,
  step = 0,
  nextT = 0;
let gain: GainNode | null = null,
  nbuf: AudioBuffer | null = null,
  hp: BiquadFilterNode | null = null;

function setup(a: AudioContext) {
  if (gain) return;
  gain = a.createGain();
  gain.gain.value = 0;
  gain.connect(SFX.out() || a.destination);
  const n = (a.sampleRate * 0.3) | 0;
  nbuf = a.createBuffer(1, n, a.sampleRate);
  const d = nbuf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  hp = a.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  hp.connect(gain);
}
function note(a: AudioContext, f: number, t: number, d: number, type: OscillatorType, vol: number, box?: number) {
  const o = a.createOscillator(),
    g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  g.connect(gain!);
  o.start(t);
  o.stop(t + d + 0.05);
  if (box) {
    const o2 = a.createOscillator(),
      g2 = a.createGain();
    o2.type = 'triangle';
    o2.frequency.setValueAtTime(f * 2, t);
    g2.gain.setValueAtTime(vol * 0.25, t);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o2.connect(g2);
    g2.connect(gain!);
    o2.start(t);
    o2.stop(t + 0.25);
  }
}
function nz(a: AudioContext, t: number, d: number, vol: number, dest?: AudioNode) {
  const s = a.createBufferSource(),
    g = a.createGain();
  s.buffer = nbuf;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(g);
  g.connect(dest || gain!);
  s.start(t);
  s.stop(t + d + 0.02);
}
function kick(a: AudioContext, t: number) {
  const o = a.createOscillator(),
    g = a.createGain();
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.08, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g);
  g.connect(gain!);
  o.start(t);
  o.stop(t + 0.2);
}
function playStep(a: AudioContext, S: Song, i: number, t: number) {
  const sd = 15 / S.bpm,
    bar = (i >> 4) % S.prog.length,
    s = i & 15;
  const [r, q] = S.prog[bar];
  const tn = [r, r + (q === 'm' ? 3 : 4), r + 7];
  const b = S.bass[s];
  if (b && b !== '.') note(a, mid(r + (b === '5' ? 7 : b === 'o' ? 12 : 0)), t, sd * 1.7, S.bt, S.bv);
  const c = S.arp && S.arp[s];
  if (c && c !== '.') note(a, mid(tn[+c] + S.ao), t, sd * 2.2, S.at, S.av);
  if (S.lead) {
    const L0 = S.lead[bar],
      v = L0[s];
    if (v !== '.' && v !== '-') {
      let n = 1;
      while (s + n < 16 && L0[s + n] === '-') n++;
      note(a, mid(+v), t, sd * (S.box ? Math.max(n, 3) : n) * 1.1, S.lt!, S.lv!, S.box);
    }
  }
  if (S.k && S.k[s] === 'x') kick(a, t);
  if (S.s && S.s[s] === 'x') {
    nz(a, t, 0.09, 0.035);
    note(a, 190, t, 0.06, 'triangle', 0.02);
  }
  if (S.h && S.h[s] === 'x') nz(a, t, 0.025, 0.02, hp!);
}
function tick() {
  const a = SFX.ctx();
  if (!a || a.state !== 'running' || document.hidden) return;
  setup(a);
  const now = a.currentTime;
  if (pend !== null && now >= swAt) {
    cur = SONGS[pend] || null;
    pend = null;
    step = 0;
    nextT = now + 0.05;
    if (cur && on) {
      gain!.gain.cancelScheduledValues(now);
      gain!.gain.setValueAtTime(0.0001, now);
      gain!.gain.exponentialRampToValueAtTime(0.9, now + 0.8);
    }
  }
  if (!cur || !on) return;
  if (nextT < now - 0.2) nextT = now + 0.05;
  while (nextT < now + 0.15) {
    playStep(a, cur, step, nextT);
    nextT += 15 / cur.bpm;
    step++;
  }
}

export function initMusic() {
  setInterval(tick, 40);
  document.addEventListener('visibilitychange', () => {
    const a = SFX.ctx();
    if (!a || !gain) return;
    if (!document.hidden) nextT = a.currentTime + 0.1;
  });
}

export const MUSIC = {
  set(m: string) {
    if (m === mood) return;
    mood = m;
    const a = SFX.ctx();
    pend = m;
    if (a && gain && cur) {
      const now = a.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      swAt = now + 0.42;
    } else swAt = 0;
  },
  enable(v: boolean) {
    on = v;
    const a = SFX.ctx();
    if (!a || !gain) return;
    const now = a.currentTime;
    gain.gain.cancelScheduledValues(now);
    if (v) {
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.9, now + 0.5);
      nextT = now + 0.05;
    } else gain.gain.setValueAtTime(0, now);
  },
  state: () => ({ mood, on, playing: !!cur, step }),
};
