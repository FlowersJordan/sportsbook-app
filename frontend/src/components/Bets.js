import { useEffect, useState } from "react";
import { Card, Container, Row, Col } from 'react-bootstrap';
import API from "../api";
import AppNavbar from './Navbar';

export default function Bets() {
  const [bets, setBets] = useState([]);

  useEffect(() => {
    const load = async () => {
      const res = await API.get("/bets/me");
      setBets(res.data);
    };
    load();
  }, []);

  return (
    <>
      <AppNavbar />
      <Container className="mt-4">
        <h2 className="mb-4">My Pending Bets</h2>

        {bets.length === 0 ? (
          <p>No pending bets yet.</p>
        ) : (
          <Row xs={1} md={2} lg={2} className="g-4">
            {bets.map((bet, index) => (
              <Col key={index}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title>{bet.team} ({bet.bet_type})</Card.Title>
                    <Card.Subtitle className="mb-2 text-muted">
                      Odds: {bet.odds}
                    </Card.Subtitle>
                    <Card.Text>
                      Wagered: <strong>${bet.amount.toFixed(2)}</strong><br />
                      Potential Payout: <strong>${bet.potential_payout.toFixed(2)}</strong><br />
                      Status: <span className="badge bg-warning text-dark">{bet.resolved ? (bet.won ? "Won" : "Lost") : "Pending"}</span>
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
}
