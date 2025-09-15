import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Building2, Leaf, Shield, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
console.log ("check",user)
  // Function to handle portal click
  const handlePortalAccess = (role: "GOV" | "NGO" | "COMPANY") => {
    if (user && user.role === role) {
      console.log("User role matches:", user.role);
      // If logged in with the correct role → Go to portal directly
      if (role === "GOV") navigate("/government");
      if (role === "NGO") navigate("/ngo");
      if (role === "COMPANY") navigate("/corporate");
    } else {
      //  Not logged in → Go to respective login page
      if (role === "GOV") navigate("/login-gov");
      if (role === "NGO") navigate("/login-ngo");
      if (role === "COMPANY") navigate("/login-corporate");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  EcoChain
                </h1>
                <p className="text-sm text-gray-600">
                  Decentralized Carbon Credits Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <Globe className="w-3 h-3 mr-1" />
                Live on Blockchain
              </Badge>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                <Zap className="w-3 h-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transparent Carbon Credits
            <span className="block text-4xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Powered by AI & Blockchain
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connecting governments, NGOs, and corporations to accelerate global
            reforestation efforts through verifiable, transparent, and automated
            carbon credit management.
          </p>
        </div>

        {/* Portal Selection */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Choose Your Portal
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Government Portal */}
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/80 backdrop-blur-sm border-2 hover:border-green-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Government Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Oversee and verify afforestation tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white"
                  onClick={() => handlePortalAccess("GOV")}
                >
                  Access Portal
                </Button>
              </CardContent>
            </Card>

            {/* NGO Portal */}
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/80 backdrop-blur-sm border-2 hover:border-blue-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">NGO Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Execute tasks & earn verified carbon credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                  onClick={() => handlePortalAccess("NGO")}
                >
                  Access Portal
                </Button>
              </CardContent>
            </Card>

            {/* Corporate Portal */}
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/80 backdrop-blur-sm border-2 hover:border-purple-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Corporate Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Purchase credits & go carbon neutral
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                  onClick={() => handlePortalAccess("COMPANY")}
                >
                  Access Portal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
