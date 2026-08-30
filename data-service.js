(()=>{
  const $=(selector)=>document.querySelector(selector);
  const setText=(key,value)=>{const el=document.querySelector(`[data-live="${key}"]`);if(el)el.textContent=value};
  const clearSkeleton=()=>document.querySelector('.featured-match')?.classList.remove('skeleton-card');

  const fallback={
    lastLeague:'FC Barcelona',
    lastStatus:'LATEST RESULT',
    lastHome:'BARÇA',
    lastHomeScore:'2',
    lastAwayScore:'0',
    lastAway:'ATHLETIC',
    lastSummary:'Barcelona 2–0 Athletic Club — latest completed first-team result.',
    updated:'Updated from official club information.',
    nextTitle:'BARÇA VS RAYO VALLECANO',
    nextMeta:'31 Aug 2026 · La Liga · 21:30 CEST',
    stripResult:'BARÇA 2–0 ATHLETIC',
    stripNext:'RAYO · 31 AUG',
    tablePosition:'SEE OFFICIAL TABLE'
  };

  const render=(d)=>{
    setText('last-league',d.lastLeague);
    setText('last-status',d.lastStatus);
    setText('last-home',d.lastHome);
    setText('last-home-score',d.lastHomeScore);
    setText('last-away-score',d.lastAwayScore);
    setText('last-away',d.lastAway);
    setText('last-summary',d.lastSummary);
    setText('updated',d.updated);
    setText('next-title',d.nextTitle);
    setText('next-meta',d.nextMeta);
    setText('strip-result',d.stripResult);
    setText('strip-next',d.stripNext);
    setText('table-position',d.tablePosition);
    clearSkeleton();
  };

  try{render(fallback)}catch(err){console.warn('LY10 match-centre fallback failed',err)}
})();
