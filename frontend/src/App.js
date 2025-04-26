import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./components/Login";
import Games from "./components/Games";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/games" element={<Games />} />
      </Routes>
    </Router>
  );
}

export default App;

