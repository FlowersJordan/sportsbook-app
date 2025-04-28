import { useEffect, useState } from "react";
import API from "../api";

export default function Games() {
  const [games, setGames] = useState([]);
  const [balance, setBalance] = useState(null);
  const [betInputs, setBetInputs] = useState({});

  useEffect(() => {
    const load = async () => {
      const resGames = await API.get("/games?sport=basketball_nba&bookmaker=fanduel");
      setGames(resGames.data);

      const resMe = await API.get("/me");
      setBalance(resMe.data.balance);
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

    if (amount > balance) {
      alert("❌ Insufficient funds for this bet!");
      return;
    }

    try {
      await API.post("/bets", {
        game_id: gameId,
        team,
        odds,
        amount,
        bet_type: betType
      });
      alert(`✅ Bet placed: $${amount} on ${team} (${betType})`);

      // Refresh balance after bet
      const resMe = await API.get("/me");
      setBalance(resMe.data.balance);

      setBetInputs((prev) => ({ ...prev, [key]: "" }));
    } catch (err) {
      console.error("❌ Bet error", err);
      alert("Bet failed.");
    }
  };

  return (
    <div className="p-4">

      {balance !== null && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Available Balance: ${balance.toFixed(2)}</h3>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Upcoming Games</h2>

      {games.map((g) => (
        <div key={g.id} className="border rounded-lg p-4 mb-6 shadow-md">
          <p className="text-lg font-bold">{g.teams?.join(" vs ")}</p>
          <p className="text-gray-600"><em>{new Date(g.commence_time).toLocaleString()}</em></p>

          {/* Moneyline */}
          {g.moneyline?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold">Moneyline</h4>
              {g.moneyline.map((o) => {
                const inputKey = `${g.id}-moneyline-${o.name}`;
                return (
                  <div key={o.name} className="flex items-center space-x-4 my-2">
                    <span>{o.name}: {o.price}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={betInputs[inputKey] || ""}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      className="border p-1 w-24 rounded"
                    />
                    <button
                      onClick={() => handleBet(g.id, o.name, o.price, "moneyline", inputKey)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
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
            <div className="mt-4">
              <h4 className="font-semibold">Spread</h4>
              {g.spread.map((o) => {
                const inputKey = `${g.id}-spread-${o.name}`;
                return (
                  <div key={o.name} className="flex items-center space-x-4 my-2">
                    <span>{o.name}: {o.point} @ {o.price}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={betInputs[inputKey] || ""}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      className="border p-1 w-24 rounded"
                    />
                    <button
                      onClick={() => handleBet(g.id, o.name, o.price, "spread", inputKey)}
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
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
            <div className="mt-4">
              <h4 className="font-semibold">Over / Under</h4>
              {g.totals.map((o) => {
                const inputKey = `${g.id}-totals-${o.name}`;
                return (
                  <div key={o.name} className="flex items-center space-x-4 my-2">
                    <span>{o.name} {o.point} @ {o.price}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={betInputs[inputKey] || ""}
                      onChange={(e) => handleInputChange(inputKey, e.target.value)}
                      className="border p-1 w-24 rounded"
                    />
                    <button
                      onClick={() => handleBet(g.id, o.name, o.price, "totals", inputKey)}
                      className="bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600"
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
