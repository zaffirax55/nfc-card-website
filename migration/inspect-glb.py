import json,struct,os
from pathlib import Path
for p in sorted(Path('src/v36_2/assets/models').glob('*.glb')):
 data=p.read_bytes()
 magic,version,length=struct.unpack_from('<III',data,0)
 offset=12
 chunks=[]
 while offset<len(data):
  size,typ=struct.unpack_from('<I4s',data,offset);offset+=8
  payload=data[offset:offset+size];offset+=size
  if typ==b'JSON': doc=json.loads(payload)
 imgs=doc.get('images',[])
 mats=doc.get('materials',[])
 meshes=doc.get('meshes',[])
 print(p.name,'bytes',len(data),'images',len(imgs),'materials',len(mats),'meshes',len(meshes),'names',[m.get('name') for m in mats[:6]])
 print(' image',[(i.get('mimeType'),i.get('name')) for i in imgs[:6]])
 print(' material samples',[(m.get('pbrMetallicRoughness',{}).get('baseColorFactor'),m.get('pbrMetallicRoughness',{}).get('baseColorTexture')) for m in mats[:4]])

# source inspection

from io import BytesIO
from PIL import Image, ImageStat
for name in ['review-standard','beauty','instagram','review-acrylic']:
 p=Path('src/v36_2/assets/models')/(name+'.glb');data=p.read_bytes()
 offset=12;chunks={}
 while offset<len(data):
  size,typ=struct.unpack_from('<I4s',data,offset);offset+=8;chunks[typ]=data[offset:offset+size];offset+=size
 doc=json.loads(chunks[b'JSON'])
 print('MODEL',name,'nodes',[(n.get('name'),n.get('rotation'),n.get('translation')) for n in doc.get('nodes',[])[:8]])
 for i,mesh in enumerate(doc.get('meshes',[])[:4]):
  print('MESH',i,mesh.get('name'),[(q.get('material'),q.get('attributes'),q.get('mode')) for q in mesh.get('primitives',[])])
 for i,meta in enumerate(doc.get('images',[])):
  bv=doc['bufferViews'][meta['bufferView']]
  start=bv.get('byteOffset',0); im=Image.open(BytesIO(chunks[b'BIN\x00'][start:start+bv['byteLength']])).convert('RGB')
  st=ImageStat.Stat(im)
  print('TEXTURE',i,im.size,'mean',tuple(round(v) for v in st.mean),'center',im.getpixel((im.width//2,im.height//2)),'corner',im.getpixel((4,4)))

# rerun with Pillow
