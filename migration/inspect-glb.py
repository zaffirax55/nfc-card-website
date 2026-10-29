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
