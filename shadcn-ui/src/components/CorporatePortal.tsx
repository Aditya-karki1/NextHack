import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, Clock, Coins, Wallet, TrendingUp, BarChart3, ShoppingCart, User } from "lucide-react";
import PaymentConfirmation from "./PaymentConfirmation";
import CompanyVerification from "./CompanyVerification";
import { useToast } from "@/hooks/use-toast";

// ------------------- Types -------------------
interface Credit {
  _id: string;
  amount: number;
  price: number;
  ngoId?: {
    _id?: string;
    name?: string;
    email?: string;
    kycStatus?: string;
    organization?: {
      name?: string;
      type?: string;
      address?: string;
    };
  };
}

interface CartItem {
  credit: Credit;
  quantity: number;
}

// ------------------- Component -------------------
export default function CorporatePortal() {
  const { user } = useAuth(); // logged-in company info
  const { toast } = useToast(); // for notifications
  const [credits, setCredits] = useState<Credit[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchasedCredits, setPurchasedCredits] = useState<Credit[]>([]);
  const [retiredCredits, setRetiredCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'not_verified' | 'under_verification' | 'verified'>('not_verified');
  const [carbonFootprint] = useState<number>(3000); // Fixed at 3000 tonnes
  
  // Initialize verification status based on user's existing KYC status
  useEffect(() => {
    if (user) {
      const userKycStatus = (user as any)?.kycStatus;
      if (userKycStatus === 'verified') {
        setVerificationStatus('verified');
      } else if (userKycStatus === 'pending') {
        setVerificationStatus('under_verification');
      } else {
        setVerificationStatus('not_verified');
      }
    }
  }, [user]);
  
  // --- derived metrics for dashboard analytics ---
  const totalMarketplaceCredits = credits.reduce((s, c) => s + (c.amount || 0), 0);
  const totalPurchased = purchasedCredits.reduce((s, c) => s + (c.amount || 0), 0);
  const totalRetired = retiredCredits.reduce((s, c) => s + (c.amount || 0), 0);
  const availableInWallet = Math.max(0, totalPurchased - totalRetired);
  const totalCartValue = cart.reduce(
    (sum, item) => sum + item.credit.price * item.quantity,
    0
  );

  // Fetch marketplace credits
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:4000/api/v1/company/credits", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Sort credits by amount (highest first)
        const sortedCredits = res.data.sort((a: Credit, b: Credit) => (b.amount || 0) - (a.amount || 0));
        setCredits(sortedCredits);

        // Optional: Fetch purchased and retired credits
        const portfolioRes = await axios.get(
          `http://localhost:4000/api/v1/company/portfolio/${(user as any)?._id ?? ''}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPurchasedCredits(portfolioRes.data.purchased || []);
        setRetiredCredits(portfolioRes.data.retired || []);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchCredits();
  }, [user]);

  // Add to cart (reduce from UI display only, not DB)
  const handleAddToCart = (credit: Credit) => {
    // Check if company is verified
    if (verificationStatus !== 'verified') {
      toast({
        title: "Verification Required",
        description: "Please complete company verification to purchase credits.",
        variant: "destructive",
      });
      return;
    }

    const existing = cart.find((item) => item.credit._id === credit._id);
    const availableAmount = credit.amount;
    
    if (availableAmount <= 0) {
      toast({
        title: "Out of Stock",
        description: "No credits available for this project.",
        variant: "destructive",
      });
      return;
    }
    
    if (existing) {
      // Can't add more than available
      const maxAdditional = availableAmount - existing.quantity;
      if (maxAdditional <= 0) {
        toast({
          title: "Already in Cart",
          description: "All available credits for this project are already in your cart.",
          variant: "destructive",
        });
        return;
      }
      
      setCart(
        cart.map((item) =>
          item.credit._id === credit._id
            ? { ...item, quantity: item.quantity + Math.min(maxAdditional, availableAmount) }
            : item
        )
      );
    } else {
      setCart([...cart, { credit, quantity: availableAmount }]);
    }
    
    // Reduce available amount in UI (not DB - this is just for display)
    setCredits(credits.map(c => 
      c._id === credit._id 
        ? { ...c, amount: Math.max(0, c.amount - availableAmount) }
        : c
    ));

    // Show success toast
    toast({
      title: "Added to Cart",
      description: `${availableAmount} credits from ${credit.ngoId?.organization?.name || credit.ngoId?.name || 'NGO'} added to cart.`,
    });
  };

  // Purchase credits - now opens payment confirmation page
  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits.",
        variant: "destructive",
      });
      return;
    }
    
    if (verificationStatus !== 'verified') {
      toast({
        title: "Verification Required", 
        description: "Please complete company verification before purchasing.",
        variant: "destructive",
      });
      setShowVerificationForm(true);
      return;
    }
    
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add some credits to your cart first.",
        variant: "destructive",
      });
      return;
    }
    
    setShowPaymentConfirmation(true);
  };

  const handlePaymentSuccess = () => {
    // Clear cart and refresh credits after successful payment
    setCart([]);
    setShowPaymentConfirmation(false);
    
    toast({
      title: "Payment Successful!",
      description: "Your carbon credits have been purchased and added to your portfolio.",
    });
    
    // Refresh the data to get updated credits and portfolio
    if (user) {
      const token = localStorage.getItem("token");
      // Refetch credits
      axios.get("http://localhost:4000/api/v1/company/credits", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        setCredits(res.data);
      }).catch(console.error);
      
      // Refetch portfolio
      axios.get(
        `http://localhost:4000/api/v1/company/portfolio/${(user as any)?._id ?? ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      ).then(portfolioRes => {
        setPurchasedCredits(portfolioRes.data.purchased || []);
        setRetiredCredits(portfolioRes.data.retired || []);
      }).catch(console.error);
    }
  };  // Retire credits
  const handleRetireCredits = (credit: Credit) => {
    setPurchasedCredits(purchasedCredits.filter((c) => c._id !== credit._id));
    setRetiredCredits([...retiredCredits, credit]);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#ecfdf5] flex items-center justify-center">
      <div className="text-center">
  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );

  // Show payment confirmation page when cart has items and user wants to purchase
  if (showPaymentConfirmation) {
    return (
      <PaymentConfirmation
        cart={cart}
        user={user}
        onBack={() => setShowPaymentConfirmation(false)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    );
  }

  // Show verification form when user needs to verify company
  if (showVerificationForm) {
    return (
      <CompanyVerification
        user={user}
        onBack={() => setShowVerificationForm(false)}
        onVerificationSubmitted={() => {
          // Step 1: Close verification form and immediately verify
          setShowVerificationForm(false);
          setVerificationStatus('verified');
          
          // Step 2: Show success toast immediately
          toast({
            title: "🎉 Verification Complete!",
            description: "Your company has been successfully verified! You can now purchase carbon credits.",
          });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#ecfdf5] text-lg">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header: greeting/company on left, title on right */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-5xl font-bold text-foreground uppercase">Hello, {(user as any)?.name || 'Corporate Partner'}</p>
            <div className="mt-2 flex items-center gap-3">
              {/* <div>
                <Badge variant="outline" className="px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </Badge>
              </div> */}
              <div className="text-lg font-semibold text-foreground">{(user as any)?.organization?.name ?? ''}</div>
            </div>
            
            {/* Carbon Footprint Display */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="text-lg font-medium text-gray-700">Company's Carbon Footprint:</div>
                <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
                  3000 tonnes Carbon
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Corporate Dashboard</h1>
            
          </div>
        </div>

        <div className="flex">
          <p className="text-4xl text-muted-foreground m-auto font-bold ">Overview & analytics</p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white shadow-md rounded-xl p-2 h-16">
            <TabsTrigger 
              value="dashboard" 
              className="flex items-center gap-2 text-xl font-medium px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger 
              value="marketplace" 
              className="flex items-center gap-2 text-xl font-medium px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger 
              value="portfolio" 
              className="flex items-center gap-2 text-xl font-medium px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <Wallet className="w-4 h-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 text-xl font-medium px-6 py-3 rounded-lg transition-all duration-200 data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* ------------------- Dashboard (new analytical view) ------------------- */}
          <TabsContent value="dashboard">
            {/* Verification Status Banner */}
            {verificationStatus === 'under_verification' && (
              <Card className="shadow-lg border-0 bg-blue-50 border-blue-200 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Clock className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-blue-800">🔄 Company Verification in Progress</h3>
                      <p className="text-blue-700 mt-1">
                        Your documents are being processed. You'll be automatically verified within 10 seconds.
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-3 py-1">
                      Processing...
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {verificationStatus === 'verified' && (
              <Card className="shadow-lg border-0 bg-emerald-50 border-emerald-200 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-emerald-800">✅ Company Verified Successfully!</h3>
                      <p className="text-emerald-700 mt-1">
                        Congratulations! Your company is now verified and you can purchase carbon credits.
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-sm px-3 py-1">
                      ✓ Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-lg font-medium">Available in Wallet</p>
                      <p className="text-5xl font-bold mt-1">{availableInWallet}</p>
                      <p className="text-md text-emerald-100 mt-1">tCarbon Credits</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">+25%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-sky-600 to-sky-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-lg font-medium">Purchased</p>
                      <p className="text-5xl font-bold mt-1">{totalPurchased}</p>
                      <p className="text-md text-blue-100 mt-1">tCarbon Credits</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">+12%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-lg font-medium">Retired</p>
                      <p className="text-5xl font-bold mt-1">{totalRetired}</p>
                      <p className="text-md text-purple-100 mt-1">tCarbon Offset</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">+8%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-lg font-medium">Cart Value</p>
                      <p className="text-5xl font-bold mt-1">${totalCartValue.toFixed(0)}</p>
                      <p className="text-md text-amber-100 mt-1">Pending Purchase</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Coins className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">+15%</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-semibold text-foreground">Carbon Footprint vs Credits</CardTitle>
                  <CardDescription className="text-lg">
                    {carbonFootprint > 0 ? 'Your carbon footprint and purchased credits overview' : 'Upload carbon footprint data to see analysis'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <svg width="300" height="300" viewBox="0 0 42 42" className="transform -rotate-90">
                        {carbonFootprint === 0 ? (
                          // Show empty state circle
                          <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="#e5e7eb" strokeWidth="3" />
                        ) : (
                          // Show carbon footprint and purchased credits
                          <>
                            {/* Background circle */}
                            <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="#e5e7eb" strokeWidth="3" />
                            {/* Carbon footprint (blue) */}
                            {(() => {
                              const footprintPct = (carbonFootprint / (carbonFootprint + totalPurchased || 1)) * 100;
                              const dashArray = `${footprintPct.toFixed(1)} ${(100 - footprintPct).toFixed(1)}`;
                              return (
                                <circle 
                                  r="15.9" 
                                  cx="21" 
                                  cy="21" 
                                  fill="transparent" 
                                  stroke="#3b82f6" 
                                  strokeWidth="3" 
                                  strokeDasharray={dashArray} 
                                  strokeLinecap="round" 
                                />
                              );
                            })()}
                            {/* Purchased credits (orange) */}
                            {totalPurchased > 0 && (() => {
                              const footprintPct = (carbonFootprint / (carbonFootprint + totalPurchased)) * 100;
                              const purchasedPct = (totalPurchased / (carbonFootprint + totalPurchased)) * 100;
                              const offset = footprintPct;
                              const dashArray = `${purchasedPct.toFixed(1)} ${(100 - purchasedPct).toFixed(1)}`;
                              return (
                                <circle 
                                  r="15.9" 
                                  cx="21" 
                                  cy="21" 
                                  fill="transparent" 
                                  stroke="#f97316" 
                                  strokeWidth="3" 
                                  strokeDasharray={dashArray} 
                                  strokeDashoffset={-offset}
                                  strokeLinecap="round" 
                                />
                              );
                            })()}
                          </>
                        )}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          {carbonFootprint === 0 ? (
                            <>
                              <div className="text-2xl font-bold text-gray-400">0</div>
                              <div className="text-sm text-gray-400">No Data</div>
                            </>
                          ) : (
                            <>
                              <div className="text-3xl font-bold text-foreground">{carbonFootprint}</div>
                              <div className="text-sm text-muted-foreground">tonnes Carbon</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 text-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-md">
                        Carbon Footprint: {carbonFootprint} tonnes
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Purchased Credits: {totalPurchased} tonnes</span>
                    </div>
                  </div>
                  {carbonFootprint > 0 && totalPurchased > 0 && (
                    <div className="mt-4 text-center">
                      <div className={`text-lg font-semibold ${
                        totalPurchased >= carbonFootprint ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {totalPurchased >= carbonFootprint 
                          ? '✓ Carbon Neutral Achieved!' 
                          : `${carbonFootprint - totalPurchased} tonnes Carbon remaining to offset`
                        }
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-semibold text-foreground">Monthly Progress</CardTitle>
                  <CardDescription className="text-lg">Projects completed and credits earned over time</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-48 w-full bg-gradient-to-br from-emerald-100 to-sky-100 rounded-lg p-4 flex items-end">
                    <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                      {(() => {
                        const months = 6;
                        const values: number[] = Array(months).fill(0);
                        purchasedCredits.forEach((c) => {
                          const date = (c as any).createdAt ? new Date((c as any).createdAt) : null;
                          const idx = date ? Math.min(months - 1, Math.max(0, new Date().getMonth() - date.getMonth())) : months - 1;
                          values[idx] += c.amount || 0;
                        });
                        const max = Math.max(...values, 1);
                        const points = values.map((v, i) => `${(i / (months - 1)) * 100},${30 - (v / max) * 28}`);
                        return <polyline fill="rgba(34,197,94,0.3)" stroke="#10b981" strokeWidth="3" points={points.join(' ')} />;
                      })()}
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Digital Wallet Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-semibold text-foreground">Digital Wallet</CardTitle>
                <CardDescription className="text-lg">Carbon credit transactions and portfolio overview</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4 font-medium text-md">Project</th>
                            <th className="text-left p-4 font-medium text-md">Credits</th>
                            <th className="text-left p-4 font-medium text-md">Date</th>
                            <th className="text-left p-4 font-medium text-md">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchasedCredits.length === 0 && retiredCredits.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No transactions yet</td></tr>
                          )}
                          {purchasedCredits.map((c) => (
                            <tr key={c._id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-4">{c.ngoId?.organization?.name || c.ngoId?.name || 'Unknown'}</td>
                              <td className="p-4 font-medium">{c.amount} tCarbon</td>
                              <td className="p-4 text-sm text-muted-foreground">{(c as any).createdAt ? new Date((c as any).createdAt).toLocaleDateString() : '—'}</td>
                              <td className="p-4">
                                <Badge className="bg-sky-100 text-sky-600">Purchased</Badge>
                              </td>
                            </tr>
                          ))}
                          {retiredCredits.map((c) => (
                            <tr key={c._id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-4">{c.ngoId?.organization?.name || c.ngoId?.name || 'Unknown'}</td>
                              <td className="p-4 font-medium">{c.amount} tCarbon</td>
                              <td className="p-4 text-sm text-muted-foreground">{(c as any).createdAt ? new Date((c as any).createdAt).toLocaleDateString() : '—'}</td>
                              <td className="p-4">
                                <Badge className="bg-emerald-100 text-emerald-600">Retired</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200/20">
                      <CardContent className="p-6 text-center">
                        <div className="text-lg text-emerald-600 font-medium mb-2">Total Balance</div>
                        <div className="text-3xl font-bold text-emerald-600 mb-4">{availableInWallet}</div>
                        <div className="text-md text-emerald-600">Credits Available</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-br from-sky-100 to-sky-50 border-sky-200/20">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Available:</span>
                          <span className="font-medium text-sky-600">{availableInWallet}</span>
                        </div>
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Total Earned:</span>
                          <span className="font-medium text-sky-600">{totalPurchased}</span>
                        </div>
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Market Value:</span>
                          <span className="font-medium text-sky-600">₹{Math.round(totalPurchased * (credits[0]?.price || 1500))}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ------------------- Marketplace ------------------- */}
          <TabsContent value="marketplace">
            {/* Verification Alert */}
            {verificationStatus === 'not_verified' && (
              <Card className="shadow-lg border-0 bg-amber-50 border-amber-200 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-800">Company Verification Required</h3>
                      <p className="text-amber-700 mt-1">
                        Complete your company verification to purchase carbon credits and access the marketplace.
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowVerificationForm(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Verify Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Under Verification Alert */}
            {verificationStatus === 'under_verification' && (
              <Card className="shadow-lg border-0 bg-blue-50 border-blue-200 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-800">Verification Under Review</h3>
                      <p className="text-blue-700 mt-1">
                        Your documents are being reviewed. This process usually takes 10 seconds.
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Processing...
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verified Success Alert */}
            {verificationStatus === 'verified' && (
              <Card className="shadow-lg border-0 bg-emerald-50 border-emerald-200 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-emerald-800">Company Verified ✓</h3>
                      <p className="text-emerald-700 mt-1">
                        Your company is verified! You can now purchase carbon credits from the marketplace.
                      </p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      Verified
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Carbon Credit Marketplace</h2>
                <p className="text-muted-foreground mt-1">
                  Discover and purchase verified carbon credits • Sorted by availability (highest first)
                </p>
              </div>
              <div className="text-xl font-bold italic  ">
                <p className="text-xl">Carbon Credits Marketplace</p>
                <p className="text-sm text-muted-foreground">Price varies by project type</p>
              </div>
              {cart.length > 0 && (
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="px-4 py-2 text-md">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {cart.length} items • ₹{totalCartValue.toFixed(2)}
                  </Badge>
                  <Button
                    onClick={handlePurchase}
                    className="bg-green-500 hover:bg-green-600 text-white text-md px-6 py-2 shadow-lg"
                  >
                    Purchase & Mint Tokens
                  </Button>
                </div>
              )}
            </div>
            
            <div className="grid gap-6">
              {credits.map((credit) => (
                <Card key={credit._id} className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-xl mb-2 text-foreground uppercase">
                          {credit.ngoId?.organization?.name || credit.ngoId?.name || "Unknown NGO"}
                        </h3>
                        <div className="text-muted-foreground mb-4">
                          • {credit.ngoId?.organization?.type || "NGO"}  {credit.ngoId?.organization?.address || ""}
                        </div>
                        <div className="flex flex-wrap gap-3 ">
                          <Badge className="bg-emerald-100 text-emerald-600 px-3 py-1 text-md">
                            {credit.amount} tonnes Carbon
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-600 px-3 py-1 text-md">
                            ₹{credit.price}/tonne
                          </Badge>
                          <Badge className="bg-sky-100 text-sky-600 px-3 py-1 text-md">
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-foreground mb-2">
                          ₹{(credit.amount * credit.price).toFixed(2)}
                        </div>
                        {credit.amount > 0 ? (
                          <Button
                            onClick={() => handleAddToCart(credit)}
                            className="bg-yellow-300 hover:bg-yellow-400 text-white px-6 py-2 shadow-md text-md"
                          >
                            Add to Cart
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Out of Stock
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ------------------- Portfolio / Transactions ------------------- */}
          <TabsContent value="portfolio">
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Your Portfolio</h2>
                <p className="text-muted-foreground">Manage your carbon credit investments and transactions</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-primary" />
                    Purchased Credits
                  </h3>
                  {purchasedCredits.length === 0 && (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No purchased credits yet.</p>
                    </Card>
                  )}
                  <div className="grid gap-4">
                    {purchasedCredits.map((credit) => (
                      <Card key={credit._id} className="shadow-md border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-lg text-foreground">
                                {credit.ngoId?.organization?.name || credit.ngoId?.name || "Unknown NGO"}
                              </h4>
                              <p className="text-muted-foreground">
                                {credit.amount} tonnes Carbon • ₹{credit.price}/tonne
                              </p>
                              <Badge className="bg-sky-100 text-sky-600 mt-2">Active Investment</Badge>
                            </div>
                            <Button
                              onClick={() => handleRetireCredits(credit)}
                              variant="destructive"
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Retire Credits
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-primary" />
                    Retired Credits
                  </h3>
                  {retiredCredits.length === 0 && (
                    <Card className="p-8 text-center">
                      <p className="text-muted-foreground">No retired credits yet.</p>
                    </Card>
                  )}
                  <div className="grid gap-4">
                    {retiredCredits.map((credit) => (
                      <Card key={credit._id} className="shadow-md border-0 bg-white/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-semibold text-lg text-foreground">
                                {credit.ngoId?.organization?.name || credit.ngoId?.name || "Unknown NGO"}
                              </h4>
                              <p className="text-muted-foreground">
                                {credit.amount} tonnes Carbon • ₹{credit.price}/tonne
                              </p>
                              <Badge className="bg-emerald-100 text-emerald-600 mt-2">Carbon Offset Complete</Badge>
                            </div>
                            <div className="text-emerald-primary">
                              <CheckCircle className="w-8 h-8" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ------------------- Profile / Personal Details ------------------- */}
          <TabsContent value="profile">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">Company Profile</h2>
                  <p className="text-muted-foreground">Manage your organization details and verification status</p>
                </div>
                {verificationStatus !== 'verified' && (
                  <Button
                    onClick={() => setShowVerificationForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={verificationStatus === 'under_verification'}
                  >
                    {verificationStatus === 'under_verification' ? 'Under Review...' : 'Complete Verification'}
                  </Button>
                )}
              </div>

              {/* Verification Status Card */}
              <Card className={`shadow-lg border-0 ${
                verificationStatus === 'verified' ? 'bg-emerald-50' : 
                verificationStatus === 'under_verification' ? 'bg-blue-50' : 'bg-amber-50'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      verificationStatus === 'verified' ? 'bg-emerald-100' : 
                      verificationStatus === 'under_verification' ? 'bg-blue-100' : 'bg-amber-100'
                    }`}>
                      {verificationStatus === 'under_verification' ? (
                        <Clock className="w-8 h-8 text-blue-600 animate-spin" />
                      ) : (
                        <CheckCircle className={`w-8 h-8 ${
                          verificationStatus === 'verified' ? 'text-emerald-600' : 'text-amber-600'
                        }`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-foreground">Verification Status</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${
                          verificationStatus === 'verified' 
                            ? 'bg-emerald-100 text-emerald-600 border-emerald-200' 
                            : verificationStatus === 'under_verification'
                            ? 'bg-blue-100 text-blue-600 border-blue-200'
                            : 'bg-amber-100 text-amber-600 border-amber-200'
                        }`}>
                          {verificationStatus === 'verified' ? 'Verified Company' : 
                           verificationStatus === 'under_verification' ? 'Under Review' : 'Pending Verification'}
                        </Badge>
                        {verificationStatus === 'verified' && (
                          <span className="text-sm text-emerald-600 font-medium">✓ Eligible to purchase carbon credits</span>
                        )}
                      </div>
                      {verificationStatus !== 'verified' && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {verificationStatus === 'under_verification' 
                            ? 'Your verification documents are being reviewed. This usually takes 10 seconds.' 
                            : 'Complete company verification to start purchasing carbon credits.'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user ? (
                <>
                  {/* Basic Information */}
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground">Company Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                            <p className="text-lg font-semibold text-foreground uppercase mt-1">{(user as any)?.name ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.email ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Organization</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.organization?.name ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.organization?.type ?? '—'}</p>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.registrationNumber ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.panNumber ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.phoneNumber ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Website</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {(user as any)?.website ? (
                                <a href={(user as any).website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                                  {(user as any).website}
                                </a>
                              ) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground">Address Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Complete Address</label>
                          <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.organization?.address ?? '—'}</p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">City</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.city ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">State</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.state ?? '—'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">PIN Code</label>
                            <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.pincode ?? '—'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Information */}
                  {(user as any)?.kycStatus === 'verified' && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-foreground">Business Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
                              <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.employeeCount ?? '—'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Incorporation Date</label>
                              <p className="text-lg font-semibold text-foreground mt-1">
                                {(user as any)?.incorporationDate ? new Date((user as any).incorporationDate).toLocaleDateString() : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Tax ID/GST</label>
                              <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.taxId ?? '—'}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                              <p className="text-lg font-semibold text-foreground mt-1">
                                {(user as any)?.contactPersonName ?? '—'}
                                {(user as any)?.contactPersonDesignation && (
                                  <span className="text-sm text-muted-foreground block">
                                    {(user as any).contactPersonDesignation}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {(user as any)?.businessDescription && (
                          <div className="mt-8 pt-6 border-t">
                            <label className="text-sm font-medium text-muted-foreground">Business Description</label>
                            <p className="text-base text-foreground mt-2 leading-relaxed">
                              {(user as any).businessDescription}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No user logged in.</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}