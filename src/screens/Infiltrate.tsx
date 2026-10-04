import { useState, type CSSProperties } from "react";
import { EyeIcon, ShieldIcon } from "../components/icons";
import { Objectives } from "../components/Objectives";
import { Button, Explain, MissionTitle, Screen, Typewriter } from "../components/ui";
import { useGame } from "../game/state";
import { sfx } from "../lib/sound";

/** Mission 04: play a card. Public = busted. Shielded = route locked. */
export function Infiltrate() {
  const { go } = useGame();
  const [choice, setChoice] = useState<"public" | "shielded" | null>(null);
  const [attempt, setAttempt] = useState(0);

  const pick = (c: "public" | "shielded") => {
    setChoice(c);
    setAttempt((a) => a + 1);
    if (c === "public") sfx.alert();
    else sfx.confirm();
  };

  return (
    <Screen>
      <MissionTitle code="04" title="Infiltration." accent="Infiltration" status={choice === "shielded" ? "ROUTE LOCKED" : "PLAY A CARD"} />
      <div className="mt-6 max-w-md">
        <Objectives
          items={[
            { label: "Choose a channel", done: choice !== null },
            { label: "Avoid surveillance", done: choice === "shielded" },
          ]}
        />
      </div>
      <div className="mt-10 space-y-10">
        <Typewriter lines={["The intelligence is secure. Now it has to reach your contact.", "Two channels. Play one card, agent."]} />

        <div className="grid gap-8 py-4 sm:grid-cols-2 sm:gap-10">
          <ChannelCard
            key={`p-${choice === "public" ? attempt : 0}`}
            title="Public channel."
            risk="👁 Surveillance risk"
            body="Sender, receiver and amount are written to a public ledger anyone can read — forever."
            icon={<EyeIcon className="h-10 w-10" />}
            face="bg-white"
            ring="ring-in-red"
            riskColor="text-red"
            tilt={-4}
            state={choice === "public" ? "busted" : choice === "shielded" ? "discarded" : "idle"}
            onClick={() => pick("public")}
          />
          <ChannelCard
            title="Shielded channel."
            risk="🔒 Protected"
            body="Transaction details are encrypted. Only you and your contact can see what moved."
            icon={<ShieldIcon className="h-10 w-10" />}
            face="bg-lavender"
            ring="ring-in-violet"
            riskColor="text-violet"
            tilt={4}
            state={choice === "shielded" ? "played" : "idle"}
            onClick={() => pick("shielded")}
          />
        </div>

        {choice === "public" && (
          <div key={attempt} className="ring-in-red animate-shake max-w-2xl rounded-[14px] bg-black p-6">
            <div className="label text-red">✕ Transfer compromised</div>
            <p className="mt-2 font-display text-2xl font-black">Busted. Surveillance saw everything.</p>
            <p className="mt-2 text-[15px] leading-[1.7] text-muted">
              On a public channel they'd see who paid whom and exactly how much. Your contact's cover is blown. Pick up your card and play again.
            </p>
          </div>
        )}

        {choice === "shielded" && (
          <div className="animate-fade-up space-y-8">
            <Explain term="Shielded transactions">
              Zcash lets you send funds with shielded transactions, so sensitive transaction information can remain private.
            </Explain>
            <Button size="xl" onClick={() => go("handoff")}>
              Infiltrate →
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}

function ChannelCard({
  title,
  risk,
  body,
  icon,
  face,
  ring,
  riskColor,
  tilt,
  state,
  onClick,
}: {
  title: string;
  risk: string;
  body: string;
  icon: React.ReactNode;
  face: string;
  ring: string;
  riskColor: string;
  tilt: number;
  state: "idle" | "played" | "busted" | "discarded";
  onClick: () => void;
}) {
  const transform =
    state === "played"
      ? "translateY(-18px) rotate(0deg) scale(1.03)"
      : state === "discarded"
        ? `translateY(10px) rotate(${tilt * 2}deg) scale(0.96)`
        : `rotate(${tilt}deg)`;
  return (
    <button
      onClick={onClick}
      className={`group relative flex aspect-[5/6] flex-col justify-between rounded-[14px] p-7 text-left text-black transition-all duration-300 hover:-translate-y-2 sm:aspect-[5/7] ${face} ${ring} ${
        state === "busted" ? "animate-shake" : ""
      } ${state === "discarded" ? "opacity-40" : ""}`}
      style={{ transform, "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-black text-white">{icon}</div>
        {state === "played" && <span className="label ring-in-violet rounded-[38px] bg-white px-3 py-1 text-[10px] text-violet">Played ✓</span>}
        {state === "busted" && <span className="label ring-in-red rounded-[38px] bg-white px-3 py-1 text-[10px] text-red">Busted ✕</span>}
      </div>
      <div>
        <div className="font-display text-4xl font-black leading-[1] sm:text-5xl">{title}</div>
        <div className={`label mt-3 ${riskColor}`}>{risk}</div>
        <p className="mt-3 text-[15px] leading-[1.6] text-black/75">{body}</p>
      </div>
      <span className="label text-[10px] text-black/40 group-hover:text-black">Play this card →</span>
    </button>
  );
}
