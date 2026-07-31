import { C } from '../App';

export default function InputScreen({
  personas,
  concept, setConcept,
  personaKey, setPersonaKey,
  streak,
  setStage,
}) {
  const canStart = concept.trim().length > 0;

  function handleStart() {
    if (canStart) setStage('explaining');
  }

  return (
    <div style={{ animation: 'fadeUp 0.25s ease' }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input:focus { border-color: ${C.gr} !important; outline: none; }
        button { font-family: inherit; }
        button:hover { opacity: 0.88; }
      `}</style>

      {/* Heading */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: C.cr,
          margin: '0 0 5px', letterSpacing: '-0.3px',
        }}>
          New session
        </h1>
        <p style={{ fontSize: 13, color: C.t2, margin: 0, lineHeight: 1.6 }}>
          Personalised explanations, verified comprehension.
        </p>
      </div>

      {/* Streak card */}
      <div style={{
        background: C.surf, border: `1px solid ${C.bdr}`,
        borderRadius: 10, padding: '13px 16px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, marginBottom: 14,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.cr, marginBottom: 2 }}>
            {streak}-day streak
          </div>
          <div style={{ fontSize: 12, color: C.t2 }}>
            Continue learning to maintain it
          </div>
        </div>
        <div style={{
          background: `${C.gold}18`, border: `1px solid ${C.gold}40`,
          borderRadius: 4, padding: '5px 10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.gold }}>
            +15 XP today
          </span>
        </div>
      </div>

      {/* Concept input */}
      <div style={{
        background: C.surf, border: `1px solid ${C.bdr}`,
        borderRadius: 10, padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.t3,
          letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 9,
        }}>
          Topic
        </div>
        <input
          value={concept}
          onChange={e => setConcept(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleStart()}
          placeholder="e.g. backpropagation, recursion, compound interest…"
          style={{
            width: '100%', background: C.s2,
            border: `1px solid ${C.bdr}`,
            borderRadius: 6, padding: '9px 12px',
            fontSize: 14, color: C.t1,
            fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Persona grid */}
      <div style={{
        background: C.surf, border: `1px solid ${C.bdr}`,
        borderRadius: 10, padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: C.t3,
          letterSpacing: '0.7px', textTransform: 'uppercase', marginBottom: 12,
        }}>
          Learning context
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))',
          gap: 8,
        }}>
          {personas.map(p => (
            <button
              key={p.key}
              onClick={() => setPersonaKey(p.key)}
              style={{
                background: personaKey === p.key ? `${p.col}14` : C.s2,
                border: `1.5px solid ${personaKey === p.key ? p.col : C.bdr}`,
                borderRadius: 7, padding: '10px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 5,
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: personaKey === p.key ? p.col : C.t2,
                textAlign: 'center', lineHeight: 1.35,
              }}>
                {p.key}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{
          width: '100%', borderRadius: 7,
          padding: '12px 20px', fontSize: 14, fontWeight: 600,
          cursor: canStart ? 'pointer' : 'not-allowed',
          border: 'none',
          background: canStart ? C.gr : C.s3,
          color: canStart ? C.bg : C.t3,
          letterSpacing: '0.1px', transition: 'all 0.2s',
        }}
      >
        Start session
      </button>

      <div style={{
        textAlign: 'center', marginTop: 9,
        fontSize: 11, color: C.t3, letterSpacing: '0.2px',
      }}>
        XP awarded for every completed session
      </div>
    </div>
  );
}