import { useState, useEffect, useRef } from 'react';
import { C } from '../App';
import { streamExplain } from '../api';

export default function ExplainingScreen({
  concept,
  personaKey,
  setExplanationText,
  setStage,
}) {
  const [displayText, setDisplayText]   = useState('');
  const [isComplete, setIsComplete]     = useState(false);
  const [error, setError]               = useState(null);
  const [progress, setProgress]         = useState(0);
  const hasStarted = useRef(false);

  // ── Start streaming on mount ─────────────────────────────────────────────────
  // hasStarted ref guards against React StrictMode double-invocation in development
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Animate progress bar independently — we don't know total length,
    // so we simulate progress that never reaches 100 until the stream ends
    const progressInterval = setInterval(() => {
      setProgress(p => Math.min(p + 0.7, 94));
    }, 80);

    streamExplain(
      concept,
      personaKey,
      // onChunk — append each piece of text as it arrives
      (chunk) => setDisplayText(prev => prev + chunk),
      // onDone — complete the progress bar and mark done
      () => {
        clearInterval(progressInterval);
        setProgress(100);
        setIsComplete(true);
      },
      // onError — show error message
      (errMsg) => {
        clearInterval(progressInterval);
        setError(errMsg);
      }
    ).catch(err => {
      clearInterval(progressInterval);
      setError(err.message);
    });

    return () => clearInterval(progressInterval);
  }, []);

  // ── On completion — store text and transition ────────────────────────────────
  useEffect(() => {
    if (!isComplete) return;
    setExplanationText(displayText);
    const t = setTimeout(() => setStage('explained'), 400);
    return () => clearTimeout(t);
  }, [isComplete]);

  return (
    <div style={{ animation: 'fadeUp 0.25s ease' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink  { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes dot    { from{opacity:0.3} to{opacity:1} }
      `}</style>

      {/* Badge row */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ background:`${C.gr}22`, color:C.gr, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {concept}
        </span>
        <span style={{ background:`${C.pur}22`, color:C.pur, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {personaKey}
        </span>
        <span style={{ marginLeft:'auto', background:`${C.gold}18`, color:C.gold, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:3 }}>
          +15 XP on completion
        </span>
      </div>

      {/* Explanation card */}
      <div style={{
        background:C.surf, border:`1px solid ${isComplete ? C.gr+'30' : C.bdr}`,
        borderRadius:10, padding:'18px 20px', marginBottom:14, minHeight:180,
        transition:'border-color 0.3s',
      }}>
        {/* Status indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${C.bdr}` }}>
          {!isComplete ? (
            <div style={{ display:'flex', gap:3 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width:5, height:5, borderRadius:'50%', background:C.gr,
                  animation:`dot ${0.5+i*0.18}s ease-in-out infinite alternate`,
                }}/>
              ))}
            </div>
          ) : (
            <div style={{ width:5, height:5, borderRadius:'50%', background:C.grl }}/>
          )}
          <span style={{ fontSize:12, color:C.t2, fontWeight:500 }}>
            {isComplete ? 'Complete' : 'Generating explanation…'}
          </span>
        </div>

        {/* Text output */}
        {error ? (
          <p style={{ fontSize:14, color:C.red, lineHeight:1.7, margin:0 }}>
            Error: {error}
          </p>
        ) : (
          <p style={{ fontSize:14, color:C.t1, lineHeight:1.8, margin:0 }}>
            {displayText}
            {!isComplete && (
              <span style={{ borderRight:`2px solid ${C.gr}`, marginLeft:1, animation:'blink 0.7s infinite' }}>
                &nbsp;
              </span>
            )}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ background:C.s3, borderRadius:2, height:3, overflow:'hidden', marginBottom:7 }}>
        <div style={{
          width:`${progress}%`, height:3, background:C.gr, borderRadius:2,
          transition:'width 0.08s linear',
        }}/>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:C.t3 }}>
        <span>{isComplete ? 'Complete' : 'Generating…'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
    </div>
  );
}