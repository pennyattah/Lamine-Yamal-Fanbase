const FALLBACK_URL='https://raw.githubusercontent.com/pennyattah/Lamine-Yamal-Fanbase/main/live-data.json';
const ESPN='https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard';
module.exports=async function(req,res){
  const now=new Date();
  const checks={fallback:{ok:false},espn:{ok:false}};
  const probe=async(url)=>{const r=await fetch(url,{headers:{'user-agent':'LY10-health-check/1.0'},cache:'no-store',signal:AbortSignal.timeout(8000)});if(!r.ok)throw new Error('HTTP '+r.status);return r;};
  try{const r=await probe(FALLBACK_URL);const d=await r.json();checks.fallback={ok:!!(d&&d.last&&d.next),updated:d?.updated||null};}catch(e){checks.fallback={ok:false,error:String(e.message||e)};}
  try{await probe(ESPN);checks.espn={ok:true};}catch(e){checks.espn={ok:false,error:String(e.message||e)};}
  const ok=checks.fallback.ok||checks.espn.ok;
  res.setHeader('Cache-Control','no-store');
  return res.status(ok?200:503).json({service:'LY10 live-data health',status:ok?'degraded':'down',checkedAt:now.toISOString(),checks,troubleshooting:[...(checks.fallback.ok?[]:['Fallback data unavailable: check the repository live-data.json file and GitHub raw access.']),...(checks.espn.ok?[]:['ESPN provider unreachable: check provider availability; Sofascore is used as a fallback by /api/live-data.']),...(ok?[]:['If both providers fail, inspect Vercel Runtime Logs for /api/live-data and /api/health.'])]});
};
