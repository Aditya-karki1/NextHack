import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, Leaf, Shield, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GlobeBackground from "@/components/GlobeWithPointer";

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
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-black">
      {/* Fullscreen 3D Globe in Background */}
      <div className="fixed inset-0 z-0">
        <GlobeBackground />
        {/* Dark overlay for text contrast */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-transparent border-b border-white/20 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  EcoChain
                </h1>
                <p className="text-sm text-white/90">
                  Decentralized Carbon Credits Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-500/30 text-green-100">
                <Globe className="w-3 h-3 mr-1" />
                Live on Blockchain
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/30 text-blue-100">
                <Zap className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-5xl font-bold text-white drop-shadow-md mb-4">
            Transparent Carbon Credits
          </h2>
          <span className="block text-4xl font-semibold bg-gradient-to-r from-green-300 to-blue-300 bg-clip-text text-transparent mb-6">
            Powered by AI & Blockchain
          </span>
          <p className="text-lg text-white/85 max-w-3xl mx-auto mb-10 leading-relaxed">
            Connecting governments, NGOs, and corporations to accelerate global
            reforestation efforts through verifiable, transparent, and automated
            carbon credit management.
          </p>
        </div>

        {/* Cards at Bottom */}
        <div className="pb-12 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
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
                  className="group cursor-pointer transition-all duration-300 
                             hover:scale-105 hover:shadow-2xl 
                             bg-white/20 border border-white/30 backdrop-blur-lg"
                >
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`w-16 h-16 bg-gradient-to-r ${colors[role as keyof typeof colors]} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl text-white font-semibold">
                      {titles[role as keyof typeof titles]}
                    </CardTitle>
                    <CardDescription className="text-white/70 text-sm">
                      {descs[role as keyof typeof descs]}
                    </CardDescription>
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
