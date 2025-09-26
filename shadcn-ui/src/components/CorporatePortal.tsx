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
  const [credits, setCredits] = useState<Credit[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchasedCredits, setPurchasedCredits] = useState<Credit[]>([]);
  const [retiredCredits, setRetiredCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  
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
        setCredits(res.data);

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

  // Add to cart (full quantity)
  const handleAddToCart = (credit: Credit) => {
    const existing = cart.find((item) => item.credit._id === credit._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item.credit._id === credit._id
            ? { ...item, quantity: item.quantity + credit.amount }
            : item
        )
      );
    } else {
      setCart([...cart, { credit, quantity: credit.amount }]);
    }
  };

  // Purchase credits
  const handlePurchase = async () => {
    if (!user) return alert("You must be logged in to purchase credits.");
    const token = localStorage.getItem("token");
    try {
      for (const item of cart) {
        await axios.patch(
          `http://localhost:4000/api/v1/company/purchase/${item.credit._id}`,
          { quantity: item.quantity, companyId: (user as any)?._id ?? '' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setPurchasedCredits([...purchasedCredits, ...cart.map((c) => c.credit)]);
      setCart([]);
    } catch (err: any) {
      console.error("Error purchasing credits:", err.response?.data || err.message);
    }
  };

  // Retire credits
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

  return (
    <div className="min-h-screen bg-[#ecfdf5] text-lg">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header: greeting/company on left, title on right */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-5xl font-bold text-foreground uppercase">Hello, {(user as any)?.name || 'Corporate Partner'}</p>
            <div className="mt-2 flex items-center gap-3">
              <div>
                <Badge variant="outline" className="px-3 py-1">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Verified
                </Badge>
              </div>
              <div className="text-lg font-semibold text-foreground">{(user as any)?.organization?.name ?? ''}</div>
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
            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-600 to-emerald-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-lg font-medium">Available in Wallet</p>
                      <p className="text-5xl font-bold mt-1">{availableInWallet}</p>
                      <p className="text-md text-emerald-100 mt-1">tCO₂ Credits</p>
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
                      <p className="text-md text-blue-100 mt-1">tCO₂ Credits</p>
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
                      <p className="text-md text-purple-100 mt-1">tCO₂ Offset</p>
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
                  <CardTitle className="text-2xl font-semibold text-foreground">Project Status Distribution</CardTitle>
                  <CardDescription className="text-lg">Overview of all your projects by status</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <svg width="300" height="300" viewBox="0 0 42 42" className="transform -rotate-90">
                        <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="#d1fae5" strokeWidth="3" />
                        {(() => {
                          const inProgress = Math.min(1, totalPurchased / Math.max(1, totalMarketplaceCredits || 1));
                          const pct = inProgress * 100;
                          const remaining = 100 - pct;
                          const dashArray = `${pct.toFixed(1)} ${remaining.toFixed(1)}`;
                          return <circle r="15.9" cx="21" cy="21" fill="transparent" stroke="#3b82f6" strokeWidth="3" strokeDasharray={dashArray} strokeLinecap="round" />;
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-foreground">50%</div>
                          <div className="text-md text-muted-foreground">In Progress</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 text-md">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-md">In Progress 50%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                      <span>Created 50%</span>
                    </div>
                  </div>
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
                              <td className="p-4 font-medium">{c.amount} tCO₂</td>
                              <td className="p-4 text-sm text-muted-foreground">{(c as any).createdAt ? new Date((c as any).createdAt).toLocaleDateString() : '—'}</td>
                              <td className="p-4">
                                <Badge className="bg-sky-100 text-sky-600">Purchased</Badge>
                              </td>
                            </tr>
                          ))}
                          {retiredCredits.map((c) => (
                            <tr key={c._id} className="border-b hover:bg-muted/30 transition-colors">
                              <td className="p-4">{c.ngoId?.organization?.name || c.ngoId?.name || 'Unknown'}</td>
                              <td className="p-4 font-medium">{c.amount} tCO₂</td>
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
                          <span className="font-medium text-sky-600">${Math.round(totalPurchased * (credits[0]?.price || 15))}</span>
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground">Carbon Credit Marketplace</h2>
                <p className="text-muted-foreground mt-1">Discover and purchase verified carbon credits</p>
              </div>
              <div className="text-xl font-bold italic  ">
                <p className="text-xl">1 credit = Rs.2000</p>
              </div>
              {cart.length > 0 && (
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="px-4 py-2 text-md">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {cart.length} items • Rs.{totalCartValue*20000}
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
                            {credit.amount} tonnes CO₂
                          </Badge>
                          <Badge className="bg-amber-100 text-amber-600 px-3 py-1 text-md">
                            Rs. {credit.price*2000}/tonne
                          </Badge>
                          <Badge className="bg-sky-100 text-sky-600 px-3 py-1 text-md">
                            Verified
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        <div className="text-2xl font-bold text-foreground mb-2">
                          Rs. {(credit.amount * credit.price * 20000).toFixed(2)}
                        </div>
                        <Button
                          onClick={() => handleAddToCart(credit)}
                          className="bg-yellow-300 hover:bg-yellow-400 text-white px-6 py-2 shadow-md text-md"
                        >
                          Add to Cart
                        </Button>
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
                                {credit.amount} tonnes CO₂ • ${credit.price}/tonne
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
                                {credit.amount} tonnes CO₂ • ${credit.price}/tonne
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
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Company Profile</h2>
                <p className="text-muted-foreground">Manage your organization details and verification status</p>
              </div>

              {user ? (
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
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
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Organization Type</label>
                          <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.organization?.type ?? '—'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Address</label>
                          <p className="text-lg font-semibold text-foreground mt-1">{(user as any)?.organization?.address ?? '—'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">KYC Status</label>
                          <div className="mt-1">
                            <Badge className={`${(user as any)?.kycStatus === 'verified' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {(user as any)?.kycStatus ?? 'Pending'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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