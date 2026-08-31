import fs from 'node:fs/promises';

const FILE = new URL('../live-data.json', import.meta.url);
const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard';
const SOFA = 'https://www.sofascore.com/api/v1/sport/football/scheduled-events';
const headers = { 'user-agent': 'LY10-Fanbase/1.2', accept: 'application/json' };
const isBarca = (name = '') => /barcelona/i.test(name);
const compact = (name = '') => name.replace(/^FC\s+/i, '').replace(/\s+CF$/i, '').trim();
const day = d => d.toISOString().slice(0, 10);
const compactDay = d => day(d).replaceAll('-', '');
const fetchJson = async url => {
  const r = await fetch(url, { headers });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

function fromEspn(e) {
  const c = e?.competitions?.[0];
  const home = c?.competitors?.find(x => x.homeAway === 'home');
  const away = c?.competitors?.find(x => x.homeAway === 'away');
  const hn = home?.team?.displayName, an = away?.team?.displayName;
  if (!hn || !an || (!isBarca(hn) && !isBarca(an))) return null;
  const raw = e.status?.type?.state;
  const detail = String(e.status?.type?.shortDetail || e.status?.type?.detail || '').toUpperCase();
  const state = raw === 'post' ? 'post' : raw === 'in' ? 'in' : 'pre';
  const status = state === 'post' ? 'FULL TIME' : state === 'in' && /HALF|HT/.test(detail) ? 'HALF TIME' : state === 'in' ? 'LIVE' : 'SCHEDULED';
  const hs = Number(home.score || 0), as = Number(away.score || 0);
  return { state, kickoff: e.date, home: hn, away: an, hs, as, status };
}

function fromSofa(e) {
  const hn = e?.homeTeam?.name, an = e?.awayTeam?.name;
  if (!hn || !an || (!isBarca(hn) && !isBarca(an))) return null;
  const type = String(e?.status?.type || '').toLowerCase();
  const desc = String(e?.status?.description || '').toLowerCase();
  const state = /finished|afterextra|afterpenalties/.test(type) ? 'post' : /inprogress|halftime|paused/.test(type) || /half time|1st half|2nd half/.test(desc) ? 'in' : 'pre';
  const status = state === 'post' ? 'FULL TIME' : /half/.test(type + desc) ? 'HALF TIME' : state === 'in' ? 'LIVE' : 'SCHEDULED';
  const hs = Number(e?.homeScore?.current ?? e?.homeScore?.normaltime ?? 0);
  const as = Number(e?.awayScore?.current ?? e?.awayScore?.normaltime ?? 0);
  return { state, kickoff: e?.startTimestamp ? new Date(e.startTimestamp * 1000).toISOString() : null, home: hn, away: an, hs, as, status };
}

async function findMatch(now) {
  const dates = [-1, 0, 1].map(offset => new Date(now.getTime() + offset * 86400000));
  const found = [];
  for (const d of dates) {
    try {
      const p = await fetchJson(`${ESPN}?dates=${compactDay(d)}&limit=100`);
      for (const e of p.events || []) { const x = fromEspn(e); if (x) found.push(x); }
    } catch {}
  }
  if (!found.some(x => x.state === 'in')) {
    for (const d of dates) {
      try {
        const p = await fetchJson(`${SOFA}/${day(d)}`);
        for (const e of p.events || []) { const x = fromSofa(e); if (x) found.push(x); }
      } catch {}
    }
  }
  return found
    .filter(x => x.kickoff)
    .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
}

function nextFixture(desk, after) {
  const all = [];
  for (const [month, cfg] of Object.entries(desk.calendars || {})) {
    for (const [date, m] of Object.entries(cfg.matches || {})) {
      const tm = String(m.meta || '').match(/(\d{1,2}:\d{2})\s+(?:CEST|CET)/i)?.[1] || '23:59';
      const kickoff = `${month}-${String(date).padStart(2, '0')}T${tm}:00+02:00`;
      if (new Date(kickoff) <= after) continue;
      all.push({
        home: /VS BARÇA/i.test(m.title) ? compact(m.title.split(/VS BARÇA/i)[0].trim()) : 'FC Barcelona',
        away: /^BARÇA VS/i.test(m.title) ? compact(m.title.replace(/^BARÇA VS/i, '').trim()) : 'FC Barcelona',
        opponent: compact(m.title.replace(/BARÇA/gi, '').replace(/\bVS\b/gi, '').trim()),
        title: m.title,
        meta: `${m.meta}${m.venue ? ` · ${m.venue}` : ''}`,
        kickoff
      });
    }
  }
  return all.sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0];
}

const now = new Date();
const desk = JSON.parse(await fs.readFile(FILE, 'utf8'));
const matches = await findMatch(now);
const live = matches.find(x => x.state === 'in');
const completed = [...matches].reverse().find(x => x.state === 'post' && new Date(x.kickoff) <= now);
const chosen = live || completed;

if (!chosen) {
  console.log('No current/recent Barcelona match found; feed left unchanged.');
  process.exit(0);
}

const currentDeskKickoff = desk?.last?.kickoff ? new Date(desk.last.kickoff) : new Date(0);
if (chosen.state === 'post' && new Date(chosen.kickoff) < currentDeskKickoff) process.exit(0);

const home = isBarca(chosen.home) ? 'BARÇA' : compact(chosen.home).toUpperCase();
const away = isBarca(chosen.away) ? 'BARÇA' : compact(chosen.away).toUpperCase();
desk.last = {
  competition: 'LA LIGA',
  status: chosen.status,
  home,
  homeScore: chosen.hs,
  awayScore: chosen.as,
  away,
  kickoff: chosen.kickoff,
  summary: `${chosen.home} ${chosen.hs}–${chosen.as} ${chosen.away}${chosen.status === 'FULL TIME' ? ' — full time.' : chosen.status === 'HALF TIME' ? ' — half time.' : ' — live.'}`
};
const following = nextFixture(desk, new Date(new Date(chosen.kickoff).getTime() + 3 * 3600000));
if (following) desk.next = following;
desk.updated = now.toISOString();
desk.source = 'LY10 automated match desk · ESPN/Sofascore score/status · FC Barcelona fixture schedule';
await fs.writeFile(FILE, JSON.stringify(desk, null, 2) + '\n');
console.log(`${desk.last.status}: ${desk.last.home} ${desk.last.homeScore}–${desk.last.awayScore} ${desk.last.away}`);
