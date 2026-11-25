# Bake the MN logo from the sm SKU manager onto the Milestone Awards (gift) default-colour images.
# Uses sm placements.json / dark-logo.json / crops.json; writes public/gift/<code>/... (webp q95).
# Usage: python3 scripts/bake-gift-logos.py [--write]   (dry run renders preview.jpg)
import json,re,os,sys,shutil
from PIL import Image
WRITE='--write' in sys.argv
SM='/home/jvm/sm'; MN2='/home/jvm/mn2'
P=json.load(open(SM+'/src/data/placements.json')); P=P.get('placements',P)
DARK=json.load(open(SM+'/src/data/dark-logo.json')); CROPS=json.load(open(SM+'/src/data/crops.json'))
GB=json.load(open(SM+'/src/data/gift-blanks.json'))
BOLD=Image.open(SM+'/public/logos/modernniagara-bold.png').convert('RGBA'); INV=Image.open(SM+'/public/logos/modernniagara-invert.png').convert('RGBA')
bs=open(SM+'/src/data/brand-skus.generated.ts').read()
codeof=dict(re.findall(r'"sku": "(MN-\d+)",\s*"name": "[^"]*",\s*"category": "[^"]*",\s*"code": "([^"]+)"',bs))
pts=open(MN2+'/src/routes/apparel/products.ts').read()
prods={}
for m in re.finditer(r'"sku": "(MN-\d+)".*?"colors": \[(.*?)\].*?"imgs": \[(.*?)\].*?"portals": \[([^\]]*)\]',pts,re.S):
    if '"gift"' in m.group(4): prods[m.group(1)]=(re.findall(r'"(#[0-9a-f]{6})"',m.group(2)),re.findall(r'"([^"]+)"',m.group(3)))
letters=lambda s: re.sub(r'[^a-z]','',s.lower())
# auto guesses, to see what the user changed
auto={}
for f in ['/tmp/claude-1000/-home-jvm-mn2/ae955e94-4545-4fa3-aa34-48039e4ed357/scratchpad/new/place/placements_auto.json']:
    for k,p in json.load(open(f)).items():
        code,slug,img=k.split('|'); auto[img.split('/')[-1].rsplit('-',1)[0]+'::chest::'+slug]=p
for k,p in json.load(open('/tmp/claude-1000/-home-jvm-mn2/ae955e94-4545-4fa3-aa34-48039e4ed357/scratchpad/new/place/model_place.json')).items(): auto[k]=p
tasks=[];edited=[];missing=[]
for sku,(cols,imgs) in prods.items():
    G=codeof[sku]; gb=GB[G.lower()]
    for h in cols[:1]:  # default colour only
        blank=gb.get(h)
        if not blank: missing.append((sku,h,'no blank')); continue
        slug=blank.split('/')[-1].rsplit('-',1)[1].rsplit('.',1)[0]
        key=f'{G}::chest::{slug}'; pl=P.get(key)
        if not pl: missing.append((sku,slug,'no placement')); continue
        if key in auto and any(abs(pl[f]-auto[key][f])>1e-6 for f in 'xywh'): edited.append(key)
        # mn2 target: image of this colour that is the SM main view
        cand=[p for p in imgs if letters(p.split('/')[-1].rsplit('-',1)[0])==slug]
        is_model=any(p.endswith('-model.webp') for p in cand) and os.path.getsize(SM+'/public'+blank)>0 and Image.open(SM+'/public'+blank).size==(833,1250)
        out=next((p for p in cand if p.endswith('-model.webp')),None) if is_model else next((p for p in cand if p.endswith('-front.webp')),None)
        if not out: missing.append((sku,slug,'no mn2 image')); continue
        dark=bool(DARK.get(f'{G.lower()}::{slug}'))
        tasks.append(dict(sku=sku,G=G,slug=slug,src=SM+'/public'+blank,out=MN2+'/public'+out,pl=pl,dark=dark,crop=CROPS.get(blank)))
def compose(t):
    base=Image.open(t['src']).convert('RGBA'); W,H=base.size; pl=t['pl']; logo=INV if t['dark'] else BOLD
    bx,by,bw,bh=pl['x']*W,pl['y']*H,pl['w']*W,pl['h']*H; s=min(bw/logo.width,bh/logo.height)
    lg=logo.resize((max(1,round(logo.width*s)),max(1,round(logo.height*s))),Image.LANCZOS)
    if pl.get('rotation'): lg=lg.rotate(-pl['rotation'],expand=True,resample=Image.BICUBIC)
    base.alpha_composite(lg,(round(bx+(bw-lg.width)/2),round(by+(bh-lg.height)/2)))
    flat=Image.new('RGBA',base.size,(255,255,255,255)); flat.alpha_composite(base); im=flat.convert('RGB')
    c=t['crop']
    if c: im=im.crop((round(c['x']*W),round(c['y']*H),round((c['x']+c['w'])*W),round((c['y']+c['h'])*H)))
    im.thumbnail((880,1100)); return im
print(len(tasks),'images | user-edited placements:',len(edited),'| missing:',missing)
print('edited:',edited)
if WRITE:
    bk='/tmp/claude-1000/-home-jvm-mn2/ae955e94-4545-4fa3-aa34-48039e4ed357/scratchpad/bake/backup'
    for t in tasks:
        d=bk+t['out'].replace(MN2,''); os.makedirs(os.path.dirname(d),exist_ok=True)
        if not os.path.exists(d): shutil.copy2(t['out'],d)
        compose(t).save(t['out'],'WEBP',quality=95,method=6)
    print('wrote',len(tasks))
else:
    tiles=[]
    for t in tasks:
        im=compose(t); im.thumbnail((300,360)); tiles.append(im)
    cols=8; tw,th=300,360; sh=Image.new('RGB',(cols*tw,((len(tiles)+cols-1)//cols)*th),'white')
    for i,im in enumerate(tiles): sh.paste(im,((i%cols)*tw,(i//cols)*th))
    sh.save('preview.jpg')
    json.dump([{k:v for k,v in t.items() if k!='pl'} for t in tasks],open('tasks.json','w'),indent=1)
