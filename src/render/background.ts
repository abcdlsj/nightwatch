/* 背景着色器：缓慢旋转的漩涡，按场景换色（标题 / 备战 / 战斗 / 首领 / 结局） */
import { RM } from '../platform/env';
import { $ } from '../ui/dom';

type Pal = number[][];
const PALS: Record<string, Pal> = {
  title: [[0.78, 0.22, 0.2], [0.05, 0.38, 0.62], [0.05, 0.08, 0.1]],
  shop: [[0.12, 0.5, 0.38], [0.85, 0.6, 0.2], [0.03, 0.1, 0.09]],
  battle: [[0.4, 0.15, 0.4], [0.12, 0.32, 0.58], [0.04, 0.03, 0.08]],
  boss: [[0.78, 0.12, 0.14], [0.32, 0.04, 0.2], [0.05, 0.01, 0.03]],
  over: [[0.3, 0.3, 0.36], [0.5, 0.14, 0.14], [0.05, 0.05, 0.07]],
};
export type Scene = keyof typeof PALS;

const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS = `precision mediump float;uniform vec2 R;uniform float T;uniform vec3 A;uniform vec3 B;uniform vec3 C;
void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/min(R.x,R.y);float r=length(uv);float a=atan(uv.y,uv.x);
a+=T*.07+(1.7-r)*1.9;vec2 p=vec2(cos(a),sin(a))*r*3.2;
for(int i=0;i<4;i++){float f=float(i);p+=.6*vec2(sin(p.y*1.2+T*.33+f),cos(p.x*1.1-T*.26-f));}
float v=.5+.5*sin(p.x*.9+p.y*.7);float w=.5+.5*sin(length(p)*1.4-T*.4);
vec3 col=mix(C,A,smoothstep(.15,.85,v));col=mix(col,B,smoothstep(.45,1.,w)*.7);
col*=.72+.3*(1.-r*.7);gl_FragColor=vec4(col,1.);}`;

let setPal: (n: Scene) => void = () => {};
const listeners: ((n: Scene) => void)[] = [];

export function initBackground() {
  const cv = $('#bg') as HTMLCanvasElement;
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = cv.getContext('webgl', { antialias: false });
  } catch {
    gl = null;
  }
  if (!gl) {
    cv.style.background = 'radial-gradient(circle at 50% 40%,#2a4a4a,#0f1c20)';
    return;
  }
  const g = gl;
  const sh = (t: number, s: string) => {
    const o = g.createShader(t)!;
    g.shaderSource(o, s);
    g.compileShader(o);
    return o;
  };
  const pr = g.createProgram()!;
  g.attachShader(pr, sh(g.VERTEX_SHADER, VS));
  g.attachShader(pr, sh(g.FRAGMENT_SHADER, FS));
  g.linkProgram(pr);
  if (!g.getProgramParameter(pr, g.LINK_STATUS)) {
    cv.style.background = '#16282c';
    return;
  }
  g.useProgram(pr);
  const buf = g.createBuffer();
  g.bindBuffer(g.ARRAY_BUFFER, buf);
  g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
  const loc = g.getAttribLocation(pr, 'p');
  g.enableVertexAttribArray(loc);
  g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
  const U = { R: g.getUniformLocation(pr, 'R'), T: g.getUniformLocation(pr, 'T'), A: g.getUniformLocation(pr, 'A'), B: g.getUniformLocation(pr, 'B'), C: g.getUniformLocation(pr, 'C') };
  /* 画布只有屏幕的 1/5 大，CSS 拉伸；本来就是糊的漩涡，省电 */
  const size = () => {
    cv.width = Math.max(40, Math.ceil(innerWidth / 5));
    cv.height = Math.max(40, Math.ceil(innerHeight / 5));
    g.viewport(0, 0, cv.width, cv.height);
  };
  size();
  addEventListener('resize', size);
  const cur = PALS.title.map((a) => a.slice());
  let tgt = PALS.title;
  const t0 = performance.now();
  const frame = (now: number) => {
    const t = ((now - t0) / 1000) * (RM ? 0.12 : 1);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur[i][j] += (tgt[i][j] - cur[i][j]) * 0.03;
    g.uniform2f(U.R, cv.width, cv.height);
    g.uniform1f(U.T, t);
    g.uniform3fv(U.A, cur[0]);
    g.uniform3fv(U.B, cur[1]);
    g.uniform3fv(U.C, cur[2]);
    g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  setPal = (n) => {
    if (PALS[n]) tgt = PALS[n];
  };
}

/** 换场景：背景换色，背景音乐跟着换曲 */
export function setScene(n: Scene) {
  setPal(n);
  for (const f of listeners) f(n);
}
export const onScene = (f: (n: Scene) => void) => listeners.push(f);
