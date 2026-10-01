/* 音效：全部用 WebAudio 现场合成，不带音频文件 */
import { isIOS } from '../platform/env';

let ac: AudioContext | null = null;
let out: GainNode | null = null;
let muted = false;
let unlocked = false;
let sil: HTMLAudioElement | null = null;
let mbI = 0;
const last: Record<string, number> = {};
/** 八音盒那首「师父的曲子」，每次触发放下一个音 */
const MB = [76, 79, 84, 79, 77, 76, 74, 72, 74, 76, 79, 76, 72, 74, 71, 72];

/** 一段静音 wav：iOS 开了静音开关时，靠它把音频会话切到「播放」 */
function silentWav() {
  const n = 4000,
    b = new Uint8Array(44 + n),
    v = new DataView(b.buffer),
    w = (o: number, s: string) => {
      for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i);
    };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  b.fill(128, 44);
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return 'data:audio/wav;base64,' + btoa(s);
}

/** 手机上要在点按里解锁：iOS 还得先切到「播放」音频会话，不然手机开了静音就全没声 */
export function ensure() {
  try {
    const as = (navigator as any).audioSession;
    if (as && as.type !== 'playback') as.type = 'playback';
  } catch {
    /* 不支持 audioSession 的浏览器 */
  }
  if (!ac) {
    try {
      ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      ac = null;
    }
    if (ac) {
      const c = ac.createDynamicsCompressor();
      c.threshold.value = -12;
      c.ratio.value = 6;
      c.connect(ac.destination);
      out = ac.createGain();
      out.gain.value = 2.2;
      out.connect(c);
    }
  }
  if (!ac) return;
  if (ac.state !== 'running') ac.resume().catch(() => {});
  if (!unlocked) {
    unlocked = true;
    try {
      const b = ac.createBuffer(1, 1, 22050),
        s = ac.createBufferSource();
      s.buffer = b;
      s.connect(ac.destination);
      s.start(0);
    } catch {
      /* 忽略 */
    }
    if (!sil && isIOS()) {
      try {
        sil = new Audio(silentWav());
        sil.loop = true;
        sil.setAttribute('playsinline', '');
        sil.play()?.catch(() => {
          sil = null;
        });
      } catch {
        sil = null;
      }
    }
  }
}

export function initSfx() {
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) document.addEventListener(ev, ensure, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ac && ac.state !== 'running') ac.resume().catch(() => {});
  });
}

function tone(f: number, d: number, type?: OscillatorType, vol?: number, slide?: number, delay?: number) {
  if (!ac || muted) return;
  const t = ac.currentTime + (delay || 0);
  const o = ac.createOscillator(),
    g = ac.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(vol || 0.04, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g);
  g.connect(out!);
  o.start(t);
  o.stop(t + d + 0.03);
}
function noise(d: number, vol: number) {
  if (!ac || muted) return;
  const n = Math.floor(ac.sampleRate * d);
  const b = ac.createBuffer(1, n, ac.sampleRate);
  const a = b.getChannelData(0);
  for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = ac.createBufferSource();
  s.buffer = b;
  const g = ac.createGain();
  g.gain.value = vol;
  s.connect(g);
  g.connect(out!);
  s.start();
}

/** 卡牌出手音按元素区分音高 */
const TP: Record<string, number> = { blade: 520, fire: 300, volt: 660, ice: 780, mech: 220, poison: 440 };

export function play(k: string, p?: string | number) {
  if (!ac || muted) return;
  const now = performance.now();
  const lk = k === 'echo' ? k + p : k;
  if (last[lk] && now - last[lk] < (k === 'hit' ? 60 : 40)) return;
  last[lk] = now;
  switch (k) {
    case 'fire': tone(TP[p as string] || 400, 0.05, 'square', 0.018, 1.4); break;
    case 'hit': tone(140, 0.05, 'square', 0.015, 0.6); break;
    case 'crit': tone(990, 0.09, 'square', 0.035, 0.5); tone(1480, 0.06, 'triangle', 0.03, 1, 0.03); break;
    case 'kill': tone(260, 0.09, 'triangle', 0.03, 0.35); break;
    case 'coin': tone(988, 0.05, 'square', 0.03); tone(1319, 0.1, 'square', 0.03, 1, 0.05); break;
    case 'echo': tone(392 * Math.pow(1.122, Math.min(p as number, 12)), 0.09, 'triangle', 0.045, 1.25); break;
    case 'pick': tone(500, 0.04, 'square', 0.025, 1.6); break;
    case 'place': tone(300, 0.06, 'square', 0.035, 0.7); break;
    case 'buy': tone(660, 0.05, 'square', 0.03); tone(990, 0.08, 'square', 0.03, 1, 0.05); break;
    case 'sell': tone(880, 0.05, 'square', 0.03); tone(587, 0.09, 'square', 0.03, 1, 0.05); break;
    case 'merge': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, 'square', 0.035, 1, i * 0.06)); break;
    case 'hurt': noise(0.18, 0.12); tone(90, 0.2, 'sawtooth', 0.05, 0.5); break;
    case 'boom': noise(0.25, 0.1); tone(70, 0.25, 'square', 0.05, 0.4); break;
    case 'bell': tone(523, 0.6, 'triangle', 0.05); tone(784, 0.5, 'triangle', 0.03, 1, 0.02); break;
    case 'intent': tone(180, 0.25, 'sawtooth', 0.04, 1.8); break;
    case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.14, 'square', 0.035, 1, i * 0.08)); break;
    case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'triangle', 0.05, 1, i * 0.16)); break;
    case 'ui': tone(700, 0.03, 'square', 0.02); break;
    case 'bad': tone(160, 0.12, 'square', 0.04, 0.8); break;
    case 'mbox': {
      const f = 440 * Math.pow(2, (MB[mbI++ % MB.length] - 69) / 12);
      tone(f, 0.7, 'sine', 0.05);
      tone(f * 2, 0.25, 'triangle', 0.012, 1, 0.005);
      break;
    }
    case 'drum': tone(110, 0.18, 'sine', 0.09, 0.45); noise(0.05, 0.05); break;
    case 'hint': tone(880, 0.08, 'triangle', 0.03); tone(1175, 0.14, 'triangle', 0.03, 1, 0.07); break;
  }
}

export const SFX = {
  ensure,
  play,
  ctx: () => ac,
  out: () => out,
  setMuted(m: boolean) {
    muted = m;
  },
};
