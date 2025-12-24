// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // IMPORTANT: must match what Login.tsx stores
  const token = typeof window !== "undefined"
    ? localStorage.getItem("auth_token")
    : null;

  if (!token) {
    // Not logged in -> send to login
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
