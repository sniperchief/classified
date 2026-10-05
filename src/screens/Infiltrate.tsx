import { useState, type CSSProperties } from "react";
import { EyeIcon, ShieldIcon } from "../components/icons";
import { Button, MissionTitle, Screen, Typewriter } from "../components/ui";
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
      <MissionTitle
        code="04"
        title="Infiltration."
        accent="Infiltration"
        status={choice === "shielded" ? "ROUTE LOCKED" : "PLAY A CARD"}
        info={{
          term: "Shielded transactions",
          body: "Zcash lets you send funds with shielded transactions, so sensitive transaction information — sender, receiver and amount — can remain private.",
        }}
      />
      <div className="mt-8 space-y-8">
        <Typewriter lines={["Two channels to your contact. Play one card."]} />

        <div className="mx-auto grid max-w-xl grid-cols-2 gap-4 py-2 sm:gap-6">
          <ChannelCard
            key={`p-${choice === "public" ? attempt : 0}`}
            title="Public channel."
            risk="👁 Surveillance risk"
            body="Sender, receiver and amount: public, forever."
            icon={<EyeIcon className="h-6 w-6 sm:h-7 sm:w-7" />}
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
            body="Encrypted. Only you and your contact know."
            icon={<ShieldIcon className="h-6 w-6 sm:h-7 sm:w-7" />}
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
            <p className="mt-2 font-display text-2xl font-black">Busted. They saw who, what and how much.</p>
          </div>
        )}

        {choice === "shielded" && (
          <div className="animate-fade-up">
            <Button size="xl" onClick={() => go("handoff")} className="w-full sm:w-auto">
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
      className={`group relative flex aspect-[3/4] flex-col justify-between rounded-[14px] p-3.5 text-left text-black transition-all duration-300 hover:-translate-y-2 sm:p-5 ${face} ${ring} ${
        state === "busted" ? "animate-shake" : ""
      } ${state === "discarded" ? "opacity-40" : ""}`}
      style={{ transform, "--tilt": `${tilt}deg` } as CSSProperties}
    >
      <div className="flex items-start justify-between">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-black text-white sm:h-12 sm:w-12">{icon}</div>
        {state === "played" && <span className="label ring-in-violet rounded-[38px] bg-white px-2 py-0.5 text-[9px] text-violet sm:px-3 sm:py-1 sm:text-[10px]">Played ✓</span>}
        {state === "busted" && <span className="label ring-in-red rounded-[38px] bg-white px-2 py-0.5 text-[9px] text-red sm:px-3 sm:py-1 sm:text-[10px]">Busted ✕</span>}
      </div>
      <div>
        <div className="font-display text-xl font-black leading-[1.05] sm:text-3xl">{title}</div>
        <div className={`label mt-2 text-[9px] sm:text-[11px] ${riskColor}`}>{risk}</div>
        <p className="mt-2 text-[12px] leading-[1.45] text-black/75 sm:text-sm">{body}</p>
      </div>
      <span className="label text-[9px] text-black/40 group-hover:text-black sm:text-[10px]">Play this card →</span>
    </button>
  );
}
