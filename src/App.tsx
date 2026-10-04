import { CardScatter } from "./components/CardScatter";
import { StatusBar, TopBar } from "./components/Hud";
import { UnlockToast } from "./components/Unlock";
import { ErrorPanel } from "./components/ErrorPanel";
import { Button } from "./components/ui";
import { GameProvider, useGame, useSnapshot } from "./game/state";
import { Acquire } from "./screens/Acquire";
import { Bonus } from "./screens/Bonus";
import { Briefing } from "./screens/Briefing";
import { Complete } from "./screens/Complete";
import { Handoff } from "./screens/Handoff";
import { Infiltrate } from "./screens/Infiltrate";
import { Safehouse } from "./screens/Safehouse";
import { Shield } from "./screens/Shield";

const SCREENS = {
  briefing: Briefing,
  safehouse: Safehouse,
  acquire: Acquire,
  shield: Shield,
  infiltrate: Infiltrate,
  handoff: Handoff,
  complete: Complete,
  bonus: Bonus,
};

function BootError() {
  const { progress, setMode } = useGame();
  const s = useSnapshot();
  if (s.status !== "error" || progress.step === "briefing" || progress.step === "safehouse") return null;
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pt-8 sm:px-6">
      <ErrorPanel
        error={s.bootError}
        context="safehouse connection"
        onRetry={() => location.reload()}
        extra={
          <Button variant="ink" size="md" onClick={() => setMode("demo")}>
            Switch to demo mode
          </Button>
        }
      />
    </div>
  );
}

function Game() {
  const { progress } = useGame();
  const Current = SCREENS[progress.step] ?? Briefing;
  return (
    <>
      <div className="relative min-h-dvh">
        <TopBar />
        <BootError />
        <main key={`${progress.step}:${progress.mode}`} className="relative">
          {progress.step !== "briefing" && progress.step !== "complete" && <CardScatter />}
          <Current />
        </main>
        <StatusBar />
        <UnlockToast />
      </div>
      <div className="scanlines" />
    </>
  );
}

export function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
