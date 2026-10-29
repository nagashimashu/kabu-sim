import { useGame } from './store/game';
import TitlePage from './pages/TitlePage';
import GamePage from './pages/GamePage';
import ResultPage from './pages/ResultPage';

export default function App() {
  const screen = useGame((s) => s.screen);
  if (screen === 'game') return <GamePage />;
  if (screen === 'result') return <ResultPage />;
  return <TitlePage />;
}
