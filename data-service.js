(()=>{
  const $=(s)=>document.querySelector(s);
  const $$=(s)=>[...document.querySelectorAll(s)];
  const setText=(key,value)=>{const el=$(`[data-live="${key}"]`);if(el)el.textContent=value};
  const clearSkeleton=()=>$('.featured-match')?.classList.remove('skeleton-card');

  /* Reliable match-centre fallback. This keeps the page useful even when no external API is available. */
  const matchDesk={
    lastLeague:'LA LIGA · MATCHDAY 1',lastStatus:'FULL TIME',lastHome:'BARÇA',lastHomeScore:'2',lastAwayScore:'0',lastAway:'ATHLETIC',
    lastSummary:'FC Barcelona 2–0 Athletic Club — latest completed first-team result.',
    updated:'Official club result · 27 Aug 2026',nextTitle:'BARÇA VS RAYO VALLECANO',nextMeta:'31 Aug 2026 · La Liga · 21:30 CEST',
    stripResult:'BARÇA 2–0 ATHLETIC',stripNext:'RAYO · 31 AUG · 21:30',tablePosition:'VIEW OFFICIAL TABLE'
  };
  Object.entries({
    'last-league':matchDesk.lastLeague,'last-status':matchDesk.lastStatus,'last-home':matchDesk.lastHome,'last-home-score':matchDesk.lastHomeScore,
    'last-away-score':matchDesk.lastAwayScore,'last-away':matchDesk.lastAway,'last-summary':matchDesk.lastSummary,'updated':matchDesk.updated,
    'next-title':matchDesk.nextTitle,'next-meta':matchDesk.nextMeta,'strip-result':matchDesk.stripResult,'strip-next':matchDesk.stripNext,'table-position':matchDesk.tablePosition
  }).forEach(([k,v])=>setText(k,v));
  clearSkeleton();

  /* Keep the visible countdown in sync with the actual next fixture. */
  const nextKickoff=new Date('2026-08-31T21:30:00+02:00').getTime();
  const countdown=$('#countdown');
  const countdownTitle=$('.countdown-card h3');
  if(countdownTitle)countdownTitle.innerHTML='BARÇA VS<br />RAYO';
  const paintCountdown=()=>{
    if(!countdown)return;
    const remaining=Math.max(0,nextKickoff-Date.now());
    const days=Math.floor(remaining/864e5),hours=Math.floor(remaining/36e5)%24,mins=Math.floor(remaining/6e4)%60;
    countdown.innerHTML=[days,hours,mins].map(n=>`<b>${String(n).padStart(2,'0')}</b>`).join('<i>:</i>');
  };
  paintCountdown();setInterval(paintCountdown,1000);

  /* Accurate September/October fixture calendar using currently published club fixtures. */
  const calendars={
    '2026-09':{label:'SEPTEMBER',matches:{6:['VALENCIA VS BARÇA','La Liga · Away · 16:15 CEST','away'],9:['BARÇA VS FEYENOORD','UEFA Champions League · Home · 18:45 CEST','home'],13:['LEVANTE VS BARÇA','La Liga · Away · Time TBA','away'],16:['BARÇA VS RACING','La Liga · Home · Time TBA','home'],20:['SEVILLA VS BARÇA','La Liga · Away · Time TBA','away']}},
    '2026-10':{label:'OCTOBER',matches:{11:['BARÇA VS GETAFE','La Liga · Home · Time TBA','home'],13:['GALATASARAY VS BARÇA','UEFA Champions League · Away · 21:00 CEST','away'],18:['BETIS VS BARÇA','La Liga · Away · Time TBA','away'],20:['PSG VS BARÇA','UEFA Champions League · Away · 21:00 CEST','away'],25:['BARÇA VS REAL MADRID','La Liga · Home · Time TBA','home']}}
  };
  let calendarKey='2026-09';
  const calendarRoot=$('.calendar-days'),calendarLabel=$('.calendar-head b'),calendarNext=$('#calendar-next');
  const openDrawer=(title,meta)=>{
    const drawer=$('#detail-drawer'),scrim=$('.drawer-scrim'),content=$('#drawer-content');
    if(!drawer||!scrim||!content)return;
    content.innerHTML=`<p class="drawer-meta">FIXTURE DESK</p><h2 class="drawer-title">${title}</h2><p>${meta}</p><a class="drawer-action" href="https://www.fcbarcelona.com/en/football/first-team/schedule" target="_blank" rel="noopener">OFFICIAL FIXTURES ↗</a>`;
    drawer.classList.add('open');scrim.classList.add('open');drawer.setAttribute('aria-hidden','false');
  };
  const renderCalendar=()=>{
    if(!calendarRoot||!calendarLabel)return;
    const [year,month]=calendarKey.split('-').map(Number),cfg=calendars[calendarKey];
    calendarLabel.textContent=cfg.label;
    const first=new Date(year,month-1,1),days=new Date(year,month,0).getDate();
    const mondayOffset=(first.getDay()+6)%7;
    let html='<i>M</i><i>T</i><i>W</i><i>T</i><i>F</i><i>S</i><i>S</i>'+'<b></b>'.repeat(mondayOffset);
    for(let day=1;day<=days;day++){
      const m=cfg.matches[day];
      html+=m?`<b class="matchday ${m[2]==='away'?'away':''}" data-cal-day="${day}" tabindex="0">${day}</b>`:`<b>${day}</b>`;
    }
    calendarRoot.innerHTML=html;
    $$('[data-cal-day]').forEach(el=>{
      const show=()=>{const m=cfg.matches[el.dataset.calDay];openDrawer(m[0],m[1])};
      el.onclick=show;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show()}};
    });
    if(calendarNext)calendarNext.textContent=calendarKey==='2026-09'?'NEXT ›':'‹ PREV';
  };
  renderCalendar();
  if(calendarNext)calendarNext.onclick=()=>{calendarKey=calendarKey==='2026-09'?'2026-10':'2026-09';renderCalendar()};

  /* Focus-reading mode already has matching CSS; this activates it. */
  const focusButton=$('#focus-reading'),feature=$('.feature-story');
  if(focusButton&&feature)focusButton.onclick=()=>{
    const on=feature.classList.toggle('reading-focus');
    focusButton.textContent=on?'EXIT FOCUS':'FOCUS READING';
    if(on)feature.scrollIntoView({behavior:document.body.classList.contains('reduce-motion')?'auto':'smooth',block:'start'});
  };

  /* Accessibility controls. */
  let textScale=Number(localStorage.getItem('ly10-text-scale')||100);
  const applyScale=()=>{document.body.style.fontSize=`${textScale}%`;localStorage.setItem('ly10-text-scale',String(textScale))};
  applyScale();
  $('#font-up')?.addEventListener('click',()=>{textScale=Math.min(125,textScale+10);applyScale()});
  $('#font-down')?.addEventListener('click',()=>{textScale=Math.max(85,textScale-10);applyScale()});
  const reduced=localStorage.getItem('ly10-reduced-motion')==='true';
  if(reduced)document.body.classList.add('reduce-motion');
  $('#reduce-motion')?.addEventListener('click',()=>{const on=document.body.classList.toggle('reduce-motion');localStorage.setItem('ly10-reduced-motion',String(on))});

  /* Reading progress bar. */
  const progress=$('.reading-progress i');
  const paintProgress=()=>{if(!progress)return;const max=document.documentElement.scrollHeight-innerHeight;progress.style.width=`${max>0?Math.min(100,scrollY/max*100):0}%`};
  addEventListener('scroll',paintProgress,{passive:true});paintProgress();

  /* Fill the previously blank World Cup section without changing the site's visual language. */
  const world=$('#world-cup-content'),wc=window.LY10_DATA?.worldCup;
  if(world&&wc){
    world.innerHTML=`<div class="section-label">${wc.label}</div><div class="stats-title"><h2>${wc.title}</h2><p>${wc.team} · ${wc.tournament}<br />${wc.form}</p></div><div class="milestones"><div><b>26</b><span>${wc.tournament}<br />Global stage</span></div><div><b>🇪🇸</b><span>${wc.team}<br />National team</span></div><div><b>→</b><span>${wc.status}<br />Road continues</span></div></div>`;
  }

  /* Point project actions to this project instead of the generic GitHub homepage. */
  const repo='https://github.com/pennyattah/Lamine-Yamal-Fanbase';
  $$('.project-desk a[href="https://github.com/"]').forEach(a=>{
    if(a.textContent.includes('REPORT'))a.href=repo+'/issues/new';else a.href=repo;
  });
})();
