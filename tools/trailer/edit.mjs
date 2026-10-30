/* 宣传片剪辑：按剪辑表把镜头切成段，叠字幕，配上游戏自己合成的音乐和音效，导出 mp4。
 * 先跑 shots.mjs 录好镜头。用法：node tools/trailer/edit.mjs [--no-audio]
 * 中间产物（字幕图、音轨、分段）都在 .local/trailer/ 下，可以单独复用。
 * Trailer edit: cut shots into segments per the edit list, overlay captions, add the game's own synthesized music and SFX, export mp4.
 * Run shots.mjs first. Usage: node tools/trailer/edit.mjs [--no-audio]. Intermediates (caption images, audio track, segments) stay under .local/trailer/ for reuse.
 */
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { devServer, OUT, FPS, VIEW, DPR } from './lib.mjs';

/* 战斗曲 132 BPM：一拍 0.4545 秒，一小节四拍 / battle track at 132 BPM: one beat is 0.4545s, a bar is four beats */
const BPM = 132;
const BEAT = 60 / BPM;
const SONG = 'battle';

/* 剪辑表：[镜头, 从镜头第几秒开始, 占几拍, 字幕?, 播放倍速?]；字幕在这一段开头出现 / edit list: [shot, start second within the shot, length in beats, caption?, playback speed?]; the caption appears at the start of the segment */
const EDL = [
  ['horde', 0.0, 4],
  ['horde', 1.8, 4, 'hook'],
  ['place', 0.45, 6, 'place', 1.33],
  ['merge', 0.25, 9, 'merge', 1.33],
  ['doors', 0.6, 4, 'doors'],
  ['fire', 0.2, 2, 'chain'],
  ['volt', 0.3, 2],
  ['blade', 0.2, 2],
  ['cracker', 0.3, 2],
  ['fire', 1.6, 2, 'grow'],
  ['volt', 1.8, 2],
  ['cracker', 1.9, 2],
  ['horde', 2.6, 2],
  ['blade', 2.0, 1],
  ['fire', 2.6, 1],
  ['volt', 2.6, 1],
  ['cracker', 2.7, 1],
  ['boss', 0.4, 8, 'nights'],
  ['title', 0.5, 14, 'end'],
];

/* 字幕：大字一行，可带一行小字 / captions: one line of big text, optionally one line of small text */
const CAPS = {
  hook: { big: '守住最后一道城墙', pos: 'top' },
  place: { big: '摆卡上阵', small: '八格棋盘 · 相邻带动', pos: 'top' },
  merge: { big: '同名合成', small: '铜 → 银 → 金 → 钻', pos: 'top' },
  doors: { big: '每夜三条路', small: '商店 · 事件 · 宝箱', pos: 'bottom' },
  chain: { big: '连锁触发', pos: 'top' },
  grow: { big: '越打越强', pos: 'top' },
  nights: { big: '撑过九个长夜', pos: 'bottom' },
  end: { big: '打开网页就能玩', small: '竖屏像素 · 自动战斗构筑', pos: 'end' },
};

const W = Math.round(VIEW.width * DPR), H = Math.round(VIEW.height * DPR);
const ff = (args) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

