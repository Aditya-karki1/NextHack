import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from '@/hooks/use-toast';

export default function RegisterNGO() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast({ title: 'Missing fields', description: 'Please fill all fields' });
      return;
    }

    try {
      // Call backend registration API
      await axios.post("http://localhost:4000/api/v1/ngo/signup", { name, email, password });

      // After successful registration, log in the user
      await login("NGO", { email, password });
      navigate("/ngo");
    } catch (error) {
      console.error("Registration failed:", error);
      toast({ title: 'Registration failed', description: 'Registration failed. Please try again.' });
    }
  };

  const handleLoginRedirect = () => {
    navigate("/login-ngo"); // Navigate to NGO login page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h2 className="text-2xl mb-6 font-bold">NGO Portal Registration</h2>

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
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition"
        >
          Register
        </button>

        {/* Login Button */}
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
