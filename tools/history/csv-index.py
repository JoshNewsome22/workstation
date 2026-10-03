#!/usr/bin/env python3
"""v21.36 shell: the case as a spreadsheet (one workbook, a sheet per open form)."""
import sys
path = sys.argv[1]; s = open(path, encoding='utf-8').read()
if 'function exportCaseXlsx' in s: print('already'); sys.exit(0)
def rep(old, new):
    global s
    assert s.count(old) == 1, (old[:70], s.count(old)); s = s.replace(old, new)
rep("const REPLY={snapshot:'snapshot',restore:'restored',collect:'payload','facts?':'facts-out',facts:'facts-applied'};",
    "const REPLY={snapshot:'snapshot',restore:'restored',collect:'payload','facts?':'facts-out',facts:'facts-applied','csv?':'csv-out'};")
rep("  } else if(d.nbh==='payload'||d.nbh==='snapshot'||d.nbh==='restored'||d.nbh==='facts-out'||d.nbh==='facts-applied'){",
    "  } else if(d.nbh==='payload'||d.nbh==='snapshot'||d.nbh==='restored'||d.nbh==='facts-out'||d.nbh==='facts-applied'||d.nbh==='csv-out'){")
rep("""    <button id="openCase">Open case</button></span>""",
    """    <button id="openCase">Open case</button>
    <button id="caseXlsx" title="Every open form into one spreadsheet: a sheet per form, from its own CSV export where it has one, else every field by name">Case as spreadsheet</button></span>""")
rep("  {k:'open case',n:'Open case',s:'command',go:()=>$('#openCase').click()},",
    "  {k:'open case',n:'Open case',s:'command',go:()=>$('#openCase').click()},\n  {k:'spreadsheet excel numbers xlsx csv export the case as data workbook',n:'Case as spreadsheet (.xlsx)',s:'command',go:()=>$('#caseXlsx').click()},")
rep("""     '<p><b>Copy for the BIP</b> on FS-1, TD-1, GB-1 and CR-1 puts the plan’s text on the clipboard for the district document; <b>Save graph as image</b> under a graph gives a picture for a report.</p>')+""",
    """     '<p><b>Copy for the BIP</b> on FS-1, TD-1, GB-1 and CR-1 puts the plan’s text on the clipboard for the district document; <b>Save graph as image</b> under a graph gives a picture for a report.</p>'+
     '<p><b>Case as spreadsheet</b> writes every open form into one workbook (.xlsx, which Excel and Numbers open): a sheet per form, taken from the form’s own CSV export where it has one and otherwise every field by name, with a Case sheet naming the student and the forms.</p>')+""")
