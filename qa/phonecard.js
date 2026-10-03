const L=require('./lib');(async()=>{const b=await L.chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();L.wire(p,[]);
await p.goto(L.BASE+'/NBH-Workstation/DM-1_Student-Demographics-and-Profile_v2026-09.html',{waitUntil:'load'});await L.sleep(800);
const els=await p.$$('#viewSeg button, .toolbar .seg button');await els[1].click({force:true});await L.sleep(400);
const r=await p.evaluate(()=>{const s=[...document.querySelectorAll('.sheet:not(table)')].find(e=>e.offsetParent);return s?getComputedStyle(s).borderRadius:'none';});
await p.evaluate(()=>window.scrollTo(0,700));await L.sleep(200);await p.screenshot({path:'formshots/check/DM-1-phone-card.png'});await b.close();console.log('sheet radius on phone:',r);})();
