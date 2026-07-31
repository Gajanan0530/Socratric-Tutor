import { C } from '../App';
import { fetchReport } from '../api';
import { useState } from 'react';

export default function QuizScreen({
  concept, personaKey,
  explanationText, quiz,
  userAnswers, setUserAnswers,
  setReport, setStage, setXp,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const MIN_CHARS = 20;
  const answeredCount = userAnswers.filter(a => a.trim().length >= MIN_CHARS).length;
  const allDone = answeredCount === 3;

  function updateAnswer(index, value) {
    const next = [...userAnswers];
    next[index] = value;
    setUserAnswers(next);
  }

  async function handleSubmit() {
    if (!allDone) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReport(
        concept,
        personaKey,
        quiz.questions,
        userAnswers,
      );
      setReport(data);
      setXp(prev => prev + 50);
      setStage('report');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ animation: 'fadeUp 0.25s ease' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        textarea { resize: vertical; font-family: inherit; }
        textarea:focus { outline: none; border-color: ${C.gr} !important; }
        button { font-family: inherit; }
        button:hover:not(:disabled) { opacity: 0.88; }
      `}</style>

      {/* Badge row */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <span style={{ background:`${C.gr}22`, color:C.gr, fontSize:12, fontWeight:500, padding:'3px 10px', borderRadius:3 }}>
          {concept}
        </span>
        <span style={{ marginLeft:'auto', background:`${C.gold}22`, color:C.gold, fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:3 }}>
          Up to +50 XP
        </span>
      </div>

      {/* Heading */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize:18, fontWeight:700, color:C.cr, margin:'0 0 4px', letterSpacing:'-0.2px' }}>
          Comprehension check
        </h2>
        <p style={{ fontSize:13, color:C.t2, margin:0, lineHeight:1.6 }}>
          Answer each question in your own words.
        </p>
      </div>

      {/* Explanation expander */}
      <button
        onClick={() => setShowExplanation(v => !v)}
        style={{
          width:'100%', background:C.s2, border:`1px solid ${C.bdr}`,
          borderRadius:7, padding:'9px 14px', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:16, color:C.t2, fontSize:13,
        }}
      >
        <span>View the explanation again</span>
        <span style={{ fontSize:11 }}>{showExplanation ? '▲' : '▼'}</span>
      </button>
      {showExplanation && (
        <div style={{
          background:C.surf, border:`1px solid ${C.bdr}`,
          borderRadius:8, padding:'14px 16px',
          fontSize:13, color:C.t1, lineHeight:1.75,
          marginBottom:16, marginTop:-10,
        }}>
          {explanationText}
        </div>
      )}

      {/* Question cards */}
      {quiz?.questions?.map((q, i) => {
        const answered = userAnswers[i].trim().length >= MIN_CHARS;
        return (
          <div
            key={i}
            style={{
              background: C.surf,
              border: `1px solid ${answered ? C.gr + '55' : C.bdr}`,
              borderRadius: 10, padding: '14px 16px',
              marginBottom: 12, transition: 'border-color 0.2s',
            }}
          >
            {/* Question header */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{
                width:22, height:22, borderRadius:4, flexShrink:0,
                background: answered ? C.gr : C.s3,
                border: `1.5px solid ${answered ? C.gr : C.bdr}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, fontWeight:700,
                color: answered ? C.bg : C.t3,
                transition: 'all 0.2s',
              }}>
                {answered ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize:11, fontWeight:600,
                color: answered ? C.gr : C.t3,
                textTransform:'uppercase', letterSpacing:'0.5px',
              }}>
                Q{i + 1}
              </span>
              {answered && (
                <span style={{ marginLeft:'auto', fontSize:11, color:C.gr, fontWeight:500 }}>
                  Answered
                </span>
              )}
            </div>

            {/* Question text */}
            <p style={{ fontSize:13, color:C.cr, lineHeight:1.65, margin:'0 0 10px', fontWeight:500 }}>
              {q.question}
            </p>

            {/* Answer textarea */}
            <textarea
              value={userAnswers[i]}
              onChange={e => updateAnswer(i, e.target.value)}
              placeholder="Write your answer here…"
              rows={3}
              style={{
                width:'100%', background:C.s2,
                border:`1px solid ${answered ? C.gr + '50' : C.bdr}`,
                borderRadius:6, padding:'9px 12px',
                fontSize:13, color:C.t1, lineHeight:1.65,
                boxSizing:'border-box', transition:'border-color 0.2s',
              }}
            />
          </div>
        );
      })}

      {/* Progress bar */}
      <div style={{ marginBottom:14 }}>
        <div style={{ display:'flex', gap:5, marginBottom:7 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              flex:1, height:4, borderRadius:2,
              background: userAnswers[i].trim().length >= MIN_CHARS ? C.gr : C.s3,
              transition: 'background 0.25s',
            }}/>
          ))}
        </div>
        <div style={{
          fontSize:11,
          color: allDone ? C.gr : C.t3,
          fontWeight: allDone ? 600 : 400,
        }}>
          {allDone ? 'All questions answered' : `${answeredCount}/3 answered`}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontSize:13, color:C.red, marginBottom:12,
          padding:'8px 12px', background:`${C.red}10`, borderRadius:6,
        }}>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!allDone || loading}
        style={{
          width:'100%', borderRadius:7, padding:'12px 20px',
          fontSize:14, fontWeight:600,
          cursor: allDone && !loading ? 'pointer' : 'not-allowed',
          border:'none',
          background: allDone && !loading ? C.gr : C.s3,
          color: allDone && !loading ? C.bg : C.t3,
          letterSpacing:'0.1px', transition:'all 0.2s',
        }}
      >
        {loading ? 'Analysing your answers…' : 'Submit answers'}
      </button>
    </div>
  );
}