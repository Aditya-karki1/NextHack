import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function LoginNGO() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/ngo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Missing fields", description: "Please fill all fields" });
      return;
    }

    setLoading(true);
    try {
      const success = await login("NGO", { email, password });
      if (success) {
        navigate(from, { replace: true });
      } else {
        toast({ title: "Login failed", description: "Check your credentials." });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Login failed", description: "Check your credentials." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-cover bg-center animate-hue-rotate"
          style={{
            backgroundImage:
              "url('https://31.media.tumblr.com/41c01e3f366d61793e5a3df70e46b462/tumblr_n4vc8sDHsd1st5lhmo1_1280.jpg')",
            filter: "grayscale(30%)",
          }}
        ></div>
        <div className="absolute inset-0 bg-black/60"></div> {/* overlay */}
      </div>

      {/* Login form */}
      <div className="relative z-10 w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-lg shadow-lg text-white">
        <h2 className="text-2xl font-bold mb-6 text-center">NGO Portal Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg font-semibold ${
              loading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/80">
          New here?{" "}
          <Link to="/register-ngo" className="text-blue-400 font-medium hover:underline">
            Register
          </Link>
        </p>
      </div>

      {/* Tailwind animation */}
      <style>{`
        @keyframes hue-rotate {
          0% { filter: grayscale(30%) hue-rotate(0deg); }
          100% { filter: grayscale(30%) hue-rotate(360deg); }
        }
        .animate-hue-rotate {
          animation: hue-rotate 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
