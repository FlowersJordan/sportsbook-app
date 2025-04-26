// src/components/Login.js
import { useState } from "react";
import API from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log("Attempting Login", username)
    const form = new FormData();
    form.append("username", username);
    form.append("password", password);

    try {
      const res = await API.post("/login", form);
      localStorage.setItem("token", res.data.access_token);
      navigate("/games");
    } catch (err) {
      alert("Login failed");
      console.error("❌ Login error:", err);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Login</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleLogin}>Log In</button>
    </div>
  );
}

