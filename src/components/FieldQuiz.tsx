import { useMemo, useState, type CSSProperties } from "react";
import { useGame } from "../game/state";
import { sfx } from "../lib/sound";

/* One-question cards shown while waiting for a block. Optional, never blocks progress.
 * A correct first answer earns an intel point (stored with game progress). */

type Q = { id: string; q: string; options: string[]; answer: number; why: string };

const BANK: Q[] = [
  {
    id: "shield-hides",
    q: "What does a shielded transaction hide from the public chain?",
    options: ["Sender, receiver and amount", "Only the amount", "Nothing — it's just faster"],
    answer: 0,
    why: "Shielded transactions encrypt who sent, who received and how much.",
  },
  {
    id: "phrase",
    q: "What actually controls your Zcash funds?",
    options: ["Your 24-word recovery phrase", "Your email password", "The faucet that sent them"],
    answer: 0,
    why: "Whoever holds the recovery phrase controls the wallet. Never share it.",
  },
  {
    id: "transparent",
    q: "Who can see the balance of a transparent (t-) address?",
    options: ["Anyone", "Only you", "Only miners"],
    answer: 0,
    why: "Transparent addresses work like Bitcoin: every balance and transfer is public.",
  },
  {
    id: "block",
    q: "Why are we waiting for a block?",
    options: ["A transfer is final once it's in a block", "To earn interest", "To lower the fee"],
    answer: 0,
    why: "Zcash blocks arrive about every 75 seconds; inclusion in one confirms the transfer.",
  },
  {
    id: "zkp",
    q: "What proves a shielded transfer is valid without revealing it?",
    options: ["A zero-knowledge proof", "A screenshot of the wallet", "A list of public signatures"],
    answer: 0,
    why: "Your browser generated a zero-knowledge proof: valid, but revealing nothing.",
  },
  {
    id: "taz",
    q: "What are testnet coins (TAZ) worth?",
    options: ["Nothing — they're for practice", "The same as ZEC", "About half a ZEC"],
    answer: 0,
    why: "Testnet coins have no value, which makes them perfect for training.",
  },
  {
    id: "unshield",
    q: "What does unshielding do?",
    options: ["Moves funds from the shielded pool to a transparent address", "Deletes the transaction", "Doubles the privacy"],
    answer: 0,
    why: "Unshielding makes funds public again — useful when a service only accepts transparent ZEC.",
  },
];

function shuffled<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FieldQuiz() {
  const { progress, update } = useGame();
  const answered = progress.quizDone ?? [];
  const [current, setCurrent] = useState(() => BANK.find((q) => !answered.includes(q.id)) ?? null);
  const [picked, setPicked] = useState<number | null>(null);
  const order = useMemo(() => (current ? shuffled(current.options.map((_, i) => i)) : []), [current]);

  if (!current) {
    return (
      <div className="ring-in-gold rounded-[14px] bg-black p-5">
        <div className="label text-[10px] text-gold">Field quiz complete</div>
        <p className="mt-2 text-[15px] leading-[1.7] text-white/90">
          You've answered every question. Intel points: <span className="font-bold text-white">{progress.intel ?? 0}</span>
        </p>
      </div>
    );
  }

  const correct = picked === current.answer;
  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const ok = i === current.answer;
    if (ok) sfx.confirm();
    else sfx.alert();
    update({ quizDone: [...answered, current.id], intel: (progress.intel ?? 0) + (ok ? 1 : 0) });
  };
  const next = () => {
    const done = [...answered];
    setCurrent(BANK.find((q) => !done.includes(q.id)) ?? null);
    setPicked(null);
  };

  return (
    <div key={current.id} className="ring-in-gold animate-deal rounded-[14px] bg-black p-5 sm:p-6" style={{ "--tilt": "-0.5deg" } as CSSProperties}>
      <div className="flex items-center justify-between gap-3">
        <span className="label text-[10px] text-gold">Field quiz · while you wait</span>
        <span className="label text-[10px] text-dim">★ {progress.intel ?? 0} intel</span>
      </div>
      <p className="mt-3 font-display text-xl font-black leading-snug sm:text-2xl">{current.q}</p>
      <div className="mt-4 grid gap-2.5">
        {order.map((i) => {
          const isAnswer = i === current.answer;
          const isPicked = i === picked;
          const state = picked === null ? "idle" : isAnswer ? "right" : isPicked ? "wrong" : "dim";
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`min-h-12 rounded-[12px] px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                state === "idle"
                  ? "ring-in-ash text-white hover:bg-white/5 active:bg-white/10"
                  : state === "right"
                    ? "bg-white text-black"
                    : state === "wrong"
                      ? "ring-in-red text-red"
                      : "ring-in-ash text-dim"
              }`}
            >
              {state === "right" ? "✓ " : state === "wrong" ? "✕ " : ""}
              {current.options[i]}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 animate-fade-in">
          <p className="text-sm leading-[1.7] text-white/80">
            <span className={`font-bold ${correct ? "text-white" : "text-red"}`}>{correct ? "+1 intel. " : "Not quite. "}</span>
            {current.why}
          </p>
          <button onClick={next} className="label mt-3 text-[11px] text-white underline decoration-pink decoration-2 underline-offset-4">
            Next question →
          </button>
        </div>
      )}
    </div>
  );
}
