"""字体子集化：只保留游戏里用到的字，生成 public/fonts/*.woff2，并记下收录的字到 tools/font-chars.txt。
改了文案、出现新汉字后跑一次：npm run fonts（屏幕上的字都在 src/locales、mods 和 index.html 里）
需要 fonttools 和 brotli（pip install fonttools brotli）。源字体来自 google/fonts 和 npm 上的 @fontsource/fusion-pixel-12px-proportional-sc（都是 OFL 授权），不存在时自动下载到 tools/.fontsrc/。"""
import os, re, subprocess, urllib.request
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..')
SRC=os.path.join(ROOT,'tools','.fontsrc'); OUT=os.path.join(ROOT,'public','fonts')
RAW='https://raw.githubusercontent.com/google/fonts/main/ofl/'
FONTS={  # 输出名: (源路径, 收录范围)
  'zcool.woff2':('zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf','all'),
  'pixelify.woff2':('pixelifysans/PixelifySans%5Bwght%5D.ttf','latin'),
  'silkscreen-bold.woff2':('silkscreen/Silkscreen-Bold.ttf','latin'),
  'fusion.woff2':('npm:@fontsource/fusion-pixel-12px-proportional-sc@5.3.0:files/fusion-pixel-12px-proportional-sc-latin-400-normal.woff2','all'),
}
def fetch(path,dst):
  if not path.startswith('npm:'): return urllib.request.urlretrieve(RAW+path,dst)
  import json, tarfile, io
  _,pkg,inner=path.split(':');name,ver=pkg.rsplit('@',1)
  meta=json.load(urllib.request.urlopen('https://registry.npmjs.org/%s/%s'%(name,ver)))
  tf=tarfile.open(fileobj=io.BytesIO(urllib.request.urlopen(meta['dist']['tarball']).read()))
  open(dst,'wb').write(tf.extractfile('package/'+inner).read())
def game_chars():
  s=set(open(os.path.join(ROOT,'index.html'),encoding='utf-8').read())
  for top in (('src','locales'),('mods',)):
    for d,_,fs in os.walk(os.path.join(ROOT,*top)):
      for f in fs:
        if f.endswith('.ts'): s|=set(re.sub(r'/\*[\s\S]*?\*/','',open(os.path.join(d,f),encoding='utf-8').read()))
  return ''.join(sorted(c for c in s if ord(c)>0x7f))
def main():
  os.makedirs(SRC,exist_ok=True); os.makedirs(OUT,exist_ok=True)
  cjk=game_chars(); latin=''.join(chr(i) for i in range(0x20,0x7f))
  for out,(path,rng) in FONTS.items():
    src=os.path.join(SRC,os.path.basename(path).replace('%5B','[').replace('%5D',']'))
    if not os.path.exists(src): fetch(path,src)
    text=latin+(cjk if rng=='all' else '·×→←—…')
    subprocess.run(['pyftsubset',src,'--text='+text,'--flavor=woff2','--layout-features=*','--output-file='+os.path.join(OUT,out)],check=True)
    print(out,os.path.getsize(os.path.join(OUT,out)),'bytes')
  open(os.path.join(ROOT,'tools','font-chars.txt'),'w',encoding='utf-8').write(cjk)
  print('收录',len(cjk),'个非 ASCII 字符')
main()
