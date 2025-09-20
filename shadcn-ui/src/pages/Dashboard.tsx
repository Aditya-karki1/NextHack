import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, Leaf, Shield, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePortalAccess = (role: "GOV" | "NGO" | "COMPANY") => {
    if (user && user.role === role) {
      if (role === "GOV") navigate("/government");
      if (role === "NGO") navigate("/ngo");
      if (role === "COMPANY") navigate("/corporate");
    } else {
      if (role === "GOV") navigate("/login-gov");
      if (role === "NGO") navigate("/login-ngo");
      if (role === "COMPANY") navigate("/login-corporate");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fullscreen Moving Earth */}
      <div className="absolute inset-0 w-full h-full">
        <img
          src="/images/1.gif" // GIF in public/images
          alt="Earth"
          className="w-full h-full object-cover "
        />
      </div>

      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-transparent border-b border-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  EcoChain
                </h1>
                <p className="text-sm text-white/80">
                  Decentralized Carbon Credits Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100/30 text-green-200">
                <Globe className="w-3 h-3 mr-1" />
                Live on Blockchain
              </Badge>
              <Badge variant="secondary" className="bg-blue-100/30 text-blue-200">
                <Zap className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="container mx-auto px-6 py-12 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Transparent Carbon Credits
            <span className="block text-4xl bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              Powered by AI & Blockchain
            </span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-12">
            Connecting governments, NGOs, and corporations to accelerate global
            reforestation efforts through verifiable, transparent, and automated
            carbon credit management.
          </p>

          {/* Portal Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {["GOV", "NGO", "COMPANY"].map((role) => {
              const icons = { GOV: Shield, NGO: Leaf, COMPANY: Building2 };
              const colors = {
                GOV: "from-green-500 to-green-600",
                NGO: "from-blue-500 to-blue-600",
                COMPANY: "from-purple-500 to-purple-600",
              };
              const titles = {
                GOV: "Government Portal",
                NGO: "NGO Portal",
                COMPANY: "Corporate Portal",
              };
              const descs = {
                GOV: "Oversee and verify afforestation tasks",
                NGO: "Execute tasks & earn verified carbon credits",
                COMPANY: "Purchase credits & go carbon neutral",
              };
              const Icon = icons[role as keyof typeof icons];

              return (
                <Card
                  key={role}
                  className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/20 border border-white/30 backdrop-blur-md`}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 bg-gradient-to-r ${colors[role as keyof typeof colors]} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white">{titles[role as keyof typeof titles]}</CardTitle>
                    <CardDescription className="text-white/70">{descs[role as keyof typeof descs]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className={`w-full bg-gradient-to-r ${colors[role as keyof typeof colors]} text-white`}
                      onClick={() => handlePortalAccess(role as "GOV" | "NGO" | "COMPANY")}
                    >
                      Access Portal
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
