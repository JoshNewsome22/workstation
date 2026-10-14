/* v22.00: respond.html's own script, moved out of the page so that its security policy can refuse any inline script (review F495, I251) */
/* a second link opened in this tab changes only the part after # (no new page): open its questionnaire */
window.addEventListener('hashchange',function(){location.reload();});
(function(){var R=window.NBH_RESPOND,root=document.getElementById('nbhr');
 var say=function(b,t){root.innerHTML='<div class="empty"><b>'+b+'</b><p>'+t+'</p></div>';};
 /* v21.88 a short link: the questionnaire is fetched sealed from the reply box and opened with the key in the link */
 if(R&&R.isShort&&R.isShort()){root.innerHTML='<div class="empty">Opening the questionnaire…</div>';
  R.openShort().then(function(p){root.innerHTML='';R.mount(root,p);},function(e){var w=e&&e.message;
   if(w==='gone')say('This link has expired.','Links are kept for 60 days. Ask the person who sent it for a new link.');
   else if(w==='net')say('The questionnaire could not be opened right now.','Check the internet connection, then open the link again.');
   else say('This link does not open.','Part of it may have been cut off when it was copied. Ask the person who sent it to send the link again.');});return;}
 var p=R&&R.payloadFromHash();
 if(p)NBH_RESPOND.mount(root,p);
 else root.innerHTML=NBH_RESPOND.linkProblem&&NBH_RESPOND.linkProblem()?'<div class="empty"><b>This link does not open.</b><p>Part of it may have been cut off when it was copied, or it was made by a newer edition of the workstation than this page. Ask the person who sent it to send the link again, or the questionnaire as a file.</p></div>':'<div class="empty"><b>This link carries no questionnaire.</b><p>Ask the person who sent it for the full link, or for the questionnaire as a file.</p></div>';})();
