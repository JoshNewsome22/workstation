
/* v21.35 what is due: the open next steps of every note, by their dates, for the workstation's due line */
window.__nbhDue=function(){const out=[];(S.notes||[]).forEach(n=>(n.next||[]).forEach(x=>{if(x.done||!x.when||!x.what)return;out.push({what:(x.what+(x.who?' ('+x.who+')':'')).slice(0,60),date:x.when});}));return out;};
