import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Award, TrendingUp, Leaf, Download, Eye, CheckCircle } from 'lucide-react';
import { mockCarbonCredits, type CarbonCredit } from '@/lib/mockData';

export default function CorporatePortal() {
  const [availableCredits] = useState<CarbonCredit[]>(mockCarbonCredits.filter(c => c.status === 'available'));
  const [purchasedCredits, setPurchasedCredits] = useState<CarbonCredit[]>([]);
  const [retiredCredits, setRetiredCredits] = useState<CarbonCredit[]>([]);
  const [cart, setCart] = useState<{credit: CarbonCredit, quantity: number}[]>([]);
  const [showCertificate, setShowCertificate] = useState<CarbonCredit | null>(null);

  const companyData = {
    name: 'TechCorp Solutions',
    industry: 'Technology',
    carbonFootprint: 5000, // tonnes CO2 per year
    offsetTarget: 100, // percentage
    currentOffset: 15 // percentage
  };

  const handleAddToCart = (credit: CarbonCredit, quantity: number) => {
    const existingItem = cart.find(item => item.credit.id === credit.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.credit.id === credit.id 
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, { credit, quantity }]);
    }
  };

  const handlePurchase = () => {
    const newPurchases = cart.map(item => ({
      ...item.credit,
      status: 'sold' as const,
      purchaseDate: new Date().toISOString().split('T')[0],
      purchasePrice: item.credit.price * item.quantity
    }));
    
    setPurchasedCredits([...purchasedCredits, ...newPurchases]);
    setCart([]);
  };

  const handleRetireCredits = (credit: CarbonCredit) => {
    setPurchasedCredits(purchasedCredits.filter(c => c.id !== credit.id));
    setRetiredCredits([...retiredCredits, { ...credit, status: 'retired' as const }]);
  };

  const totalCartValue = cart.reduce((sum, item) => sum + (item.credit.price * item.quantity), 0);
  const totalPurchased = purchasedCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const totalRetired = retiredCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const currentOffsetPercentage = Math.min(100, (totalRetired / companyData.carbonFootprint) * 100);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Carbon Footprint</p>
                <p className="text-3xl font-bold">{companyData.carbonFootprint}</p>
                <p className="text-blue-100 text-xs">tonnes CO₂/year</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Current Offset</p>
                <p className="text-3xl font-bold">{currentOffsetPercentage.toFixed(1)}%</p>
                <p className="text-green-100 text-xs">of annual emissions</p>
              </div>
              <Leaf className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Credits Purchased</p>
                <p className="text-3xl font-bold">{totalPurchased}</p>
                <p className="text-purple-100 text-xs">tonnes CO₂</p>
              </div>
              <ShoppingCart className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Credits Retired</p>
                <p className="text-3xl font-bold">{totalRetired}</p>
                <p className="text-orange-100 text-xs">tonnes CO₂</p>
              </div>
              <Award className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Carbon Neutrality Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Carbon Neutrality Progress</CardTitle>
          <CardDescription>Track your journey towards carbon neutrality</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Progress towards {companyData.offsetTarget}% offset goal</span>
              <span className="font-semibold">{currentOffsetPercentage.toFixed(1)}% / {companyData.offsetTarget}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (currentOffsetPercentage / companyData.offsetTarget) * 100)}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-600">
              Need {Math.max(0, (companyData.carbonFootprint * companyData.offsetTarget / 100) - totalRetired)} more tonnes CO₂ to reach your goal
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Credit Marketplace</TabsTrigger>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Carbon Credit Marketplace</h2>
            {cart.length > 0 && (
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {cart.length} items in cart • ${totalCartValue.toFixed(2)}
                </Badge>
                <Button onClick={handlePurchase} className="bg-green-600 hover:bg-green-700">
                  Purchase Credits
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            {availableCredits.map((credit) => (
              <Card key={credit.id} className="border-green-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">Carbon Credits - {credit.location}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline">{credit.amount} tonnes CO₂</Badge>
                        <Badge variant="outline">${credit.price}/tonne</Badge>
                        <Badge variant="outline">By {credit.ngoName}</Badge>
                        <Badge className="bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Verified on {credit.verificationDate}
                      </p>
                      <p className="text-sm text-gray-500">
                        Blockchain Hash: {credit.blockchainHash}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-2xl font-bold text-green-600 mb-2">
                        ${(credit.price * credit.amount).toFixed(2)}
                      </p>
                      <div className="space-y-2">
                        <Input 
                          type="number" 
                          placeholder="Quantity" 
                          className="w-24 text-center"
                          min="1"
                          max={credit.amount}
                          defaultValue="1"
                          id={`quantity-${credit.id}`}
                        />
                        <Button 
                          onClick={() => {
                            const quantity = parseInt((document.getElementById(`quantity-${credit.id}`) as HTMLInputElement)?.value || '1');
                            handleAddToCart(credit, quantity);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Add to Cart
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-6">
          <h2 className="text-2xl font-bold">My Carbon Credit Portfolio</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Purchased Credits</CardTitle>
                <CardDescription>Credits available for retirement</CardDescription>
              </CardHeader>
              <CardContent>
                {purchasedCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No credits purchased yet</p>
                ) : (
                  <div className="space-y-3">
                    {purchasedCredits.map((credit) => (
                      <div key={credit.id} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <div>
                          <p className="font-medium">{credit.location}</p>
                          <p className="text-sm text-gray-600">{credit.amount} tonnes CO₂</p>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleRetireCredits(credit)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Retire Credits
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retired Credits</CardTitle>
                <CardDescription>Credits used for carbon neutrality</CardDescription>
              </CardHeader>
              <CardContent>
                {retiredCredits.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No credits retired yet</p>
                ) : (
                  <div className="space-y-3">
                    {retiredCredits.map((credit) => (
                      <div key={credit.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium">{credit.location}</p>
                          <p className="text-sm text-gray-600">{credit.amount} tonnes CO₂</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setShowCertificate(credit)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Certificate
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="space-y-6">
          <h2 className="text-2xl font-bold">Digital Certificates</h2>
          
          <div className="grid gap-4">
            {retiredCredits.map((credit) => (
              <Card key={credit.id} className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">Carbon Neutrality Certificate</h3>
                      <p className="text-gray-600">{credit.location} - {credit.amount} tonnes CO₂</p>
                      <p className="text-sm text-gray-500">
                        Certificate ID: CERT-{credit.id.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline"
                        onClick={() => setShowCertificate(credit)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-bold">ESG Analytics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Carbon Impact Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Annual Emissions:</span>
                    <span className="font-semibold">{companyData.carbonFootprint} tonnes CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits Purchased:</span>
                    <span className="font-semibold">{totalPurchased} tonnes CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Credits Retired:</span>
                    <span className="font-semibold">{totalRetired} tonnes CO₂</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Net Emissions:</span>
                    <span className="font-semibold">{companyData.carbonFootprint - totalRetired} tonnes CO₂</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span>Offset Percentage:</span>
                    <span className="font-semibold text-green-600">{currentOffsetPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Investment:</span>
                    <span className="font-semibold">${(totalPurchased * 15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Price:</span>
                    <span className="font-semibold">$15.00/tonne</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects Supported:</span>
                    <span className="font-semibold">2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trees Planted:</span>
                    <span className="font-semibold">{Math.floor(totalRetired * 1.33)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Certificate Modal */}
      <Dialog open={!!showCertificate} onOpenChange={() => setShowCertificate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carbon Neutrality Certificate</DialogTitle>
            <DialogDescription>
              Official certificate of carbon offset achievement
            </DialogDescription>
          </DialogHeader>
          {showCertificate && (
            <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-lg border-2 border-green-200">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Certificate of Carbon Neutrality</h2>
                <p className="text-gray-600">This certifies that</p>
                <p className="text-xl font-semibold">{companyData.name}</p>
                <p className="text-gray-600">has offset</p>
                <p className="text-3xl font-bold text-green-600">{showCertificate.amount} tonnes CO₂</p>
                <p className="text-gray-600">through verified afforestation project at</p>
                <p className="font-semibold">{showCertificate.location}</p>
                <div className="border-t pt-4 mt-6 text-sm text-gray-500">
                  <p>Certificate ID: CERT-{showCertificate.id.toUpperCase()}</p>
                  <p>Blockchain Hash: {showCertificate.blockchainHash}</p>
                  <p>Issued: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}