import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Games from "./components/Games";
import Bets  from "./components/Bets";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/games" element={<Games />} />
        <Route path="/bets" element={<Bets />} />
      </Routes>
    </Router>
  );
}

export default App;

