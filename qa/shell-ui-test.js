const {chromium,BASE,wire,sleep}=require(__dirname+'/lib.js');
(async()=>{const log=[];const br=await chromium.launch();const page=await br.newPage({viewport:{width:1440,height:900}});wire(page,log);
 await page.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 const r1=await page.evaluate(()=>{alert('short');const t=document.querySelectorAll('.ws-toast').length;alert('Long notice.\n\nSecond paragraph.');return {toasts:t,cfOpen:$('#cfDlg').open,title:$('#cfTitle').textContent};});
 await page.evaluate(()=>$('#cfFoot button').click());
 console.log('alerts',JSON.stringify(r1));
 await page.evaluate(()=>openForm('TB-1'));await page.waitForFunction(()=>!!state.status['TB-1'],null,{timeout:20000});
 /* close with the styled dialog: cancel then confirm */
 await page.click('#closeForm');await sleep(300);
 console.log('close dialog',await page.evaluate(()=>({open:$('#cfDlg').open,title:$('#cfTitle').textContent,btns:[...document.querySelectorAll('#cfFoot button')].map(b=>b.textContent)})));
 await page.evaluate(()=>document.querySelector('#cfFoot button').click());await sleep(200);console.log('after cancel cur',await page.evaluate(()=>state.cur));
 await page.click('#closeForm');await sleep(200);await page.evaluate(()=>document.querySelector('#cfFoot button.danger').click());await sleep(300);console.log('after close cur',await page.evaluate(()=>state.cur));
 /* the bar fold */
 console.log('fold before',await page.evaluate(()=>({folded:document.body.classList.contains('bar-folded'),sum:$('#barSum').hidden})));
 await page.evaluate(()=>{$('#pClient').value='Sample Student';$('#pSid').value='123';$('#pGrade').value='7';$('#pSite').value='Royal Palm School';who();barAutoFold();});await sleep(200);
 console.log('fold after',await page.evaluate(()=>({folded:document.body.classList.contains('bar-folded'),sumHidden:$('#barSum').hidden,name:$('#sumName').textContent,det:$('#sumDet').textContent,detHidden:getComputedStyle($('#bar .det')).display})));
 await page.screenshot({path:__dirname+'/out/ui/bar-folded.png'});
 await page.click('#barEdit');await sleep(200);console.log('edit',await page.evaluate(()=>({folded:document.body.classList.contains('bar-folded'),foldBtn:$('#barFold').hidden})));
 await page.click('#barFold');await sleep(200);console.log('done',await page.evaluate(()=>document.body.classList.contains('bar-folded')));
 /* touch */
 const ctx=await br.newContext({viewport:{width:1024,height:1366},hasTouch:true,isMobile:true});const p2=await ctx.newPage();wire(p2,log);await p2.goto(BASE+'/NBH-Workstation/index.html');await sleep(700);
 console.log('touch',await p2.evaluate(()=>({sm:Math.round($('#caseMap').getBoundingClientRect().height),item:Math.round(document.querySelector('.rail .item').getBoundingClientRect().height),crumb:Math.round($('#fullBtn').getBoundingClientRect().height)})));
 console.log('LOG',JSON.stringify(log).slice(0,300));await br.close();})();
