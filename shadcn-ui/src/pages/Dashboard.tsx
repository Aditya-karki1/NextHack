import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Building2, Leaf, Shield, Zap } from 'lucide-react';
import GovernmentPortal from '@/components/GovernmentPortal';
import NGOPortal from '@/components/NGOPortal';
import CorporatePortal from '@/components/CorporatePortal';

export default function Dashboard() {
  const [activePortal, setActivePortal] = useState<string | null>(null);

  if (activePortal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EcoChain</h1>
                <p className="text-sm text-gray-600">Decentralized Carbon Credits Platform</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setActivePortal(null)}
              className="bg-white hover:bg-gray-50"
            >
              ← Back to Dashboard
            </Button>
          </div>

          {activePortal === 'government' && <GovernmentPortal />}
          {activePortal === 'ngo' && <NGOPortal />}
          {activePortal === 'corporate' && <CorporatePortal />}
        </div>
      </div>
    );
  }

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
                <p className="text-sm text-gray-600">Decentralized Carbon Credits Platform</p>
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

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Transparent Carbon Credits
            <span className="block text-4xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Powered by AI & Blockchain
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Connecting governments, NGOs, and corporations to accelerate global reforestation efforts 
            through verifiable, transparent, and automated carbon credit management.
          </p>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-green-600 mb-2">2,500+</div>
              <div className="text-gray-600">Trees Verified</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,250</div>
              <div className="text-gray-600">Carbon Credits Issued</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">15</div>
              <div className="text-gray-600">Active Projects</div>
            </div>
          </div>
        </div>

        {/* Portal Selection */}
        <div className="mb-16">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">Choose Your Portal</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Government Portal */}
            <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-white/80 backdrop-blur-sm border-2 hover:border-green-300">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Government Portal</CardTitle>
                <CardDescription className="text-gray-600">
                  Oversee and initiate afforestation tasks with AI-powered verification
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Land Survey & Task Creation
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Verification Dashboard
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    System Analytics
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  onClick={() => setActivePortal('government')}
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
                  Execute plantation tasks and earn verified carbon credits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Task Marketplace
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Project Reporting
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Digital Wallet
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  onClick={() => setActivePortal('ngo')}
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
                  Purchase verified carbon credits and achieve carbon neutrality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Credit Marketplace
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Traceability & Certificates
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                    Portfolio Management
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                  onClick={() => setActivePortal('corporate')}
                >
                  Access Portal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-12 border border-gray-200">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">How EcoChain Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Task Creation</h4>
              <p className="text-sm text-gray-600">Government creates afforestation tasks with specific requirements</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Execution</h4>
              <p className="text-sm text-gray-600">NGOs accept tasks and complete plantation work with evidence</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI Verification</h4>
              <p className="text-sm text-gray-600">AI analyzes evidence and blockchain mints verified credits</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Trading</h4>
              <p className="text-sm text-gray-600">Corporations purchase credits for carbon neutrality goals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}