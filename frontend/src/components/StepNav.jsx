import { C } from '../App';

const STEPS = ['input', 'explained', 'quiz', 'report'];
const LABELS = ['Topic', 'Learn', 'Quiz', 'Results'];

export default function StepNav({ stage }) {
  // 'explaining' maps to the same visual position as 'explained'
  const activeIndex = STEPS.indexOf(
    stage === 'explaining' ? 'explained' : stage
  );

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {STEPS.map((step, i) => (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>

          {/* Step circle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: i <= activeIndex ? C.gr : C.s3,
              border: `2px solid ${i === activeIndex ? C.grl : 'transparent'}`,
              color: i <= activeIndex ? C.bg : C.t3,
              transition: 'all 0.3s ease',
            }}>
              {i < activeIndex ? '✓' : i + 1}
            </div>
            <span style={{
              fontSize: 11,
              color: i <= activeIndex ? C.gr : C.t3,
              fontWeight: i === activeIndex ? 600 : 400,
            }}>
              {LABELS[i]}
            </span>
          </div>

          {/* Connector line between steps */}
          {i < STEPS.length - 1 && (
            <div style={{
              width: 28, height: 1,
              margin: '0 3px', marginBottom: 14,
              background: i < activeIndex ? C.gr : C.bdr,
              transition: 'background 0.3s ease',
            }} />
          )}

        </div>
      ))}
    </div>
  );
}