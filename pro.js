const themeButton=document.querySelector('#theme-toggle');themeButton?.addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('ly10-theme',document.body.classList.contains('dark')?'dark':'light')});if(localStorage.getItem('ly10-theme')==='dark')document.body.classList.add('dark');
document.querySelectorAll('[data-poll]').forEach(b=>b.addEventListener('click',()=>{const note=document.querySelector('#poll-note');if(note)note.textContent=`Vote recorded for ${b.dataset.poll} ✓`;document.querySelectorAll('[data-poll]').forEach(x=>x.disabled=true)}));
const pageUrl=encodeURIComponent(location.href);const whatsApp=document.querySelector('.share-whatsapp'),shareX=document.querySelector('.share-x');if(whatsApp)whatsApp.href=`https://wa.me/?text=${encodeURIComponent('LY10 — The Lamine Yamal fanbase: ')}${pageUrl}`;if(shareX)shareX.href=`https://x.com/intent/post?text=${encodeURIComponent('Checking out LY10 — the independent Lamine Yamal fanbase')}&url=${pageUrl}`;

// Real form delivery. FormSubmit emails submissions to the LY10 owner without exposing a server password or API key.
const LY10_OWNER='penelopeolapejuattah@gmail.com';
const formEndpoint=`https://formsubmit.co/ajax/${LY10_OWNER}`;
const submitToOwner=async(form,type)=>{
  const message=form.querySelector('.form-message'),button=form.querySelector('button[type="submit"]');
  if(message)message.textContent='Sending…';if(button)button.disabled=true;
  const body={};new FormData(form).forEach((value,key)=>body[key]=value);
  body.form_type=type;body._subject=type==='Feedback'?'New LY10 feedback / correction':'New LY10 matchday signup';body._template='table';body._captcha='false';body._url=location.href;body._honey='';if(body.email)body._replyto=body.email;
  try{
    const response=await fetch(formEndpoint,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!response.ok)throw new Error('Submission failed');
    if(message)message.textContent=type==='Feedback'?'Sent ✓ Thanks — your message reached the LY10 inbox.':'Saved ✓ Your email reached the LY10 signup inbox.';
    form.reset();
  }catch{
    const subject=encodeURIComponent(body._subject||'LY10 message');
    const fallbackText=Object.entries(body).filter(([key])=>!key.startsWith('_')).map(([key,value])=>`${key}: ${value}`).join('\n\n');
    const href=`mailto:${LY10_OWNER}?subject=${subject}&body=${encodeURIComponent(fallbackText)}`;
    if(message)message.innerHTML=`Automatic sending is unavailable. <a href="${href}">Send this by email instead ↗</a>`;
  }finally{if(button)button.disabled=false}
};
const feedbackForm=document.querySelector('#feedback-form');if(feedbackForm){
  feedbackForm.action=`https://formsubmit.co/${LY10_OWNER}`;feedbackForm.method='POST';
  const firstButton=feedbackForm.querySelector('button[type="submit"]');
  if(!feedbackForm.querySelector('input[name="name"]')){const label=document.createElement('label');label.textContent='Your name (optional)';const input=document.createElement('input');input.type='text';input.name='name';input.placeholder='Your name';input.autocomplete='name';label.appendChild(input);feedbackForm.insertBefore(label,firstButton)}
  if(!feedbackForm.querySelector('input[type="email"]')){const label=document.createElement('label');label.textContent='Your email (optional)';const input=document.createElement('input');input.type='email';input.name='email';input.placeholder='you@example.com';input.autocomplete='email';label.appendChild(input);feedbackForm.insertBefore(label,firstButton)}
  feedbackForm.addEventListener('submit',e=>{e.preventDefault();submitToOwner(feedbackForm,'Feedback')});
}
const newsletterForm=document.querySelector('#newsletter-form');if(newsletterForm){newsletterForm.action=`https://formsubmit.co/${LY10_OWNER}`;newsletterForm.method='POST';newsletterForm.addEventListener('submit',e=>{e.preventDefault();submitToOwner(newsletterForm,'Matchday signup')})}

document.querySelector('#wallpaper-button')?.addEventListener('click',e=>{e.currentTarget.textContent='YOU’RE ON THE LIST ✓'});document.querySelector('#comment-button')?.addEventListener('click',()=>alert('Comments will open when moderation is connected.'));
const topButton=document.querySelector('.back-top');addEventListener('scroll',()=>topButton?.classList.toggle('show',scrollY>500),{passive:true});topButton?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

// Remove any old service worker from earlier mobile-reliability experiments.
if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});if('caches' in window)caches.keys().then(keys=>keys.filter(k=>k.startsWith('ly10-')).forEach(k=>caches.delete(k))).catch(()=>{})}
