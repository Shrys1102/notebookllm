import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { DEMO_MODE } from "./utils/constants.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import SignInPage from "./pages/SignInPage.jsx";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  // In demo mode the workspace is always available — no login gate.
  if (DEMO_MODE) return children;
  return user ? children : <Navigate to="/signin" replace />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/signin" element={user ? <Navigate to="/" replace /> : <SignInPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? "/" : "/signin"} replace />} />
    </Routes>
  );
}
