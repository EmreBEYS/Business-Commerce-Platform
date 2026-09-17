import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_URL } from "../../lib/catalogApi";

function ProtectedAdminRoute({ children }) {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        setStatus(response.ok ? "authorized" : "unauthorized");
      } catch {
        setStatus("unauthorized");
      }
    };

    checkAdmin();
  }, []);

  if (status === "loading") {
    return <div>Admin oturumu kontrol ediliyor...</div>;
  }

  if (status === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;
