const FALLBACK_URL='https://raw.githubusercontent.com/pennyattah/Lamine-Yamal-Fanbase/main/live-data.json';
const ESPN='https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard';
const SOFA='https://www.sofascore.com/api/v1/sport/football/scheduled-events';
const H={'user-agent':'Mozilla/5.0 LY10-Fanbase/1.1','accept':'application/json,text/html;q=0.8,*/*;q=0.5'};
const jf=async u=>{const r=await fetch(u,{headers:H,cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()};
const compact=n=>(n||'').replace(/^FC\s+/i,'').replace(/\s+CF$/i,'').trim();
const isBarca=n=>/barcelona/i.test(n||'');
const ymd=d=>d.toISOString().slice(0,10);
const ymdCompact=d=>ymd(d).replaceAll('-','');

function espnEvent(e){
  const c=e?.competitions?.[0],home=c?.competitors?.find(x=>x.homeAway==='home'),away=c?.competitors?.find(x=>x.homeAway==='away');
  if(!home||!away||(!isBarca(home.team?.displayName)&&!isBarca(away.team?.displayName)))return null;
  const state=e.status?.type?.state,detail=String(e.status?.type?.shortDetail||e.status?.type?.detail||'').toUpperCase();
  const status=state==='post'?'FULL TIME':state==='in'&&/HALF|HT/.test(detail)?'HALF TIME':state==='in'?'LIVE':'SCHEDULED';
  return {state:state==='post'?'post':state==='in'?'in':'pre',kickoff:e.date,match:{competition:'LA LIGA',status,home:isBarca(home.team?.displayName)?'BARÇA':compact(home.team?.displayName).toUpperCase(),homeScore:Number(home.score||0),awayScore:Number(away.score||0),away:isBarca(away.team?.displayName)?'BARÇA':compact(away.team?.displayName).toUpperCase(),summary:`${home.team?.displayName} ${home.score||0}–${away.score||0} ${away.team?.displayName}${status==='FULL TIME'?' — full time.':status==='HALF TIME'?' — half time.':status==='LIVE'?' — live.':''}`}};
}

function sofaEvent(e){
  const hn=e?.homeTeam?.name,an=e?.awayTeam?.name;
  if(!hn||!an||(!isBarca(hn)&&!isBarca(an)))return null;
  const t=String(e?.status?.type||'').toLowerCase(),desc=String(e?.status?.description||'').toLowerCase();
  const state=/finished|afterextra|afterpenalties/.test(t)?'post':/inprogress|halftime|paused/.test(t)||/half time|2nd half|1st half/.test(desc)?'in':'pre';
  const status=state==='post'?'FULL TIME':/half/.test(t+desc)?'HALF TIME':state==='in'?'LIVE':'SCHEDULED';
  const hs=Number(e?.homeScore?.current??e?.homeScore?.normaltime??0),as=Number(e?.awayScore?.current??e?.awayScore?.normaltime??0);
  const kickoff=e?.startTimestamp?new Date(e.startTimestamp*1000).toISOString():null;
  return {state,kickoff,match:{competition:'LA LIGA',status,home:isBarca(hn)?'BARÇA':compact(hn).toUpperCase(),homeScore:hs,awayScore:as,away:isBarca(an)?'BARÇA':compact(an).toUpperCase(),summary:`${hn} ${hs}–${as} ${an}${status==='FULL TIME'?' — full time.':status==='HALF TIME'?' — half time.':status==='LIVE'?' — live.':''}`}};
}

async function matchWindow(now){
  const days=[-1,0,1].map(o=>new Date(now.getTime()+o*864e5));
  const out=[];
  const ep=await Promise.allSettled(days.map(d=>jf(`${ESPN}?dates=${ymdCompact(d)}&limit=100`)));
  for(const p of ep)if(p.status==='fulfilled')for(const e of p.value.events||[]){const x=espnEvent(e);if(x)out.push(x)}
  if(!out.some(x=>x.state==='in')){
    const sp=await Promise.allSettled(days.map(d=>jf(`${SOFA}/${ymd(d)}`)));
    for(const p of sp)if(p.status==='fulfilled')for(const e of p.value.events||[]){const x=sofaEvent(e);if(x)out.push(x)}
  }
  const dedup=new Map();for(const x of out){if(!x.kickoff)continue;const k=`${x.kickoff}-${x.match.home}-${x.match.away}`;const old=dedup.get(k);if(!old||x.state==='in'||(x.state==='post'&&old.state==='pre'))dedup.set(k,x)}
  return [...dedup.values()].sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff));
}

function fixtures(d){
  const a=[];
  if(d?.next?.kickoff)a.push({...d.next});
  for(const [month,c] of Object.entries(d?.calendars||{}))for(const [day,m] of Object.entries(c.matches||{})){
    const hm=String(m.meta||'').match(/(\d{1,2}:\d{2})\s+(?:CEST|CET)/i),time=hm?hm[1]:'23:59';
    a.push({title:m.title,meta:m.meta+(m.venue?` · ${m.venue}`:''),venue:m.venue,kickoff:`${month}-${String(day).padStart(2,'0')}T${time}:00+02:00`,opponent:compact(String(m.title||'').replace(/BARÇA/gi,'').replace(/\bVS\b/gi,'').trim())});
  }
  return a.sort((x,y)=>new Date(x.kickoff)-new Date(y.kickoff));
}

module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Cache-Control','s-maxage=30, stale-while-revalidate=60');
  try{
    const fallback=await jf(`${FALLBACK_URL}?v=${Date.now()}`),now=new Date(),matches=await matchWindow(now),live=matches.find(x=>x.state==='in'),completed=[...matches].reverse().find(x=>x.state==='post'&&new Date(x.kickoff)<=now),desk=JSON.parse(JSON.stringify(fallback)),fs=fixtures(fallback);
    const chosen=live||((completed&&new Date(completed.kickoff)>new Date('2026-08-27T23:59:59+02:00'))?completed:null);
    if(chosen){desk.last=chosen.match;const after=fs.find(f=>new Date(f.kickoff).getTime()>new Date(chosen.kickoff).getTime()+3*3600000);if(after)desk.next=after;desk.updated=new Date().toISOString();desk.source=`LY10 verified live desk · ${live?'live':'completed'} score via ESPN/Sofascore fallback`;}
    desk.sourceHealth={generatedAt:new Date().toISOString(),providers:['ESPN','Sofascore'],matchFound:!!chosen};
    return res.status(200).json(desk);
  }catch(e){return res.status(503).json({error:'Verified live data temporarily unavailable',detail:String(e?.message||e)})}
};