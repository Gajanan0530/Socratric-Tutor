import { C } from '../App';
import { fetchQuiz } from '../api';
import { useState } from 'react';

export default function ExplainedScreen({
  concept, personaKey, explanationText,
  setQuiz, setStage, xp,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  async function handleTakeQuiz() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuiz(explanationText);
      setQuiz(data);
      setStage('quiz');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ animation: 'fadeUp 0.25s ease' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        button { font-family: inherit; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>

      {/* Badge row */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ background:`${C.gr}22`, color:C.gr, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {concept}
        </span>
        <span style={{ background:`${C.pur}22`, color:C.pur, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {personaKey}
        </span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:5, background:`${C.gold}15`, border:`1px solid ${C.gold}40`, borderRadius:3, padding:'3px 9px' }}>
          <span style={{ fontSize:11, fontWeight:700, color:C.gold }}>+15 XP earned</span>
        </div>
      </div>

      {/* Explanation card */}
      <div style={{
        background:C.surf, border:`1px solid ${C.gr}30`,
        borderRadius:10, padding:'18px 20px', marginBottom:18,
      }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, paddingBottom:12, borderBottom:`1px solid ${C.bdr}` }}>
          <span style={{ fontSize:12, fontWeight:600, color:C.t2, letterSpacing:'0.3px' }}>
            Explanation
          </span>
          <span style={{ fontSize:11, color:C.gold, background:`${C.gold}18`, padding:'2px 8px', borderRadius:3, fontWeight:600 }}>
            +15 XP
          </span>
        </div>
        <p style={{ fontSize:14, color:C.t1, lineHeight:1.8, margin:0 }}>
          {explanationText}
        </p>
      </div>

      {/* Prompt card */}
      <div style={{
        background:`${C.gr}10`, border:`1px solid ${C.gr}30`,
        borderRadius:8, padding:'12px 16px', marginBottom:18,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.cr, marginBottom:2 }}>
            Ready to test your comprehension?
          </div>
          <div style={{ fontSize:12, color:C.t2 }}>
            3 questions based on this explanation · up to +50 XP
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontSize:13, color:C.red, marginBottom:12, padding:'8px 12px', background:`${C.red}10`, borderRadius:6 }}>
          {error}
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleTakeQuiz}
        disabled={loading}
        style={{
          width:'100%', borderRadius:7, padding:'12px 20px',
          fontSize:14, fontWeight:600,
          cursor: loading ? 'not-allowed' : 'pointer',
          border:'none',
          background: loading ? C.s3 : C.gr,
          color: loading ? C.t3 : C.bg,
          letterSpacing:'0.1px', transition:'all 0.2s',
        }}
      >
        {loading ? 'Generating questions…' : 'Take the quiz'}
      </button>
    </div>
  );
}