import { useEffect, useState } from "react";
import { Card, Button, Form, Container, Row, Col } from 'react-bootstrap';
import API from "../api";
import AppNavbar from './Navbar';

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

  const calculatePayout = (odds, amount) => {
    if (!amount || isNaN(amount)) return 0;
    if (odds > 0) {
      return ((amount * odds) / 100) + amount;
    } else {
      return ((amount * 100) / Math.abs(odds)) + amount;
    }
  };

  const handleBet = async (gameId, team, odds, betType, key, spread = null, total = null) => {
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
        bet_type: betType,
        ...(betType === "spread" && { spread_value: spread }),   // 🧠 If spread
        ...(betType === "totals" && { total_value: total })      // 🧠 If totals
      });
      alert(`✅ Bet placed: $${amount} on ${team} (${betType})`);

      const resMe = await API.get("/me");
      setBalance(resMe.data.balance);

      setBetInputs((prev) => ({ ...prev, [key]: "" }));
    } catch (err) {
      console.error("❌ Bet error", err);
      alert("Bet failed.");
    }
  };

  return (
    <>
      <AppNavbar balance={balance} />
      <Container className="mt-4">
        <h2 className="mb-4">Upcoming Games</h2>

        <Row xs={1} md={2} lg={2} className="g-4">
          {games.map((g) => (
            <Col key={g.id}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title className="mb-2">{g.teams?.join(" vs ")}</Card.Title>
                  <Card.Subtitle className="mb-3 text-muted">
                    {new Date(g.commence_time).toLocaleString()}
                  </Card.Subtitle>

                  {/* Moneyline */}
                  {g.moneyline?.length > 0 && (
                    <>
                      <h5>Moneyline</h5>
                      {g.moneyline.map((o) => {
                        const inputKey = `${g.id}-moneyline-${o.name}`;
                        const inputAmount = parseFloat(betInputs[inputKey]);
                        return (
                          <div key={o.name} className="d-flex flex-column mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <span className="me-3">{o.name}: {o.price}</span>
                              <Form.Control
                                type="number"
                                placeholder="Amount"
                                value={betInputs[inputKey] || ""}
                                onChange={(e) => handleInputChange(inputKey, e.target.value)}
                                className="me-2"
                                style={{ width: "100px" }}
                              />
                              <Button
                                variant="primary"
                                onClick={() => handleBet(g.id, o.name, o.price, "moneyline", inputKey)}
                              >
                                Bet
                              </Button>
                            </div>
                            {betInputs[inputKey] && (
                              <small className="text-muted">
                                Potential Payout: ${calculatePayout(o.price, inputAmount).toFixed(2)}
                              </small>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Spread */}
                  {g.spread?.length > 0 && (
                    <>
                      <h5 className="mt-3">Spread</h5>
                      {g.spread.map((o) => {
                        const inputKey = `${g.id}-spread-${o.name}`;
                        const inputAmount = parseFloat(betInputs[inputKey]);
                        return (
                          <div key={o.name} className="d-flex flex-column mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <span className="me-3">{o.name}: {o.point} @ {o.price}</span>
                              <Form.Control
                                type="number"
                                placeholder="Amount"
                                value={betInputs[inputKey] || ""}
                                onChange={(e) => handleInputChange(inputKey, e.target.value)}
                                className="me-2"
                                style={{ width: "100px" }}
                              />
                              <Button
                                variant="success"
                                onClick={() => handleBet(g.id, o.name, o.price, "spread", inputKey, o.point)}
                              >
                                Bet
                              </Button>
                            </div>
                            {betInputs[inputKey] && (
                              <small className="text-muted">
                                Potential Payout: ${calculatePayout(o.price, inputAmount).toFixed(2)}
                              </small>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Totals */}
                  {g.totals?.length > 0 && (
                    <>
                      <h5 className="mt-3">Over / Under</h5>
                      {g.totals.map((o) => {
                        const inputKey = `${g.id}-totals-${o.name}`;
                        const inputAmount = parseFloat(betInputs[inputKey]);
                        return (
                          <div key={o.name} className="d-flex flex-column mb-3">
                            <div className="d-flex align-items-center mb-2">
                              <span className="me-3">{o.name} {o.point} @ {o.price}</span>
                              <Form.Control
                                type="number"
                                placeholder="Amount"
                                value={betInputs[inputKey] || ""}
                                onChange={(e) => handleInputChange(inputKey, e.target.value)}
                                className="me-2"
                                style={{ width: "100px" }}
                              />
                              <Button
                                variant="warning"
                                onClick={() => handleBet(g.id, o.name, o.price, "totals", inputKey, null ,o.point)}
                              >
                                Bet
                              </Button>
                            </div>
                            {betInputs[inputKey] && (
                              <small className="text-muted">
                                Potential Payout: ${calculatePayout(o.price, inputAmount).toFixed(2)}
                              </small>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
}
