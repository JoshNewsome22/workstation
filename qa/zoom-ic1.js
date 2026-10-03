const fs=require('fs'),path=require('path');const {PNG}=require('pngjs');
const base=__dirname+'/out/formshots';
const out=path.join(base,'zoom');fs.mkdirSync(out,{recursive:true});
const crops={
 'IC-1-d1-consent-top.png':[['hdr',[540,555,1260,775]]],
 'IC-1-d4-consent-record-mid.png':[['dates',[190,205,720,500]],['exp',[190,785,1250,900]]],
 'IC-1-d2-specific-procedures-low.png':[['storage',[400,250,1230,335]],['release',[400,735,1230,845]]],
 'IC-1-d3-student-assent-mid.png':[['sel',[190,80,1250,320]]],
};
for(const [f,regs] of Object.entries(crops)){
 for(const which of ['after','before']){
  const p=path.join(base,which,f); if(!fs.existsSync(p)){console.log('missing',p);continue;}
  const im=PNG.sync.read(fs.readFileSync(p));
  for(const [name,[x0,y0,x1,y1]] of regs){
   const S=2,w=(x1-x0)*S,h=(y1-y0)*S; const o=new PNG({width:w,height:h});
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const sx=x0+Math.floor(x/S),sy=y0+Math.floor(y/S);const si=(sy*im.width+sx)*4,di=(y*w+x)*4;o.data[di]=im.data[si];o.data[di+1]=im.data[si+1];o.data[di+2]=im.data[si+2];o.data[di+3]=255;}
   const op=path.join(out,`${which}-${f.slice(0,-4)}-${name}.png`);fs.writeFileSync(op,PNG.sync.write(o));console.log(op);
  }
 }
}
