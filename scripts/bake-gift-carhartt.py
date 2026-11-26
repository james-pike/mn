# Bake the MN logo onto the Carhartt gift photos (sm SKU images + sm placements).
import json,os,sys
from PIL import Image
WRITE='--write' in sys.argv
SM='/home/jvm/sm'; MN2='/home/jvm/mn2'
P=json.load(open(SM+'/src/data/placements.json')); P=P.get('placements',P)
CROPS=json.load(open(SM+'/src/data/crops.json'))
BOLD=Image.open(SM+'/public/logos/modernniagara-bold.png').convert('RGBA')
INV=Image.open(SM+'/public/logos/modernniagara-invert.png').convert('RGBA')
ITEMS=[ # code, placement key, [(src file, out slug)]
 ('K121','K121::wired',[('K121-black.jpg','black'),('K121-carbonheather.jpg','carbon-heather'),('K121-navy.png','navy')]),
 ('102208','102208::modernniagara-service',[('102208-black.png','black'),('102208-navy.png','navy')]),
 ('105751','105751::tamarack',[('105751-black.jpg','black'),('105751-tarmac.jpg','tarmac')]),
 ('104277','104277',[('104277-black.png','black'),('104277-grey.png','grey')]),
 ('106673','106673',[('106673-black.png','black')]),
]
def compose(src,pl,crop,dark=False):
    base=Image.open(src).convert('RGBA'); W,H=base.size; logo=INV if dark else BOLD
    bx,by,bw,bh=pl['x']*W,pl['y']*H,pl['w']*W,pl['h']*H; s=min(bw/logo.width,bh/logo.height)
    lg=logo.resize((max(1,round(logo.width*s)),max(1,round(logo.height*s))),Image.LANCZOS)
    if pl.get('rotation'): lg=lg.rotate(-pl['rotation'],expand=True,resample=Image.BICUBIC)
    base.alpha_composite(lg,(round(bx+(bw-lg.width)/2),round(by+(bh-lg.height)/2)))
    flat=Image.new('RGBA',base.size,(255,255,255,255)); flat.alpha_composite(base); im=flat.convert('RGB')
    if crop: im=im.crop((round(crop['x']*W),round(crop['y']*H),round((crop['x']+crop['w'])*W),round((crop['y']+crop['h'])*H)))
    im.thumbnail((880,1100)); return im
tiles=[]
for code,key,cols in ITEMS:
    pl=P[key]
    for f,slug in cols:
        im=compose(SM+'/public/skus/'+f,pl,CROPS.get('/skus/'+f))
        if WRITE:
            d=f'{MN2}/public/gift/{code}'; os.makedirs(d,exist_ok=True)
            im.save(f'{d}/{slug}-front.webp','WEBP',quality=95,method=6); print('wrote',f'{d}/{slug}-front.webp',im.size)
        t=im.copy(); t.thumbnail((300,360)); tiles.append(t)
if not WRITE:
    sh=Image.new('RGB',(len(tiles)*300,360),'white')
    for i,t in enumerate(tiles): sh.paste(t,(i*300,0))
    sh.save('preview.jpg'); print('preview', len(tiles))
