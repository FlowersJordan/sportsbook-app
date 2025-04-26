import { useEffect, useState } from "react";
import API from "../api";

export default function Games() {
  const [games, setGames] = useState([]);
  const [betInputs, setBetInputs] = useState({}); // store bet amounts by outcome ID

  useEffect(() => {
    const load = async () => {
      const res = await API.get("/games?sport=basketball_nba&bookmaker=fanduel");
      setGames(res.data);
    };
    load();
  }, []);

  const handleInputChange = (key, value) => {
    setBetInputs((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleBet = async (gameId, team, odds, betType, key) => {
    const amount = parseFloat(betInputs[key]);
    if (!amount || amount <= 0) return alert("Enter a valid amount");

    try {
      await API.post("/bets", {
        game_id: gameId,
        team,
        odds,
        amount,
        bet_type: betType
      });
      alert(`✅ Bet placed: $${amount} on ${team} (${betType})`);
      setBetInputs((prev) => ({ ...prev, [key]: "" }));
    } catch (err) {
      console.error("❌ Bet failed", err);
      alert("Bet failed.");
    }
  };

  return (
    <div>
      <h2>Upcoming Games</h2>
      {games.map((g) => (
        <div key={g.id} style={{ border: "1px solid #ccc", padding: 10, marginBottom: 10 }}>
          <p><strong>{g.teams?.join(" vs ")}</strong></p>
          <p><em>{new Date(g.commence_time).toLocaleString()}</em></p>

          {/* Moneyline */}
          {g.moneyline?.length > 0 && (
            <div>
              <h4>Moneyline</h4>
              {g.moneyline.map((o) => {
                const inputKey = `${g.id}-moneyline-${o.name}`;
                return (
                  <div key={o.name}>
                    <span>{o.name}: {o.price}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={betInputs[inputKey] || ""}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      style={{ marginLeft: "10px", width: "80px" }}
                    />
                    <button
                      onClick={() => handleBet(g.id, o.name, o.price, "moneyline", inputKey)}
                      style={{ marginLeft: "10px" }}
                    >
                      Bet
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Spread */}
          {g.spread?.length > 0 && (
            <div>
              <h4>Spread</h4>
              {g.spread.map((o) => {
                const inputKey = `${g.id}-spread-${o.name}`;
                return (
                  <div key={o.name}>
                    <span>{o.name}: {o.point} @ {o.price}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={betInputs[inputKey] || ""}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      style={{ marginLeft: "10px", width: "80px" }}
                    />
                    <button
                      onClick={() => handleBet(g.id, o.name, o.price, "spread", inputKey)}
                      style={{ marginLeft: "10px" }}
                    >
                      Bet
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          {g.totals?.length > 0 && (
            <div>
              <h4>Over / Under</h4>
              {g.totals.map((o) => {
                const inputKey = `${g.id}-totals-${o.name}`;
                return (
                  <div key={o.name}>
                    <span>{o.name} {o.point} @ {o.price}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={betInputs[inputKey] || ""}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      style={{ marginLeft: "10px", width: "80px" }}
                    />
                    <button
                      onClick={() => handleBet(g.id, o.name, o.price, "totals", inputKey)}
                      style={{ marginLeft: "10px" }}
                    >
                      Bet
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


