import { useState, useEffect } from 'react';
import { C } from '../App';

export default function ReportScreen({
  concept, personaKey,
  report, xp,
  setStage, reset,
}) {
  const [animScore, setAnimScore] = useState(0);
  const [xpShown, setXpShown]     = useState(false);
  const [badge, setBadge]         = useState(false);

  const target = report?.understanding_score ?? 0;
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const dash   = circ - (animScore / 100) * circ;
  const sc     = animScore >= 80 ? C.gr : animScore >= 50 ? C.gold : C.red;
  const sl     = animScore >= 80 ? 'Strong' : animScore >= 50 ? 'Good progress' : 'Needs work';

  // ── Animate score dial on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!report) return;
    setAnimScore(0);
    setXpShown(false);
    setBadge(false);

    const timeout = setTimeout(() => {
      let current = 0;
      const iv = setInterval(() => {
        current += 1.2;
        if (current >= target) {
          setAnimScore(target);
          clearInterval(iv);
          setTimeout(() => setXpShown(true), 700);
          setTimeout(() => setBadge(true), 1500);
        } else {
          setAnimScore(Math.floor(current));
        }
      }, 18);
    }, 500);

    return () => clearTimeout(timeout);
  }, [report]);

  if (!report) return null;

  return (
    <div style={{ animation: 'fadeUp 0.25s ease' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        button { font-family: inherit; }
        button:hover { opacity: 0.88; }
      `}</style>

      {/* Badge row */}
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ background:`${C.gr}22`, color:C.gr, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {concept}
        </span>
        <span style={{ background:`${C.pur}22`, color:C.pur, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {personaKey}
        </span>
      </div>

      <h2 style={{ fontSize:18, fontWeight:700, color:C.cr, margin:'0 0 20px', letterSpacing:'-0.2px' }}>
        Session results
      </h2>

      {/* Score card */}
      <div style={{
        background:C.surf, border:`1px solid ${sc}40`,
        borderRadius:10, padding:'24px 20px',
        textAlign:'center', marginBottom:16,
      }}>
        {/* SVG dial */}
        <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
          <svg width={132} height={132} style={{ transform:'rotate(-90deg)' }}>
            <circle cx={66} cy={66} r={radius} fill="none" stroke={C.s3} strokeWidth={9}/>
            <circle
              cx={66} cy={66} r={radius} fill="none"
              stroke={sc} strokeWidth={9}
              strokeDasharray={circ}
              strokeDashoffset={dash}
              strokeLinecap="round"
              style={{ transition:'stroke-dashoffset 0.02s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{ position:'absolute', textAlign:'center' }}>
            <div style={{ fontSize:34, fontWeight:800, color:sc, lineHeight:1, letterSpacing:'-1px' }}>
              {animScore}
            </div>
            <div style={{ fontSize:11, color:C.t2 }}>out of 100</div>
          </div>
        </div>

        <div style={{ fontSize:14, fontWeight:600, color:sc, marginBottom:6 }}>
          {animScore > 0 ? sl : '—'}
        </div>

        {/* XP earned */}
        {xpShown && (
          <div style={{
            display:'inline-flex', alignItems:'center', gap:5,
            background:`${C.gold}15`, border:`1px solid ${C.gold}40`,
            borderRadius:4, padding:'5px 12px', marginTop:10,
            animation:'fadeIn 0.4s ease',
          }}>
            <span style={{ fontSize:12, fontWeight:700, color:C.gold }}>+50 XP earned</span>
          </div>
        )}
      </div>

      {/* Achievement badge */}
      {badge && (
        <div style={{
          background:`${C.gold}10`, border:`1px solid ${C.gold}40`,
          borderRadius:8, padding:'12px 16px', marginBottom:16,
          display:'flex', alignItems:'center', gap:12,
          animation:'fadeIn 0.5s ease',
        }}>
          <div style={{
            width:32, height:32, borderRadius:6,
            background:`${C.gold}20`, border:`1px solid ${C.gold}40`,
            display:'flex', alignItems:'center', justifyContent:'center',
            flexShrink:0, fontSize:16,
          }}>
            🏆
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, fontWeight:700, color:C.gold, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom:1 }}>
              Achievement
            </div>
            <div style={{ fontSize:13, fontWeight:600, color:C.cr }}>First session</div>
            <div style={{ fontSize:11, color:C.t2 }}>Completed a full learning session</div>
          </div>
          <div style={{ background:`${C.gold}25`, borderRadius:3, padding:'3px 7px', flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:800, color:C.gold, letterSpacing:'0.5px', textTransform:'uppercase' }}>New</span>
          </div>
        </div>
      )}

      {/* Strengths */}
      {report.strengths?.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.t3, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:10 }}>
            Strengths
          </div>
          {report.strengths.map((s, i) => (
            <div key={i} style={{
              background:`${C.gr}10`, border:`1px solid ${C.gr}28`,
              borderRadius:8, padding:'10px 14px', marginBottom:8,
              display:'flex', gap:10, alignItems:'flex-start',
            }}>
              <div style={{
                width:15, height:15, borderRadius:'50%',
                background:`${C.gr}22`, border:`1px solid ${C.gr}50`,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, marginTop:1, fontSize:9,
                color:C.gr, fontWeight:700,
              }}>
                ✓
              </div>
              <span style={{ fontSize:13, color:C.cr, lineHeight:1.55 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* Gaps */}
      {report.gaps?.length > 0 ? (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.t3, textTransform:'uppercase', letterSpacing:'0.7px', marginBottom:10 }}>
            Areas for improvement
          </div>
          {report.gaps.map((g, i) => {
            const isK = g.type === 'knowledge';
            const gc  = isK ? C.red : C.amb;
            return (
              <div key={i} style={{
                borderLeft:`3px solid ${gc}`,
                background:`${gc}08`,
                borderRadius:0,
                padding:'13px 16px', marginBottom:10,
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.cr }}>{g.topic}</span>
                  <span style={{
                    background:`${gc}20`, color:gc,
                    fontSize:10, fontWeight:600,
                    padding:'2px 8px', borderRadius:3,
                    letterSpacing:'0.4px', textTransform:'uppercase',
                  }}>
                    {isK ? 'Knowledge' : 'Communication'}
                  </span>
                </div>
                <div style={{ fontSize:12, color:C.t2, fontStyle:'italic', marginBottom:8 }}>
                  "{g.evidence}"
                </div>
                <div style={{
                  background:C.surf, borderRadius:5,
                  padding:'9px 12px', fontSize:12,
                  color:C.t1, lineHeight:1.65,
                  border:`1px solid ${gc}25`,
                }}>
                  {g.correction}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background:`${C.gr}10`, border:`1px solid ${C.gr}30`,
          borderRadius:8, padding:'12px 16px', marginBottom:16,
          fontSize:13, color:C.cr,
        }}>
          No gaps detected — all three concepts demonstrated clearly.
        </div>
      )}

      {/* Encouragement */}
      <div style={{
        borderLeft:`3px solid ${C.gr}`,
        background:`${C.gr}07`,
        borderRadius:0,
        padding:'12px 16px', marginBottom:24,
        fontSize:13, color:C.crm,
        fontStyle:'italic', lineHeight:1.7,
      }}>
        {report.encouragement}
      </div>

      {/* Navigation buttons */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        <button
          onClick={() => { setStage('input'); }}
          style={{
            borderRadius:7, padding:'11px 16px',
            fontSize:13, fontWeight:500, cursor:'pointer',
            background:'transparent', color:C.t2,
            border:`1px solid ${C.bdr}`,
          }}
        >
          ← New session
        </button>
        <button
          onClick={reset}
          style={{
            borderRadius:7, padding:'11px 16px',
            fontSize:13, fontWeight:600, cursor:'pointer',
            border:'none', background:C.gr, color:C.bg,
            letterSpacing:'0.1px',
          }}
        >
          Try another concept →
        </button>
      </div>
    </div>
  );
}