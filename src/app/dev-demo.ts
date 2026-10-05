/* 布局演示（只在 VITE_LAYOUT_DEMO=1 构建时打进包）：原生壳里自动翻过各个界面，
 * 每屏停 3 秒，配合 xcrun simctl io screenshot 检查真机 WebView 的布局
 * layout demo (bundled only when built with VITE_LAYOUT_DEMO=1): on native it cycles through every screen, pausing 3s each, to check the real-device WebView layout alongside xcrun simctl io screenshot
 */
const $ = (s: string) => document.querySelector(s) as HTMLElement | null;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const skip = async () => {
  for (let i = 0; i < 10 && $('#stSkip'); i++) {
    $('#stSkip')!.click();
    await wait(200);
  }
};

export async function runDemo() {
  const g = (window as any).__game;
  const step = async (f: () => unknown) => {
    f();
    await wait(3000);
  };
  await wait(3000); // 标题
  // title
  await step(() => $('#startBtn')!.click()); // 选人
  // hero select
  await step(() => ($('.hero:nth-child(3)') || $('.hero'))!.click()); // 起手
  // opening
  await step(() => ($('.kit') as HTMLElement).click()); // 开场剧情
  // opening story
  await skip();
  await wait(3000); // 夜谈
  // night talk
  await step(() => {
    g.G.prep.talkDone = true;
    g.G.prep.cur = null;
    g.enterEvent('shop');
  });
  await step(() => {
    g.finishStep();
    g.finishStep();
    g.finishStep();
  }); // 准备好了
  // ready
  await step(() => ($('#board .card') as HTMLElement).dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); // 卡牌详情（下一步抬手）
  // card details (pointer-up next)
  await step(() => {
    g.closeSheet();
    g.G.round = 9;
    g.G.nextWave = g.makeWave(9);
    $('#goBtn')!.click();
  }); // 首领战
  // boss fight
  await step(() => g.unlockTest('dawn')); // 成就弹窗
  // achievement popup
  await step(() => {
    g.G.phase = 'over';
    g.B.over = true;
    g.endScreen(true);
  }); // 结局
  // ending
  await step(() => {
    g.titleScreen();
    $('#cdxBtn')!.click();
  }); // 图鉴
  // codex
}