/** 用游戏的字体把字幕画成透明 PNG / render captions to transparent PNGs in the game's fonts */
async function renderCaps(url) {
  const dir = join(OUT, 'caps');
  mkdirSync(dir, { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: VIEW, deviceScaleFactor: DPR });
  await pg.goto(url);
  await pg.waitForTimeout(800);
  for (const [k, c] of Object.entries(CAPS)) {
    await pg.evaluate((c) => {
      document.body.innerHTML = '';
      document.documentElement.style.background = 'transparent';
      document.body.style.cssText = 'margin:0;background:transparent;width:100vw;height:100vh;position:relative;overflow:hidden';
      const top = { top: '9%', bottom: '70%', end: '62%' }[c.pos];
      const box = document.createElement('div');
      box.style.cssText = `position:absolute;left:0;right:0;top:${top};display:flex;flex-direction:column;align-items:center;gap:10px;font-family:var(--zh)`;
      box.innerHTML =
        `<div style="font-size:${c.pos === 'end' ? 30 : 40}px;line-height:1.1;color:#fff;letter-spacing:2px;text-shadow:0 4px 0 #7a1f1a,0 7px 0 rgba(0,0,0,.55),0 0 18px rgba(0,0,0,.6);background:rgba(15,28,32,.72);padding:8px 18px 12px;border:3px solid #ffd166;box-shadow:0 0 0 3px #0f1c20">${c.big}</div>` +
        (c.small ? `<div style="font-size:18px;color:#ffd166;letter-spacing:1px;text-shadow:0 2px 0 #000,0 0 10px #000;background:rgba(15,28,32,.72);padding:3px 10px">${c.small}</div>` : '');
      document.body.appendChild(box);
    }, c);
    await pg.waitForTimeout(100);
    await pg.screenshot({ path: join(dir, k + '.png'), omitBackground: true });
  }
  await b.close();
}

/** 现场录音：打开游戏，播战斗曲，按剪辑表在对应时间重放各镜头录到的音效，用 MediaRecorder 录下来
 * live audio: open the game, play the battle track, replay each shot's logged SFX at the matching times per the edit list, and record it with MediaRecorder */
async function recordAudio(url, total, cues) {
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await b.newPage({ viewport: VIEW });
  await pg.addInitScript(() => localStorage.setItem('chain-settings', JSON.stringify({ tips: false, stats: false })));
  await pg.goto(url);
  await pg.waitForFunction(() => !!window.__game);
  await pg.mouse.click(10, 10);
  const b64 = await pg.evaluate(
    async ({ total, cues, SONG, BEAT }) => {
      const { SFX } = await import('/src/audio/sfx.ts');
      const { MUSIC } = window.__game;
      SFX.ensure();
      const ac = SFX.ctx();
      await ac.resume();
      const dest = ac.createMediaStreamDestination();
      SFX.out().connect(dest);
      const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
      const chunks = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      MUSIC.set('title');
      await new Promise((r) => setTimeout(r, 1200));
      MUSIC.enable(false);
      rec.start();
      const t0 = performance.now();
      /* 切歌在下一次 tick 生效；等 step 从 0 开始走，记下第一拍的大致时间 / the song switch lands on the next tick; wait for step to start counting and note when beat one landed */
      MUSIC.enable(true);
      MUSIC.set(SONG);
      while (!(MUSIC.state().playing && MUSIC.state().mood === SONG && MUSIC.state().step > 0)) await new Promise((r) => setTimeout(r, 2));
      const lead = performance.now() - t0;
      for (const [t, k, p] of cues) setTimeout(() => SFX.play(k, p), t * 1000);
      await new Promise((r) => setTimeout(r, total * 1000 + 600));
      rec.stop();
      await new Promise((r) => (rec.onstop = r));
      const buf = new Uint8Array(await new Blob(chunks).arrayBuffer());
      let s = '';
      for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
      return JSON.stringify({ lead, data: btoa(s) });
    },
    { total, cues, SONG, BEAT },
  );
  await b.close();
  const { lead, data } = JSON.parse(b64);
  const raw = join(OUT, 'audio-raw.webm');
  writeFileSync(raw, Buffer.from(data, 'base64'));
  /* 去掉开头等歌的那一截；音乐提前 0.05 秒排进时间线，补回去 / trim the wait for the song at the start; the music is scheduled 0.05s ahead, so add that back */
  const cut = Math.max(0, lead / 1000 + 0.05);
  const out = join(OUT, 'audio.wav');
  ff(['-ss', cut.toFixed(3), '-i', raw, '-t', total.toFixed(3), '-af', 'loudnorm=I=-14:TP=-1.5,afade=t=out:st=' + (total - 1.5).toFixed(2) + ':d=1.5', '-ar', '48000', out]);
  return out;
}

