import { useState, useEffect } from 'react';
import { fetchPersonas } from './api';
import Header from './components/Header';
import InputScreen from './screens/InputScreen';
import ExplainingScreen from './screens/ExplainingScreen';
import ExplainedScreen from './screens/ExplainedScreen';
import QuizScreen from './screens/QuizScreen';
import ReportScreen from './screens/ReportScreen';

// ── Design tokens ──────────────────────────────────────────────────────────────
export const C = {
  bg: '#0B1612', surf: '#142318', s2: '#1E3528', s3: '#283F34', bdr: '#2B4A38',
  gr: '#52B788', grl: '#74C69D',
  cr: '#FEFAE0', crm: '#A8C4A0',
  gold: '#E9C46A', red: '#E76F51', amb: '#F4A261', pur: '#9B8FD4',
  t1: '#FEFAE0', t2: '#8BAE98', t3: '#4E7060',
};

// ── App ────────────────────────────────────────────────────────────────────────
export default function App() {

  // ── Stage router state ──────────────────────────────────────────────────────
  // Tracks which screen to render. Transitions happen by calling setStage().
  const [stage, setStage] = useState('input');

  // ── Shared data state ───────────────────────────────────────────────────────
  // Everything the screens need — flows from one screen to the next.
  const [personas, setPersonas]         = useState([]);
  const [concept, setConcept]           = useState('');
  const [personaKey, setPersonaKey]     = useState('');
  const [explanationText, setExplanationText] = useState('');
  const [quiz, setQuiz]                 = useState(null);   // {questions: [...]}
  const [userAnswers, setUserAnswers]   = useState(['', '', '']);
  const [report, setReport]             = useState(null);

  // ── XP + streak (gamification) ─────────────────────────────────────────────
  const [xp, setXp]       = useState(340);
  const [streak]          = useState(7);
  const [level]           = useState(4);

  // ── Load personas on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchPersonas()
      .then(data => {
        setPersonas(data.personas);
        if (data.personas.length > 0) {
          setPersonaKey(data.personas[1].key); // default: second persona
        }
      })
      .catch(err => console.error('Failed to load personas:', err));
  }, []);

  // ── Reset — clears all session state and returns to input ───────────────────
  function reset() {
    setStage('input');
    setConcept('');
    setPersonaKey(personas[1]?.key ?? '');
    setExplanationText('');
    setQuiz(null);
    setUserAnswers(['', '', '']);
    setReport(null);
  }

  // ── Shared props passed to every screen ─────────────────────────────────────
  const shared = {
    // State
    personas, concept, setConcept,
    personaKey, setPersonaKey,
    explanationText, setExplanationText,
    quiz, setQuiz,
    userAnswers, setUserAnswers,
    report, setReport,
    xp, setXp, streak, level,
    // Navigation
    setStage, reset,
  };

  // ── Global page styles ───────────────────────────────────────────────────────
  const pageStyle = {
    minHeight: '100vh',
    background: C.bg,
    color: C.t1,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  };

  // ── Stage router ─────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <Header stage={stage} xp={xp} level={level} streak={streak} />
      <div style={{ maxWidth: 660, margin: '0 auto', padding: '24px 20px 60px' }}>
        {stage === 'input'      && <InputScreen {...shared} />}
        {stage === 'explaining' && <ExplainingScreen {...shared} />}
        {stage === 'explained'  && <ExplainedScreen {...shared} />}
        {stage === 'quiz'       && <QuizScreen {...shared} />}
        {stage === 'report'     && <ReportScreen {...shared} />}
      </div>
    </div>
  );
}