import { useState, FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";

export default function LoginGov() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/government";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const success = await login("GOV", { email, password });
      if (success) {
        navigate(from);
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
            backgroundImage: "url('https://31.media.tumblr.com/41c01e3f366d61793e5a3df70e46b462/tumblr_n4vc8sDHsd1st5lhmo1_1280.jpg')",
            filter: "grayscale(30%)",
          }}
        ></div>
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row bg-white/10 backdrop-blur-md rounded-lg shadow-lg overflow-hidden">
        {/* Left panel: Project Info */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center text-white">
          <h1 className="text-4xl font-bold mb-4">EcoChain</h1>
          <h2 className="text-2xl mb-6">Government Portal</h2>
          <p className="text-lg mb-4">
            EcoChain is a decentralized carbon credits platform connecting governments, NGOs, 
            and corporations to accelerate global reforestation efforts. Track, verify, and 
            manage carbon credits with transparency and automation.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Monitor afforestation projects in real-time</li>
            <li>Verify carbon credits automatically</li>
            <li>Collaborate with NGOs and corporates efficiently</li>
            <li>AI-powered insights and blockchain-backed transparency</li>
          </ul>
        </div>

        {/* Right panel: Login Form */}
        <div className="md:w-1/2 p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-white">Login to Your Account</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-white">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block mb-1 text-white">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-white/20 placeholder-white text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg font-semibold ${
                loading ? "bg-green-300" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
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
