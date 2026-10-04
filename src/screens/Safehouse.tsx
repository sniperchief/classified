import { useState, type CSSProperties } from "react";
import { ErrorPanel } from "../components/ErrorPanel";
import { HouseIcon } from "../components/icons";
import { Button, Check, CopyField, Explain, MissionTitle, Panel, PlayingCard, Screen, Stamp, Typewriter } from "../components/ui";
import { useGame, useSnapshot } from "../game/state";
import { sfx } from "../lib/sound";

type View = "intro" | "phrase" | "established";

const input = "w-full rounded-[14px] bg-black p-4 font-mono text-sm text-white placeholder:text-dim ring-in-white";

export function Safehouse() {
  const { engine, go, setMode, progress } = useGame();
  const s = useSnapshot();
  const [phrase, setPhrase] = useState<string | null>(null);
  const [view, setView] = useState<View>(s.hasWallet ? "established" : "intro");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [secured, setSecured] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreText, setRestoreText] = useState("");
  const [restoreHeight, setRestoreHeight] = useState("");
  const demo = progress.mode === "demo";

  const booting = !engine || s.status === "booting" || s.status === "idle";
  const currentView: View = s.hasWallet && view === "intro" ? "established" : view;

  const create = async () => {
    if (!engine) return;
    setBusy(true);
    setError(null);
    try {
      const p = await engine.createWallet();
      setPhrase(p);
      setView("phrase");
      sfx.confirm();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!engine) return;
    setBusy(true);
    setError(null);
    try {
      const h = parseInt(restoreHeight, 10);
      await engine.restoreWallet(restoreText, Number.isFinite(h) && h > 0 ? h : undefined);
      setView("established");
      sfx.success();
      engine.startAutoSync();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const confirmPhrase = () => {
    sfx.success();
    setView("established");
    engine?.startAutoSync();
  };

  return (
    <Screen>
      <MissionTitle code="01" title="Establish the safehouse." accent="safehouse" status={currentView === "established" ? "COMPLETE" : "ACTIVE"} />

      {currentView === "intro" && (
        <div className="mt-10 space-y-10">
          <Typewriter lines={["Before moving the intelligence, you need a secure digital safehouse.", "Everything you do from here runs through it."]} />
          <Explain
            term="What is a wallet?"
            more={
              <>
                This is a real Zcash light wallet (WebZjs / librustzcash compiled to WebAssembly) running inside this page. It generates a 24-word
                recovery phrase, derives your keys from it, and scans the Zcash {demo ? "network (simulated in demo mode)" : "testnet"} for your funds
                through a lightwalletd relay. Your keys never leave this browser.
              </>
            }
          >
            A Zcash wallet holds the keys that control your funds. Yours is created right here, in your browser — nobody else gets a copy.
          </Explain>

          {s.status === "error" ? (
            <ErrorPanel
              error={s.bootError}
              context="safehouse setup"
              onRetry={() => location.reload()}
              extra={
                <Button variant="ink" size="md" onClick={() => setMode("demo")}>
                  Switch to demo mode
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <Button size="xl" onClick={create} loading={busy || booting} disabled={booting}>
                {booting ? "Initializing enclave" : busy ? "Building safehouse" : "Establish safehouse"}
              </Button>
              <button className="label text-[11px] text-dim underline-offset-4 hover:text-white hover:underline" onClick={() => setRestoreOpen(!restoreOpen)}>
                {restoreOpen ? "− Cancel restore" : "Restore a testnet safehouse"}
              </button>
            </div>
          )}

          {restoreOpen && !booting && (
            <Panel className="animate-fade-up max-w-2xl space-y-4 p-6">
              <div className="label text-muted">Restore from recovery codes (testnet only)</div>
              <textarea
                className={`${input} h-28 resize-none`}
                placeholder="24-word recovery phrase"
                value={restoreText}
                onChange={(e) => setRestoreText(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <input
                className={input}
                placeholder="Wallet birthday block height (optional)"
                inputMode="numeric"
                value={restoreHeight}
                onChange={(e) => setRestoreHeight(e.target.value.replace(/\D/g, ""))}
              />
              <Button variant="outline" size="md" onClick={restore} loading={busy} disabled={!restoreText.trim()}>
                Restore safehouse
              </Button>
            </Panel>
          )}

          {error != null && <ErrorPanel error={error} context="safehouse setup" onRetry={() => setError(null)} />}
        </div>
      )}

      {currentView === "phrase" && phrase && (
        <div className="mt-10 space-y-8">
          <Typewriter lines={["Safehouse keys generated. These 24 words are your recovery codes."]} />
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="label text-gold">Recovery codes // eyes only</span>
              <span className="label text-[10px] text-dim">{demo ? "Demo — not a real wallet" : "Testnet training wallet"}</span>
            </div>
            <ol className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
              {phrase.split(" ").map((w, i) => (
                <li
                  key={i}
                  className="ring-in-black animate-deal flex flex-col rounded-[10px] bg-white px-3 py-2.5 text-black"
                  style={{ "--tilt": `${((i * 37) % 7) - 3}deg`, animationDelay: `${i * 45}ms` } as CSSProperties}
                >
                  <span className="font-mono text-[10px] font-bold text-black/40">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[15px] font-extrabold">{w}</span>
                </li>
              ))}
            </ol>
          </div>
          <p className="max-w-2xl text-[15px] leading-[1.7] text-muted">
            <span className="font-extrabold text-white">Anyone who has these words controls the funds.</span> In a real mission you'd write them
            down offline and never share them. For this testnet training they're also kept in this browser so the mission survives a reload.
          </p>
          <label className="flex cursor-pointer items-center gap-3 font-mono text-sm font-semibold">
            <input type="checkbox" className="h-5 w-5 accent-[#ee1f66]" checked={secured} onChange={(e) => setSecured(e.target.checked)} />
            I understand these codes are the master key.
          </label>
          <Button size="xl" onClick={confirmPhrase} disabled={!secured}>
            Seal the safehouse
          </Button>
        </div>
      )}

      {currentView === "established" && (
        <div className="mt-10 space-y-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <PlayingCard face="lavender" accent="violet" tilt={-4} deal className="flex h-56 w-44 shrink-0 flex-col justify-between">
              <span className="font-mono text-[10px] font-bold">01</span>
              <HouseIcon className="mx-auto h-16 w-16" />
              <span className="text-center font-display text-lg font-black uppercase leading-tight">Safehouse</span>
            </PlayingCard>
            <div className="space-y-5">
              <Stamp tone="violet">Safehouse established</Stamp>
              <div className="space-y-3">
                <Check>Secure wallet ready</Check>
                <Check>Keys stored only on this device</Check>
                <Check>Connected to the Zcash {demo ? "network (simulated)" : "testnet"}</Check>
              </div>
            </div>
          </div>
          {s.agent && (
            <div className="max-w-3xl space-y-3">
              <CopyField label="Your shielded address (unified)" value={s.agent.unified} tone="violet" />
              <p className="text-sm leading-[1.7] text-muted">
                Unified addresses can receive privately. Your wallet also has a <span className="text-white">public</span> (transparent) address —
                you'll need it next.
              </p>
            </div>
          )}
          <Button size="xl" onClick={() => go("acquire")}>
            Next mission →
          </Button>
        </div>
      )}
    </Screen>
  );
}