CODE = r"""/* ================= the case as a spreadsheet (v21.36) =================
   One workbook for a district data request or a research file: a Case sheet (the student, the date, the forms),
   then a sheet per open form, in packet order. A form that has its own CSV export answers the csv? verb with
   that file's text (the bridge presses the button and catches the file instead of saving it); any other form
   gives its snapshot, written as every field by name. The .xlsx is written here: a stored zip of the
   SpreadsheetML parts, inline strings, numbers as numbers, no library. */
const CRC_T=(()=>{const t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c;}return t;})();
function crc32(u){let c=-1;for(let i=0;i<u.length;i++)c=CRC_T[(c^u[i])&255]^(c>>>8);return (c^-1)>>>0;}
function zipStore(files){
  const enc=new TextEncoder(),parts=[],cd=[];let off=0;
  const d=new Date(),dosT=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),dosD=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  const le=(n,b)=>{const a=new Uint8Array(b);for(let i=0;i<b;i++)a[i]=(n>>>(8*i))&255;return a;};
  for(const f of files){
    const name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data);
    const head=[le(0x04034b50,4),le(20,2),le(0,2),le(0,2),le(dosT,2),le(dosD,2),le(crc,4),le(data.length,4),le(data.length,4),le(name.length,2),le(0,2),name];
    cd.push([le(0x02014b50,4),le(20,2),le(20,2),le(0,2),le(0,2),le(dosT,2),le(dosD,2),le(crc,4),le(data.length,4),le(data.length,4),le(name.length,2),le(0,2),le(0,2),le(0,2),le(0,2),le(0,4),le(off,4),name]);
    head.forEach(h=>parts.push(h));parts.push(data);off+=head.reduce((a,h)=>a+h.length,0)+data.length;
  }
  const cdStart=off;let cdLen=0;cd.forEach(e=>e.forEach(h=>{parts.push(h);cdLen+=h.length;}));
  [le(0x06054b50,4),le(0,2),le(0,2),le(files.length,2),le(files.length,2),le(cdLen,4),le(cdStart,4),le(0,2)].forEach(h=>parts.push(h));
  const out=new Uint8Array(parts.reduce((a,p)=>a+p.length,0));let k=0;parts.forEach(p=>{out.set(p,k);k+=p.length;});return out;
}
function xlsxBytes(sheets){
  const X=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'');
  const colName=n=>{let t='';n++;while(n){const r=(n-1)%26;t=String.fromCharCode(65+r)+t;n=Math.floor((n-1)/26);}return t;};
  const isNum=v=>typeof v==='number'||(/^-?\d+(\.\d+)?$/.test(String(v).trim())&&String(v).trim().length<16&&!/^-?0\d/.test(String(v).trim()));
  const sheetXml=rows=>{
    const w=[];rows.forEach(r=>r.forEach((v,j)=>{w[j]=Math.max(w[j]||0,Math.min(60,String(v==null?'':v).length));}));
    const cols=w.length?'<cols>'+w.map((x,j)=>'<col min="'+(j+1)+'" max="'+(j+1)+'" width="'+Math.max(8,x+2)+'" customWidth="1"/>').join('')+'</cols>':'';
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'+cols+'<sheetData>'+
      rows.map((r,i)=>'<row r="'+(i+1)+'">'+r.map((v,j)=>{if(v==null||v==='')return '';const ref=colName(j)+(i+1);
        return isNum(v)?'<c r="'+ref+'"><v>'+Number(v)+'</v></c>':'<c r="'+ref+'" t="inlineStr"><is><t xml:space="preserve">'+X(v)+'</t></is></c>';}).join('')+'</row>').join('')+'</sheetData></worksheet>';
  };
  const files=[];
  files.push({name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+sheets.map((_,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'});
  files.push({name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'});
  files.push({name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((sh,i)=>'<sheet name="'+X(sh.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'});
  files.push({name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((_,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'</Relationships>'});
  sheets.forEach((sh,i)=>files.push({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:sheetXml(sh.rows)}));
  return zipStore(files);
}
function parseCsv(text){
  const rows=[];let row=[],cell='',q=false;const t=String(text||'');
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'){if(t[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=c;continue;}
    if(c==='"')q=true;else if(c===','){row.push(cell);cell='';}else if(c==='\n'||c==='\r'){if(c==='\r'&&t[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}else cell+=c;}
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  return rows.filter(r=>r.some(v=>v!==''));
}
function flattenSnap(snap){
  const rows=[['Field','Value']];const walk=(v,path)=>{if(v===null||v===undefined)return;
    if(Array.isArray(v)){v.forEach((x,i)=>walk(x,path+'['+(i+1)+']'));return;}
    if(typeof v==='object'){Object.keys(v).forEach(k=>walk(v[k],path?path+'.'+k:k));return;}
    if(v===''||v===false)return;rows.push([path,v===true?'yes':v]);};
  walk(snap&&snap.data!==undefined?snap.data:snap,'');return rows;
}
async function exportCaseXlsx(opt){
  opt=opt||{};
  const order=FORMS.flatMap(([st,items])=>items.map(([id])=>id)).filter(id=>state.frames[id]);
  if(!order.length){wsUI.alert('Open the forms you want in the spreadsheet first.\nEach open form becomes a sheet of the workbook.');return null;}
  const p=packet(),used=new Set(),sheets=[],index=[['Form','Title','Sheet','Taken from','Fields filled']];
  const sheetName=(id,suffix)=>{let n=(id+(suffix?' '+suffix:'')).replace(/[\[\]:*?\/\\]/g,'-').slice(0,31);let k=2;while(used.has(n)){n=n.slice(0,28)+' '+(k++);}used.add(n);return n;};
  const titleOf=id=>{for(const [st,items] of FORMS)for(const [i,name] of items)if(i===id)return name;return id;};
  for(const id of order){
    const r=await grab(id,'csv?',null,4000);let rows=null,src='';
    if(r&&r.csv){rows=parseCsv(r.csv);src="the form's CSV export";}
    if(!rows||rows.length<2){const sn=await grab(id,'snapshot',null,8000);if(sn&&sn.snap){rows=flattenSnap(sn.snap);src='every field by name';}}
    if(!rows||rows.length<2)continue;
    const nm=sheetName(id,src==='every field by name'?'fields':'');sheets.push({name:nm,rows});
    index.push([id,titleOf(id),nm,src,String((state.status[id]||{}).filled||'')]);
  }
  if(!sheets.length){wsUI.alert('None of the open forms holds anything to write yet.');return null;}
  const stamp=new Date();
  const cover=[['FBA and BIP Workstation: the case as a spreadsheet'],[],['Student',p.client||''],['Student ID',p.sid||''],['Grade',p.grade||''],['School',p.site||''],['Case BCBA',p.bcba||''],['Exported',stamp.toLocaleString()],['Forms',String(sheets.length)],[],...index,[],['Each sheet is one open form as it stood at export. A sheet taken from a CSV export has the layout of that export; a sheet of fields lists every control by name.']];
  sheets.unshift({name:'Case',rows:cover});
  const bytes=xlsxBytes(sheets);
  if(opt.bytes)return bytes;
  const nm=(p.client||'case').trim().replace(/[^\w.-]+/g,'_').replace(/^_+|_+$/g,'')||'case';
  const t=stamp,date=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  a.download='CASE_'+nm+'_'+date+'.xlsx';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
  wsUI.toast('Spreadsheet saved: '+(sheets.length-1)+' form'+(sheets.length===2?'':'s')+' on their own sheets, with a Case sheet',{kind:'ok'});
  return bytes;
}
$('#caseXlsx').addEventListener('click',()=>{const b=$('#caseXlsx');b.disabled=true;exportCaseXlsx().catch(e=>wsUI.alert('The spreadsheet could not be written.\n'+(e&&e.message||e))).finally(()=>{b.disabled=false;});});

/* ================= what is due (v21.35) ================="""
rep("/* ================= what is due (v21.35) =================", CODE)
open(path, 'w', encoding='utf-8').write(s); print('patched', path)