async function main() {
  const noAudio = process.argv.includes('--no-audio');
  const srv = await devServer();
  try {
    await renderCaps(srv.url);
    const segDir = join(OUT, 'segs');
    mkdirSync(segDir, { recursive: true });
    const list = [];
    const cues = [];
    let at = 0;
    EDL.forEach(([shot, from, beats, cap, speed = 1], i) => {
      const dur = beats * BEAT;
      /* 倍速播放时，这一段吃掉的镜头长度 / with a playback speed, how much of the shot this segment consumes */
      const src = dur * speed;
      const dir = join(OUT, 'clips', shot);
      if (!existsSync(dir)) throw new Error(`缺镜头 ${shot}，先跑 shots.mjs / missing shot ${shot}, run shots.mjs first`);
      const out = join(segDir, String(i).padStart(2, '0') + '.mp4');
      const inputs = ['-framerate', String(FPS), '-start_number', String(Math.round(from * FPS)), '-i', join(dir, '%05d.png')];
      /* 镜头不够长就停在最后一帧 / if the shot runs out, hold its last frame */
      let vf = `[0:v]scale=${W}:${H}:flags=neighbor,tpad=stop_mode=clone:stop_duration=${src},trim=duration=${src.toFixed(4)},setpts=(PTS-STARTPTS)/${speed}`;
      if (shot === 'title') vf += `,fade=t=in:st=0:d=0.4`;
      /* 首领只露剪影：上方 45% 压暗去色，下沿渐隐 / show the boss only as a silhouette: darken and desaturate the top 45%, fading out at its lower edge */
      if (shot === 'boss') vf += `,split[a][b];[b]crop=iw:ih*0.45:0:0,eq=brightness=-0.5:contrast=0.35:saturation=0,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='255*clip((0.95*H-Y)/(0.35*H),0,1)'[t];[a][t]overlay=0:0`;
      if (cap) {
        inputs.push('-loop', '1', '-i', join(OUT, 'caps', cap + '.png'));
        /* 字幕从下往上弹 0.15 秒 / the caption pops up from below over 0.15s */
        vf += `[bg];[1:v]format=rgba,scale=${W}:${H}[c];[bg][c]overlay=x=0:y='if(lt(t,0.15),(0.15-t)*240,0)':shortest=1`;
      }
      vf += `,format=yuv420p[v]`;
      ff([...inputs, '-filter_complex', vf, '-map', '[v]', '-r', String(FPS), '-t', dur.toFixed(4), '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', out]);
      list.push(`file '${join(process.cwd(), out)}'`);
      const log = JSON.parse(readFileSync(join(dir, 'sfx.json'), 'utf8'));
      for (const [t, k, p] of log) if (t >= from && t < from + src) cues.push([+(at + (t - from) / speed).toFixed(3), k, p]);
      at += dur;
    });
    /* 结尾标版落一声收尾 / one closing sting on the end slate */
    const endAt = EDL.slice(0, -1).reduce((s, e) => s + e[2] * BEAT, 0);
    cues.push([+endAt.toFixed(3), 'win', null]);
    writeFileSync(join(OUT, 'segs.txt'), list.join('\n'));
    const silent = join(OUT, 'trailer-silent.mp4');
    ff(['-f', 'concat', '-safe', '0', '-i', join(OUT, 'segs.txt'), '-c', 'copy', silent]);
    console.log(`画面 ${at.toFixed(2)} 秒，${EDL.length} 段，音效 ${cues.length} 个 / video ${at.toFixed(2)}s, ${EDL.length} segments, ${cues.length} sfx`);
    if (noAudio) return;
    const audio = await recordAudio(srv.url, at, cues);
    const final = join(OUT, 'trailer.mp4');
    ff(['-i', silent, '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', final]);
    console.log('成片 / final:', final);
  } finally {
    srv.stop();
  }
}
await main();
