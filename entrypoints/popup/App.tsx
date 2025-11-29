import { useEffect, useState } from "react";
import "./App.css";
import dayjs from "dayjs";
import { getState, setTargets, resetForDate } from "../../lib/storage";
import type { State } from "../../lib/types";

// Use the global `browser` type from WXT

function App() {
  const [state, setState] = useState<State | null>(null);
  const [targets, setLocalTargets] = useState({ tweets: 5, replies: 50 });

  useEffect(() => {
    let mounted = true;

    const loadState = async () => {
      const s = await getState();
      if (!mounted) return;
      setState(s);
      setLocalTargets(s.targets || { tweets: 5, replies: 50 });
    };

    loadState();

    const handleMessage = (m: any) => {
      if (m?.type === "stateChanged" && m.state) {
        setState(m.state);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      mounted = false;
      browser.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  function onUpdateTargets(newTargets: { tweets: number; replies: number }) {
    setLocalTargets(newTargets);
    setTargets(newTargets.tweets, newTargets.replies);
  }

  async function onReset() {
    await resetForDate(dayjs().format("YYYY-MM-DD"));
    const s = await getState();
    setState(s);
  }

  const historyDates = state?.history ? Object.keys(state.history).sort().slice(-7).reverse() : [];

  return (
    <>
      <h1>Tweet/Reply Tracker</h1>
      <div className="card">
        <div className="stats">
          <StatBox
            label="Tweets Today"
            current={state?.daily?.tweets ?? 0}
            target={state?.targets?.tweets ?? 5}
          />
          <StatBox
            label="Replies Today"
            current={state?.daily?.replies ?? 0}
            target={state?.targets?.replies ?? 50}
          />
        </div>

        <div className="time-stat">
          <div className="label">Time on X Today</div>
          <div className="value">{formatTime(state?.daily?.seconds ?? 0)}</div>
        </div>

        <div className="controls">
          <TargetInput
            label="Tweets target"
            value={targets.tweets}
            onChange={(val) => onUpdateTargets({ ...targets, tweets: val })}
          />
          <TargetInput
            label="Replies target"
            value={targets.replies}
            onChange={(val) => onUpdateTargets({ ...targets, replies: val })}
          />
          <div>
            <button onClick={onReset}>Reset Today</button>
          </div>
        </div>

        <div className="history">
          <h3>History (last 7 days)</h3>
          <ul>
            {historyDates.map((d) => (
              <li key={d}>
                <strong>{d}</strong>: {state!.history[d].tweets} tweets, {state!.history[d].replies}{" "}
                replies, {formatTime(state!.history[d].seconds ?? 0)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function StatBox({ label, current, target }: { label: string; current: number; target: number }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">
        {current} / {target}
      </div>
    </div>
  );
}

function TargetInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <label>{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default App;
