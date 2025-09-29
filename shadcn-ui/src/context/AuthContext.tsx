import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// ----------------- Types -----------------
export type UserRole = "GOV" | "NGO" | "COMPANY";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (role: UserRole, credentials: { email: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
}


// ----------------- Context -----------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------- Provider -----------------
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Fetch user info if token exists on page load
  // useEffect(() => {
  //   axios
  //     .get("/api/v1/auth/me", { withCredentials: true })
  //     .then((res) => setUser(res.data.user))
  //     .catch(() => setUser(null));
  // }, []);

  // Login function


  useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/v1/auth/me", {
        withCredentials: true, // important to send cookies
      });
      setUser(res.data.user); // backend should return { user: { id, name, role } }
    } catch (err) {
      setUser(null);
    }
  };

  fetchUser();
}, []);

  // ---- AuthProvider.tsx ----
const login = async (role: UserRole, credentials: { email: string; password: string }): Promise<boolean> => {
  try {
    let endpoint =
      role === "GOV"
        ? "http://localhost:4000/api/v1/gov/login"
        : role === "NGO"
        ? "http://localhost:4000/api/v1/ngo/login"
        : "http://localhost:4000/api/v1/company/login";
    const res = await axios.post(endpoint, credentials, { withCredentials: true });
    setUser(res.data.userObj);

    return true; // Now TypeScript is happy
  } catch (err) {
    console.error(err);
    return false;
  }
};

  // Logout function
  const logout = async () => {
    await axios.post("http://localhost:4000/api/v1/auth/logout", {}, { withCredentials: true });
    setUser(null);
    navigate("/");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ----------------- Hook -----------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
