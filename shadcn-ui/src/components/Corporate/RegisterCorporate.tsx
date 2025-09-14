import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RegisterCorporate() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Replace with actual registration API call if exists
      await axios.post("/api/v1/company/signup", { name, email, password });

      // Auto login after successful registration
      await login("COMPANY", { email, password });
      navigate("/corporate");
    } catch (err) {
      console.error(err);
      alert("Registration failed");
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login-corporate"); // navigate to corporate login page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 className="text-2xl mb-6 font-bold">Corporate Portal Registration</h2>

      <form
        onSubmit={handleRegister}
        className="w-full max-w-md bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
        >
          Register
        </button>

        {/* Login button */}
        <button
          type="button"
          onClick={handleLoginRedirect}
          className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition mt-2"
        >
          Already have an account? Login
        </button>
      </form>
    </div>
  );
}
