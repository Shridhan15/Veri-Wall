import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import CreatePolicy from "./pages/CreatePolicy";
import Policies from "./pages/Policies";
import Login from "./pages/Login";
import ActivityLogs from "./pages/ActivityLogs";

function App() {
  // Store user as an object: { role: 'admin', name: 'admin1' }
  const [user, setUser] = useState(null);

  const handleLogin = (role, name) => {
    setUser({ role, name });
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-950">
        {/* Navbar only shows if a user is logged in */}
        {user && <Navbar user={user} onLogout={handleLogout} />}

        <main className="container mx-auto">
          <Routes>
            {/* 1. Login Route: If logged in, go to dashboard. If not, show Login */}
            <Route
              path="/"
              element={
                user ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />

            {/* 2. Dashboard: Shared by all roles */}
            <Route
              path="/dashboard"
              element={
                user ? (
                  <Dashboard adminName={user.name} userRole={user.role} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* 3. Create Policy: STRICTLY for Admins */}
            <Route
              path="/create"
              element={
                user?.role === "admin" ? (
                  <CreatePolicy adminName={user.name} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* 4. Policy Governance: STRICTLY for Admins & Verifiers */}
            <Route
              path="/policies"
              element={
                user?.role === "admin" || user?.role === "verifier" ? (
                  <Policies userRole={user.role} adminName={user.name} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* 5. SIEM Activity Logs: STRICTLY for Auditors */}
            <Route
              path="/logs"
              element={
                user?.role === "auditor" ? (
                  <ActivityLogs />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
