(()=>{
  const $=(s)=>document.querySelector(s);
  const $$=(s)=>[...document.querySelectorAll(s)];
  const setText=(key,value)=>{const el=$(`[data-live="${key}"]`);if(el)el.textContent=value};
  const clearSkeleton=()=>$('.featured-match')?.classList.remove('skeleton-card');

  const FALLBACK={
    updated:'Official club result · 27 Aug 2026',
    last:{competition:'LA LIGA · MATCHDAY 1',status:'FULL TIME',home:'BARÇA',homeScore:2,awayScore:0,away:'ATHLETIC',summary:'FC Barcelona 2–0 Athletic Club — completed 27 Aug 2026.'},
    next:{title:'BARÇA VS RAYO VALLECANO',meta:'La Liga · 31 Aug 2026 · 21:30 CEST',kickoff:'2026-08-31T21:30:00+02:00',opponent:'Rayo Vallecano'},
    table:{label:'VIEW OFFICIAL TABLE'},
    calendars:{
      '2026-08':{label:'AUGUST',matches:{'31':{title:'BARÇA VS RAYO VALLECANO',meta:'La Liga · Home · 21:30 CEST',side:'home'}}},
      '2026-09':{label:'SEPTEMBER',matches:{'6':{title:'VALENCIA VS BARÇA',meta:'La Liga · Away · 16:15 CEST',side:'away'},'9':{title:'BARÇA VS FEYENOORD',meta:'UEFA Champions League · Home · 18:45 CEST',side:'home'}}}
    }
  };

  const applyMatchDesk=(desk)=>{
    const last=desk.last||FALLBACK.last,next=desk.next||FALLBACK.next,table=desk.table||FALLBACK.table;
    const stripResult=`${last.home} ${last.homeScore}–${last.awayScore} ${last.away}`;
    const kickoff=next.kickoff?new Date(next.kickoff):null;
    const stripNext=kickoff&&!Number.isNaN(kickoff.getTime())?`${next.opponent||next.away||'NEXT MATCH'} · ${kickoff.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).toUpperCase()}`:(next.opponent||next.away||'NEXT MATCH');
    const updated=desk.updated?`Auto-updated · ${new Date(desk.updated).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}`:FALLBACK.updated;
    Object.entries({
      'last-league':last.competition,'last-status':last.status,'last-home':last.home,'last-home-score':last.homeScore,
      'last-away-score':last.awayScore,'last-away':last.away,'last-summary':last.summary,'updated':updated,
      'next-title':next.title,'next-meta':next.meta,'strip-result':stripResult,'strip-next':stripNext,'table-position':table.position?`${table.position}${['st','nd','rd'][table.position-1]||'th'} IN LA LIGA`:(table.label||'VIEW OFFICIAL TABLE')
    }).forEach(([k,v])=>setText(k,v));
    clearSkeleton();
  };

  let countdownTimer;
  const applyCountdown=(next)=>{
    const countdown=$('#countdown'),title=$('.countdown-card h3');
    if(!countdown||!next?.kickoff)return;
    const kickoff=new Date(next.kickoff).getTime();
    if(Number.isNaN(kickoff))return;
    const opponent=(next.opponent||next.away||'NEXT OPPONENT').replace(/^FC\s+/i,'').toUpperCase();
    if(title)title.innerHTML=`BARÇA VS<br />${opponent}`;
    clearInterval(countdownTimer);
    const paint=()=>{
      const remaining=Math.max(0,kickoff-Date.now());
      const days=Math.floor(remaining/864e5),hours=Math.floor(remaining/36e5)%24,mins=Math.floor(remaining/6e4)%60;
      countdown.innerHTML=[days,hours,mins].map(n=>`<b>${String(n).padStart(2,'0')}</b>`).join('<i>:</i>');
    };
    paint();countdownTimer=setInterval(paint,1000);
  };

  const openDrawer=(title,meta,venue='')=>{
    const drawer=$('#detail-drawer'),scrim=$('.drawer-scrim'),content=$('#drawer-content');
    if(!drawer||!scrim||!content)return;
    content.innerHTML=`<p class="drawer-meta">FIXTURE DESK</p><h2 class="drawer-title">${title}</h2><p>${meta}${venue?`<br />${venue}`:''}</p><a class="drawer-action" href="https://www.fcbarcelona.com/en/football/first-team/schedule" target="_blank" rel="noopener">OFFICIAL FIXTURES ↗</a>`;
    drawer.classList.add('open');scrim.classList.add('open');drawer.setAttribute('aria-hidden','false');
  };

  const applyCalendar=(calendars)=>{
    const calendarRoot=$('.calendar-days'),calendarLabel=$('.calendar-head b'),calendarNext=$('#calendar-next');
    if(!calendarRoot||!calendarLabel||!calendars)return;
    const keys=Object.keys(calendars).sort();if(!keys.length)return;
    const current=new Date(),monthKey=`${current.getFullYear()}-${String(current.getMonth()+1).padStart(2,'0')}`;
    let index=Math.max(0,keys.findIndex(k=>k>=monthKey));if(index<0)index=keys.length-1;
    const render=()=>{
      const key=keys[index],cfg=calendars[key],[year,month]=key.split('-').map(Number);
      calendarLabel.textContent=cfg.label||new Date(year,month-1,1).toLocaleDateString('en-GB',{month:'long'}).toUpperCase();
      const first=new Date(year,month-1,1),days=new Date(year,month,0).getDate(),offset=(first.getDay()+6)%7;
      let html='<i>M</i><i>T</i><i>W</i><i>T</i><i>F</i><i>S</i><i>S</i>'+'<b></b>'.repeat(offset);
      for(let day=1;day<=days;day++){
        const m=cfg.matches?.[String(day)];
        html+=m?`<b class="matchday ${m.side==='away'?'away':''}" data-cal-day="${day}" tabindex="0">${day}</b>`:`<b>${day}</b>`;
      }
      calendarRoot.innerHTML=html;
      $$('[data-cal-day]').forEach(el=>{const show=()=>{const m=cfg.matches[String(el.dataset.calDay)];if(m)openDrawer(m.title,m.meta,m.venue)};el.onclick=show;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}}});
      if(calendarNext)calendarNext.textContent=keys.length>1?(index===keys.length-1?'‹ PREV':'NEXT ›'):'';
    };
    render();
    if(calendarNext)calendarNext.onclick=()=>{if(keys.length<2)return;index=index===keys.length-1?Math.max(0,index-1):Math.min(keys.length-1,index+1);render()};
  };

  const loadLive=async()=>{
    let desk=FALLBACK;
    const stamp=Date.now();
    const sources=[
      `https://raw.githubusercontent.com/pennyattah/Lamine-Yamal-Fanbase/main/live-data.json?v=${stamp}`,
      `./live-data.json?v=${stamp}`
    ];
    for(const url of sources){
      try{
        const response=await fetch(url,{cache:'no-store'});
        if(response.ok){const json=await response.json();if(json?.last&&json?.next){desk=json;break}}
      }catch{}
    }
    applyMatchDesk(desk);applyCountdown(desk.next);applyCalendar(desk.calendars||FALLBACK.calendars);
  };
  loadLive();

  const focusButton=$('#focus-reading'),feature=$('.feature-story');
  if(focusButton&&feature)focusButton.onclick=()=>{
    const on=feature.classList.toggle('reading-focus');focusButton.textContent=on?'EXIT FOCUS':'FOCUS READING';
    if(on)feature.scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'auto':'smooth',block:'start'});
  };

  let textScale=Number(localStorage.getItem('ly10-text-scale')||100);
  const applyScale=()=>{document.body.style.fontSize=`${textScale}%`;localStorage.setItem('ly10-text-scale',String(textScale))};
  applyScale();
  $('#font-up')?.addEventListener('click',()=>{textScale=Math.min(125,textScale+10);applyScale()});
  $('#font-down')?.addEventListener('click',()=>{textScale=Math.max(85,textScale-10);applyScale()});
  if(localStorage.getItem('ly10-reduced-motion')==='true')document.body.classList.add('reduce-motion');
  $('#reduce-motion')?.addEventListener('click',()=>{const on=document.body.classList.toggle('reduce-motion');localStorage.setItem('ly10-reduced-motion',String(on))});

  const progress=$('.reading-progress i');
  const paintProgress=()=>{if(!progress)return;const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max>0?Math.min(100,scrollY/max*100):0}%`};
  addEventListener('scroll',paintProgress,{passive:true});paintProgress();

  const world=$('#world-cup-content'),wc=window.LY10_DATA?.worldCup;
  if(world&&wc)world.innerHTML=`<div class="section-label">${wc.label}</div><div class="stats-title"><h2>${wc.title}</h2><p>${wc.team} · ${wc.tournament}<br />${wc.form}</p></div><div class="milestones"><div><b>26</b><span>${wc.tournament}<br />Global stage</span></div><div><b>🇪🇸</b><span>${wc.team}<br />National team</span></div><div><b>→</b><span>${wc.status}<br />Road continues</span></div></div>`;

  const repo='https://github.com/pennyattah/Lamine-Yamal-Fanbase';
  $$('.project-desk a[href="https://github.com/"]').forEach(a=>{a.href=a.textContent.includes('REPORT')?repo+'/issues/new':repo});
  const owner='penelopeolapejuattah@gmail.com';
  $$('.project-links a').forEach(a=>{
    if(a.textContent.trim()==='Discord'){a.textContent='Email LY10';a.href=`mailto:${owner}?subject=LY10%20Fanbase`}
    if(a.textContent.trim()==='Telegram'){a.textContent='Feedback';a.href='#feedback-form';a.removeAttribute('target');a.removeAttribute('rel')}
  });
  const fanWall=$('.comment-card');
  if(fanWall){
    const link=fanWall.querySelector('a[href*="USERNAME/REPO/discussions"]');
    if(link){link.href='#feedback-form';link.removeAttribute('target');link.removeAttribute('rel');link.textContent='SEND TO FAN WALL →'}
    const copy=fanWall.querySelector('p');if(copy)copy.textContent='Send your fan message to the LY10 inbox for moderation and future community features.';
  }
})();
