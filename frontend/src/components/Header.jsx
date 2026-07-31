import StepNav from './StepNav';
import { C } from '../App';

export default function Header({ stage, xp, level, streak }) {
  const xpPercent = Math.round((xp / 500) * 100);

  return (
    <div style={{
      background: C.surf,
      borderBottom: `1px solid ${C.bdr}`,
      padding: '9px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>

      {/* Wordmark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 90 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 4,
          background: C.gr, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.bg }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: C.cr, letterSpacing: '-0.2px' }}>
          Socratic
        </span>
      </div>

      {/* Step nav — only shown after the input screen */}
      {stage !== 'input' && <StepNav stage={stage} />}

      {/* XP bar + streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', minWidth: 90 }}>

        {/* Level badge + XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            background: C.gold, color: '#1A1200',
            borderRadius: 4, padding: '2px 6px',
            fontSize: 11, fontWeight: 700,
          }}>
            Lv {level}
          </div>
          <div>
            <div style={{
              background: C.s3, borderRadius: 2,
              height: 4, width: 56, overflow: 'hidden',
            }}>
              <div style={{
                width: `${xpPercent}%`, height: 4,
                background: C.gr, borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: 10, color: C.t3, marginTop: 2 }}>
              {xp}/500 XP
            </div>
          </div>
        </div>

        {/* Streak badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: C.s2, border: `1px solid ${C.bdr}`,
          borderRadius: 4, padding: '3px 8px',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: C.amb }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: C.cr }}>{streak}</span>
          <span style={{ fontSize: 11, color: C.t2 }}>day streak</span>
        </div>

      </div>
    </div>
  );
}