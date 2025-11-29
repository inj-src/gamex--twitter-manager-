import { useEffect, useState } from "react";
import reactLogo from "@/assets/react.svg";
import wxtLogo from "/wxt.svg";
import "./App.css";
import dayjs from "dayjs";
import { getState, setTargets, resetForDate } from "../../lib/storage";

// Use the global `browser` type from WXT

function App() {
  const [state, setState] = useState<any>(null);
  const [targets, setLocalTargets] = useState({ tweets: 5, replies: 50 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getState();
      if (!mounted) return;
      setState(s);
      setLocalTargets(s.targets || { tweets: 5, replies: 50 });
    })();
    browser.runtime.onMessage.addListener((m: any) => {
      if (m?.type === "stateChanged" && m.state) {
        setState(m.state);
      }
    });
    return () => {
      mounted = false;
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

  return (
    <>
      <h1>Tweet/Reply Tracker</h1>
      <div className="card">
        <div className="stats">
          <div className="stat">
            <div className="label">Tweets Today</div>
            <div className="value">
              {state?.daily?.tweets ?? 0} / {state?.targets?.tweets ?? 5}
            </div>
          </div>
          <div className="stat">
            <div className="label">Replies Today</div>
            <div className="value">
              {state?.daily?.replies ?? 0} / {state?.targets?.replies ?? 50}
            </div>
          </div>
        </div>
        <div className="controls">
          <div>
            <label>Tweets target</label>
            <input
              type="number"
              value={targets.tweets}
              onChange={(e) => onUpdateTargets({ ...targets, tweets: Number(e.target.value) })}
            />
          </div>
          <div>
            <label>Replies target</label>
            <input
              type="number"
              value={targets.replies}
              onChange={(e) => onUpdateTargets({ ...targets, replies: Number(e.target.value) })}
            />
          </div>
          <div>
            <button onClick={onReset}>Reset Today</button>
          </div>
        </div>
        <p>
          Edit <code>entrypoints/popup/App.tsx</code> to customize UI
        </p>
        <div className="history">
          <h3>History (last 7 days)</h3>
          <ul>
            {(
              state &&
              Object.keys(state.history || {})
                .sort()
                .slice(-7)
                .reverse()
            )?.map((d: string) => (
              <li key={d}>
                <strong>{d}</strong>: {state.history[d].tweets} tweets, {state.history[d].replies}{" "}
                replies
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default App;
