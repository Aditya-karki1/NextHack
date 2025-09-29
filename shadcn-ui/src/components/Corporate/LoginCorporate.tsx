import type { FormEvent } from "react";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Building2, Eye, EyeOff, BarChart3, TrendingUp, Zap } from "lucide-react";

export default function LoginCorporate() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/corporate";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: 'Missing fields', description: 'Please enter email and password' });
      return;
    }

    setLoading(true);
    try {
      await login("COMPANY", { email, password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      toast({ title: 'Login failed', description: 'Login failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Landscape Background - Image 2 */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('data:image/svg+xml;base64,${btoa(`
            <svg width="1920" height="1080" viewBox="0 0 1920 1080" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#40E0D0;stop-opacity:1" />
                  <stop offset="70%" style="stop-color:#90EE90;stop-opacity:1" />
                  <stop offset="100%" style="stop-color:#FFD700;stop-opacity:1" />
                </linearGradient>
              </defs>
              
              <!-- Sky gradient -->
              <rect width="1920" height="1080" fill="url(#skyGradient)" />
              
              <!-- Mountains -->
              <path d="M0 600 L400 400 L800 500 L1200 350 L1600 450 L1920 380 L1920 1080 L0 1080 Z" 
                    fill="#2C3E50" opacity="0.8"/>
              <path d="M200 650 L600 480 L1000 550 L1400 420 L1800 500 L1920 450 L1920 1080 L0 1080 Z" 
                    fill="#34495E" opacity="0.6"/>
              
              <!-- Trees -->
              <g transform="translate(150, 450)">
                <rect x="20" y="100" width="10" height="80" fill="#8B4513"/>
                <ellipse cx="25" cy="100" rx="40" ry="80" fill="#228B22"/>
              </g>
              <g transform="translate(300, 500)">
                <rect x="15" y="80" width="8" height="60" fill="#8B4513"/>
                <ellipse cx="19" cy="80" rx="30" ry="60" fill="#32CD32"/>
              </g>
              <g transform="translate(80, 480)">
                <rect x="12" y="90" width="6" height="50" fill="#8B4513"/>
                <ellipse cx="15" cy="90" rx="25" ry="50" fill="#228B22"/>
              </g>
            </svg>
          `)}`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Centered Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 flex items-center justify-center min-h-screen">
        <div className="flex items-center justify-center w-full space-x-16">
          
          {/* Left Side - Corporate Branding */}
          <div className="flex-1 text-white text-center max-w-lg">
            <div className="mb-8 flex items-center justify-center">
              <div className="bg-white/20 backdrop-blur-md rounded-full p-4 mb-4">
                <Building2 className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg">
              Corporate Portal
            </h1>
            <p className="text-xl mb-8 text-white/90 leading-relaxed">
              Transform your business with sustainable carbon credit solutions and comprehensive environmental reporting
            </p>
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Analytics</p>
                <p className="text-xs text-white/70">Real-time insights</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Growth</p>
                <p className="text-xs text-white/70">Sustainable expansion</p>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <Zap className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Innovation</p>
                <p className="text-xs text-white/70">Future-ready solutions</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="flex-shrink-0 w-full max-w-md">
            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Access your corporate dashboard</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Corporate Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your corporate email"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 text-gray-800 placeholder-gray-400 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <input
                      id="remember"
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="remember" className="ml-2 text-gray-600">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    to="/forgot-password" 
                    className="text-blue-600 hover:text-blue-700 transition-colors hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-[1.02] ${
                    loading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing In...
                    </div>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-600">
                  New to our platform?{" "}
                  <Link 
                    to="/register-corporate" 
                    className="text-blue-600 font-medium hover:text-blue-700 transition-colors hover:underline"
                  >
                    Register Your Company
                  </Link>
                </p>
              </div>

              {/* Corporate Features */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-xs text-gray-600 font-medium mb-1">✨ Corporate Features</p>
                <p className="text-xs text-gray-500">
                  Advanced analytics • Carbon reporting • Credit marketplace • Compliance tracking
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
