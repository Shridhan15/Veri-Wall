import { useState } from "react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CreatePolicy from "./pages/CreatePolicy";
import Policies from "./pages/Policies";

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [page, setPage] = useState("dashboard");

  if (!admin) {
    return <Login setAdmin={setAdmin} />;
  }

  let content;

  if (page === "dashboard") content = <Dashboard />;
  if (page === "create") content = <CreatePolicy />;
  if (page === "policies") content = <Policies admin={admin} />;

  return (
    <div>
      <h1>VeriWall Admin Portal</h1>

      <div>
        <button onClick={() => setPage("dashboard")}>Dashboard</button>
        <button onClick={() => setPage("create")}>Create Policy</button>
        <button onClick={() => setPage("policies")}>Policies</button>
      </div>

      {content}
    </div>
  );
}
