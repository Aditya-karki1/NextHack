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

interface UserData {
  _id: string;
  name: string;
  email: string;
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  role?: string;
  organization?: {
    name?: string;
    type?: string;
    address?: string;
    phone?: string;
    website?: string;
    employeeCount?: number;
    incorporationDate?: string;
    businessDescription?: string;
    contact?: {
      phone?: string;
      email?: string;
    };
  };
  credits?: {
    balance?: number;
    walletAddress?: string;
    lastUpdated?: string;
  };
  transactions?: Array<{
    _id?: string;
    creditId?: string;
    quantity?: number;
    pricePerUnit?: number;
    type?: string;
    timestamp?: string;
  }>;
  registrationNumber?: string;
  panNumber?: string;
  taxId?: string;
  phoneNumber?: string;
  website?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPersonName?: string;
  contactPersonDesignation?: string;
  businessDescription?: string;
  employeeCount?: number;
  incorporationDate?: string;
  carbonFootprint?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface Portfolio {
  purchased: Credit[];
  retired: Credit[];
  totalSpent?: number;
  carbonReduction?: number;
}

// ------------------- Component -------------------
export default function CorporatePortal() {
  const { user } = useAuth(); // logged-in company info
  const { toast } = useToast(); // for notifications
  
  // State for fetched data
  const [userData, setUserData] = useState<UserData | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio>({ purchased: [], retired: [] });
  const [credits, setCredits] = useState<Credit[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataFetching, setDataFetching] = useState(false);
  
  // UI states
  const [showPaymentConfirmation, setShowPaymentConfirmation] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'not_verified' | 'under_verification' | 'verified'>('verified'); // Default to verified for development
  
  // Fixed carbon footprint (can be made dynamic later)
  const [carbonFootprint] = useState<number>(3000); // Fixed at 3000 tonnes
  
  // Initialize verification status based on user's existing KYC status
  useEffect(() => {
    if (user || userData) {
      const currentUser = userData || user;
      const userKycStatus = (currentUser as any)?.kycStatus;
      
      // For development - always set to verified
      setVerificationStatus('verified');
      console.log("🔧 Development Mode: All users set to VERIFIED status");
      
      /* Original logic (commented for development):
      if (userKycStatus === 'VERIFIED' || userKycStatus === 'verified') {
        setVerificationStatus('verified');
      } else if (userKycStatus === 'PENDING' || userKycStatus === 'pending') {
        setVerificationStatus('under_verification');
      } else {
        setVerificationStatus('not_verified');
      }
      */
    }
  }, [user, userData]);

  // Comprehensive data fetching function
  const fetchAllUserData = async () => {
    if (!user) return;
    
    setDataFetching(true);
    const userId = (user as any)?._id;

    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "User ID not found. Please log in again.",
        variant: "destructive",
      });
      setDataFetching(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch user profile data
      const profileRes = await axios.get(
        `http://localhost:4000/api/v1/company/profile/${userId}`,
        { withCredentials: true }
      );
      
      if (profileRes.data.success) {
        const companyData = profileRes.data.company;
        setUserData(companyData);
        
        // Update verification status based on backend response
        const kycStatus = companyData.kycStatus;
        
        // For development - always set to verified regardless of backend status
        setVerificationStatus('verified');
        console.log("🔧 Development Override: KYC Status forced to VERIFIED (actual:", kycStatus, ")");
        
        /* Original logic (commented for development):
        if (kycStatus === 'VERIFIED') {
          setVerificationStatus('verified');
        } else if (kycStatus === 'PENDING') {
          setVerificationStatus('under_verification');
        } else {
          setVerificationStatus('not_verified');
        }
        */
        
        // Removed excessive success toast for profile loading
      }

      // Fetch marketplace credits
      const creditsRes = await axios.get(
        "http://localhost:4000/api/v1/company/credits",
        { withCredentials: true }
      );
      
      if (creditsRes.data) {
        const sortedCredits = creditsRes.data.sort((a: Credit, b: Credit) => (b.amount || 0) - (a.amount || 0));
        setCredits(sortedCredits);
        // Removed excessive marketplace credits toast
      }

      // Fetch user portfolio
      console.log("Fetching portfolio for userId:", userId);
      const portfolioRes = await axios.get(
        `http://localhost:4000/api/v1/company/portfolio/${userId}`,
        { withCredentials: true }
      );
      
      console.log("Portfolio response:", portfolioRes.data);
      
      if (portfolioRes.data.success) {
        const portfolioData = portfolioRes.data;
        console.log("🎯 Portfolio Data Breakdown:");
        console.log("Purchased array:", portfolioData.purchased);
        console.log("Retired array:", portfolioData.retired);
        console.log("Total purchased transactions:", portfolioData.purchased?.length || 0);
        console.log("Total retired transactions:", portfolioData.retired?.length || 0);
        
        setPortfolio({
          purchased: portfolioData.purchased || [],
          retired: portfolioData.retired || [],
          totalSpent: portfolioData.totalSpent || 0,
          carbonReduction: portfolioData.carbonReduction || 0
        });
        
        // Removed excessive portfolio success toast
      }

      // Show single success message instead of multiple toasts
      toast({
        title: "Dashboard Updated",
        description: "Your company data has been refreshed successfully.",
        variant: "success",
      });

    } catch (error: any) {
      console.error("Error fetching user data:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      // Show the actual error message from backend
      toast({
        title: "Failed to Load Data",
        description: error.response?.data?.message || error.message || "Unknown error occurred",
        variant: "destructive",
      });

      // Fallback: try to fetch just credits if profile fails
      try {
        const creditsRes = await axios.get(
          "http://localhost:4000/api/v1/company/credits",
          { withCredentials: true }
        );
        
        if (creditsRes.data) {
          const sortedCredits = creditsRes.data.sort((a: Credit, b: Credit) => (b.amount || 0) - (a.amount || 0));
          setCredits(sortedCredits);
        }
      } catch (creditsError) {
        console.error("Failed to fetch credits as fallback:", creditsError);
      }
    } finally {
      setDataFetching(false);
      setLoading(false);
    }
  };
  
  // Function to handle verification submission
  const submitVerification = async (verificationData: any) => {
    if (!user) return;
    
    setLoading(true);
    const userId = (user as any)?._id;

    try {
      const response = await axios.post(
        `http://localhost:4000/api/v1/company/verify/${userId}`,
        verificationData,
        { withCredentials: true }
      );
      
      if (response.data.success) {
        setUserData(response.data.company);
        setVerificationStatus('verified');
        setShowVerificationForm(false);
        
        toast({
          title: "Verification Submitted Successfully! ✅",
          description: "Your company verification has been completed and approved.",
          variant: "success",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: response.data.message || "Failed to submit verification",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error submitting verification:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // --- derived metrics for dashboard analytics ---
  // Backend data should be used for purchased credits since available balance = purchased credits
  const backendBalance = userData?.credits?.balance || (user as any)?.credits?.balance || 0;
  const totalPurchased = backendBalance; // Available balance represents purchased credits
  const totalRetired = portfolio.retired.reduce((s: number, c: Credit) => s + (c.amount || 0), 0);
  const availableInWallet = Math.max(0, totalPurchased - totalRetired);
  const totalCartValue = cart.reduce(
    (sum: number, item: CartItem) => sum + item.credit.price * item.quantity,
    0
  );

  // Main data fetching effect
  useEffect(() => {
    if (user) {
      fetchAllUserData();
    }
  }, [user]);

  // Fetch marketplace credits (legacy function - now part of fetchAllUserData)
  useEffect(() => {
    const fetchCredits = async () => {
      // This is now handled by fetchAllUserData, keeping for backwards compatibility
      if (!userData && user) {
        try {
          const res = await axios.get("http://localhost:4000/api/v1/company/credits", {
            withCredentials: true
          });
          // Sort credits by amount (highest first)
          const sortedCredits = res.data.sort((a: Credit, b: Credit) => (b.amount || 0) - (a.amount || 0));
          setCredits(sortedCredits);

          // Optional: Fetch purchased and retired credits
          const portfolioRes = await axios.get(
            `http://localhost:4000/api/v1/company/portfolio/${(user as any)?._id ?? ''}`,
            { withCredentials: true }
          );
          setPortfolio({
            purchased: portfolioRes.data.purchased || [],
            retired: portfolioRes.data.retired || [],
            totalSpent: portfolioRes.data.totalSpent || 0,
            carbonReduction: portfolioRes.data.carbonReduction || 0
          });
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setLoading(false);
        }
      }
    };
    if (user && !userData) fetchCredits();
  }, [user, userData]);

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
      variant: "success",
    });
  };

<<<<<<< HEAD
  // Purchase credits
  const handlePurchase = async () => {
    if (!user) return alert("You must be logged in to purchase credits.");
    console.log("user", user);
    const token = localStorage.getItem("token");
    try {
      for (const item of cart) {
        await axios.patch(
          `http://localhost:4000/api/v1/company/purchase/${item.credit._id}`,
          { quantity: item.quantity, companyId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setPurchasedCredits([...purchasedCredits, ...cart.map((c) => c.credit)]);
      setCart([]);
    } catch (err: any) {
      console.error("Error purchasing credits:", err.response?.data || err.message);
||||||| fb06d59c
  // Purchase credits
  const handlePurchase = async () => {
    if (!user) return alert("You must be logged in to purchase credits.");
    const token = localStorage.getItem("token");
    try {
      for (const item of cart) {
        await axios.patch(
          `http://localhost:4000/api/v1/company/purchase/${item.credit._id}`,
          { quantity: item.quantity, companyId: user._id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setPurchasedCredits([...purchasedCredits, ...cart.map((c) => c.credit)]);
      setCart([]);
    } catch (err: any) {
      console.error("Error purchasing credits:", err.response?.data || err.message);
=======
  // Purchase credits - now opens payment confirmation page
  const handlePurchase = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits.",
        variant: "destructive",
      });
      return;
>>>>>>> test
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
      variant: "success",
    });
    
    // Refresh the data to get updated credits and portfolio
    if (user) {
      // Refetch credits
      axios.get("http://localhost:4000/api/v1/company/credits", {
        withCredentials: true
      }).then(res => {
        setCredits(res.data);
      }).catch(console.error);
      
      // Refetch portfolio
      axios.get(
        `http://localhost:4000/api/v1/company/portfolio/${(user as any)?._id ?? ''}`,
        { withCredentials: true }
      ).then(portfolioRes => {
        setPortfolio({
          purchased: portfolioRes.data.purchased || [],
          retired: portfolioRes.data.retired || [],
          totalSpent: portfolioRes.data.totalSpent || 0,
          carbonReduction: portfolioRes.data.carbonReduction || 0
        });
      }).catch(console.error);
    }
  };  

  // Retire credits
  const handleRetireCredits = (credit: Credit) => {
    setPortfolio(prev => ({
      ...prev,
      purchased: prev.purchased.filter((c: Credit) => c._id !== credit._id),
      retired: [...prev.retired, credit]
    }));
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
        onSubmitVerification={submitVerification}
        onVerificationSubmitted={() => {
          // Step 1: Close verification form and immediately verify
          setShowVerificationForm(false);
          setVerificationStatus('verified');
          
          // Step 2: Show success toast immediately
          toast({
            title: "🎉 Verification Complete!",
            description: "Your company has been successfully verified! You can now purchase carbon credits.",
            variant: "success",
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
            <p className="text-5xl font-bold text-foreground uppercase">
              Hello, {userData?.name || (user as any)?.name || 'Corporate Partner'}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-lg font-semibold text-foreground">
                {userData?.organization?.name || (user as any)?.organization?.name || 'Company Name'}
              </div>
              {dataFetching && (
                <Badge variant="outline" className="px-3 py-1 animate-pulse">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-spin mr-2"></div>
                  Loading Data...
                </Badge>
              )}
            </div>
            
            {/* Refresh Data Button */}
            <div className="mt-3 flex items-center gap-3">
              <Button
                onClick={fetchAllUserData}
                disabled={dataFetching}
                variant="outline"
                size="sm"
                className="bg-white/50 hover:bg-white/70"
              >
                {dataFetching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Fetching...
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Refresh Data
                  </>
                )}
              </Button>
              
              {userData && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 px-3 py-1">
                  ✓ Data Loaded
                </Badge>
              )}
            </div>
            
            {/* Carbon Footprint Display */}
            <div className="mt-4 p-4 bg-white/50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="text-lg font-medium text-gray-700">Company's Carbon Footprint:</div>
                <Badge className="bg-red-100 text-red-700 border-red-200 px-3 py-1">
                  {userData?.carbonFootprint || carbonFootprint} tonnes Carbon
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
                      <p className="text-5xl font-bold mt-1">{userData?.credits?.balance || (user as any)?.credits?.balance || 0}</p>
                      <p className="text-md text-emerald-100 mt-1">tCarbon Credits</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">Backend Balance: {userData?.credits?.balance || (user as any)?.credits?.balance || 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-sky-600 to-sky-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-lg font-medium">Purchased</p>
                      <p className="text-5xl font-bold mt-1">{userData?.credits?.balance || (user as any)?.credits?.balance || 0}</p>
                      <p className="text-md text-blue-100 mt-1">tCarbon Credits</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">Total Purchased Credits</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-violet-600 to-violet-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-lg font-medium">Retired</p>
                      <p className="text-5xl font-bold mt-1">{portfolio.retired.length}</p>
                      <p className="text-md text-purple-100 mt-1">tCarbon Offset</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">Carbon Reduction: {portfolio.carbonReduction || 0}t</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500 to-orange-400 text-white shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-lg font-medium">Transactions</p>
                      <p className="text-5xl font-bold mt-1">{userData?.transactions?.length || (user as any)?.transactions?.length || 0}</p>
                      <p className="text-md text-amber-100 mt-1">Total Transactions</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-md">Blockchain Records</span>
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
                  <CardDescription className="text-lg">Credits purchased by month - showing purchase trends</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {(() => {
                    // Get transactions from user data
                    const userTransactions = (userData?.transactions || (user as any)?.transactions || []);
                    const portfolioTransactions = [...portfolio.purchased, ...portfolio.retired];
                    const displayTransactions = userTransactions.length > 0 ? userTransactions : portfolioTransactions;
                    
                    // Process monthly data
                    const monthlyData: { [key: string]: number } = {};
                    const currentDate = new Date();
                    
                    // Initialize last 6 months
                    for (let i = 5; i >= 0; i--) {
                      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                      monthlyData[monthKey] = 0;
                    }
                    
                    // Aggregate transaction data by month
                    displayTransactions.forEach((transaction: any) => {
                      const transactionDate = new Date(transaction.timestamp || transaction.createdAt);
                      if (transactionDate) {
                        const monthKey = transactionDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                        const amount = transaction.quantity || transaction.amount || 0;
                        
                        if (monthlyData[monthKey] !== undefined) {
                          monthlyData[monthKey] += amount;
                        }
                      }
                    });
                    
                    const months = Object.keys(monthlyData);
                    const values = Object.values(monthlyData);
                    const maxValue = Math.max(...values, 50); // Minimum scale of 50
                    
                    return (
                      <div>
                        {/* Bar Chart */}
                        <div className="h-64 bg-gradient-to-br from-emerald-50 to-sky-50 rounded-lg p-4 border border-emerald-100">
                          <div className="flex items-end justify-between h-full space-x-2">
                            {months.map((month, index) => {
                              const value = values[index];
                              const height = Math.max((value / maxValue) * 100, 2); // Minimum 2% height for visibility
                              
                              return (
                                <div key={month} className="flex flex-col items-center flex-1">
                                  {/* Bar */}
                                  <div className="relative w-full flex items-end">
                                    <div
                                      className="w-full bg-gradient-to-t from-emerald-400 to-emerald-300 rounded-t-md border border-emerald-200 transition-all duration-300 hover:from-emerald-500 hover:to-emerald-400 cursor-pointer shadow-sm"
                                      style={{ height: `${height}%` }}
                                      title={`${month}: ${value} credits purchased`}
                                    >
                                      {/* Value label on top of bar */}
                                      {value > 0 && (
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-emerald-600 bg-white px-1 py-0.5 rounded shadow-sm border">
                                          {value}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  {/* Month label */}
                                  <div className="mt-2 text-xs font-medium text-gray-600 text-center">
                                    {month}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Summary Stats */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <div className="text-lg font-bold text-emerald-600">{values.reduce((a, b) => a + b, 0)}</div>
                            <div className="text-xs text-emerald-600">Total Credits</div>
                          </div>
                          <div className="text-center p-3 bg-sky-50 rounded-lg border border-sky-100">
                            <div className="text-lg font-bold text-sky-600">{Math.round(values.reduce((a, b) => a + b, 0) / 6)}</div>
                            <div className="text-xs text-sky-600">Avg/Month</div>
                          </div>
                          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="text-lg font-bold text-purple-600">{Math.max(...values)}</div>
                            <div className="text-xs text-purple-600">Peak Month</div>
                          </div>
                          <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                            <div className="text-lg font-bold text-orange-600">{displayTransactions.length}</div>
                            <div className="text-xs text-orange-600">Transactions</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
            
            {/* Digital Wallet Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-foreground">Digital Wallet</CardTitle>
                    <CardDescription className="text-lg">Carbon credit transactions and portfolio overview</CardDescription>
                  </div>
                  <Button 
                    onClick={fetchAllUserData} 
                    variant="outline" 
                    size="sm"
                    disabled={dataFetching}
                    className="bg-blue-50 hover:bg-blue-100"
                  >
                    {dataFetching ? "Loading..." : "🔄 Refresh Data"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4 font-medium text-md">Organization</th>
                            <th className="text-left p-4 font-medium text-md">Credits</th>
                            <th className="text-left p-4 font-medium text-md">Date</th>
                            <th className="text-left p-4 font-medium text-md">Status</th>
                            <th className="text-left p-4 font-medium text-md">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            console.log("🔥 Digital Wallet Debug:");
                            
                            // Get transactions directly from user data or userData
                            const userTransactions = (userData?.transactions || (user as any)?.transactions || []);
                            const portfolioTransactions = [...portfolio.purchased, ...portfolio.retired];
                            
                            console.log("User transactions from userData:", userTransactions.length);
                            console.log("Portfolio transactions:", portfolioTransactions.length);
                            console.log("User transactions data:", userTransactions);
                            
                            // Use user transactions if available, otherwise use portfolio data
                            const displayTransactions = userTransactions.length > 0 ? userTransactions : portfolioTransactions;
                            
                            if (displayTransactions.length === 0) {
                              return (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">
                                  No transactions yet
                                  <br />
                                  <small className="text-xs text-gray-400">
                                    User transactions: {userTransactions.length} | Portfolio transactions: {portfolioTransactions.length}
                                  </small>
                                </td></tr>
                              );
                            }
                            
                            return displayTransactions
                              .sort((a: any, b: any) => {
                                const dateA = new Date(a.timestamp || a.createdAt).getTime();
                                const dateB = new Date(b.timestamp || b.createdAt).getTime();
                                return dateB - dateA; // Most recent first
                              })
                              .map((transaction: any, index: number) => {
                                // Handle both user transaction format and portfolio format
                                const isUserTransaction = transaction.quantity !== undefined;
                                
                                const amount = isUserTransaction ? transaction.quantity : transaction.amount;
                                const price = isUserTransaction ? transaction.pricePerUnit : transaction.price;
                                const date = isUserTransaction ? transaction.timestamp : transaction.createdAt;
                                const status = isUserTransaction ? transaction.type : (portfolio.purchased.some(p => p._id === transaction._id) ? "PURCHASED" : "RETIRED");
                                
                                return (
                                  <tr key={`transaction-${index}`} className="border-b hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                      {isUserTransaction ? 
                                        `Transaction #${index + 1}` : 
                                        (transaction.ngoId?.organization?.name || transaction.ngoId?.name || 'Unknown NGO')
                                      }
                                    </td>
                                    <td className="p-4 font-medium">{amount || 0} tCarbon</td>
                                    <td className="p-4 text-sm text-muted-foreground">
                                      {date ? new Date(date).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="p-4">
                                      {status === 'PURCHASED' ? (
                                        <Badge className="bg-sky-100 text-sky-600 hover:bg-sky-200">Purchased</Badge>
                                      ) : (
                                        <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-200">Retired</Badge>
                                      )}
                                    </td>
                                    <td className="p-4 text-sm font-medium text-muted-foreground">
                                      {price ? `₹${price.toLocaleString()}` : '₹—'}
                                    </td>
                                  </tr>
                                );
                              });
                          })()}
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
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Available:</span>
                          <span className="font-medium text-sky-600">{availableInWallet}</span>
                        </div>
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Total Purchased:</span>
                          <span className="font-medium text-sky-600">{totalPurchased}</span>
                        </div>
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Total Retired:</span>
                          <span className="font-medium text-emerald-600">{totalRetired}</span>
                        </div>
                        <div className="flex justify-between text-md">
                          <span className="text-blue-600">Total Transactions:</span>
                          <span className="font-medium text-purple-600">
                            {(userData?.transactions?.length || (user as any)?.transactions?.length || portfolio.purchased.length + portfolio.retired.length)}
                          </span>
                        </div>
                        <div className="border-t pt-2 flex justify-between text-md">
                          <span className="text-blue-600">Portfolio Value:</span>
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
                    Transaction History
                  </h3>
                  
                  {(() => {
                    // Get transactions directly from user data or userData  
                    const userTransactions = (userData?.transactions || (user as any)?.transactions || []);
                    const portfolioTransactions = [...portfolio.purchased, ...portfolio.retired];
                    
                    // Use user transactions if available, otherwise use portfolio data
                    const displayTransactions = userTransactions.length > 0 ? userTransactions : portfolioTransactions;
                    
                    if (displayTransactions.length === 0) {
                      return (
                        <Card className="p-8 text-center">
                          <p className="text-muted-foreground">No transaction history yet.</p>
                        </Card>
                      );
                    }
                    
                    return (
                      <div className="bg-white rounded-lg shadow-sm border">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-4 font-medium">Transaction</th>
                                <th className="text-left p-4 font-medium">Credits</th>
                                <th className="text-left p-4 font-medium">Price</th>
                                <th className="text-left p-4 font-medium">Date</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {displayTransactions
                                .sort((a: any, b: any) => {
                                  const dateA = new Date(a.timestamp || a.createdAt).getTime();
                                  const dateB = new Date(b.timestamp || b.createdAt).getTime();
                                  return dateB - dateA; // Most recent first
                                })
                                .map((transaction: any, index: number) => {
                                  // Handle both user transaction format and portfolio format
                                  const isUserTransaction = transaction.quantity !== undefined;
                                  const amount = isUserTransaction ? transaction.quantity : transaction.amount;
                                  const price = isUserTransaction ? transaction.pricePerUnit : transaction.price;
                                  const date = isUserTransaction ? transaction.timestamp : transaction.createdAt;
                                  const status = isUserTransaction ? transaction.type : (portfolio.purchased.some(p => p._id === transaction._id) ? "PURCHASED" : "RETIRED");
                                  const canRetire = status === "PURCHASED";
                                  
                                  return (
                                    <tr key={`portfolio-transaction-${index}`} className="border-b hover:bg-muted/30 transition-colors">
                                      <td className="p-4">
                                        {isUserTransaction ? 
                                          `Transaction #${index + 1}` : 
                                          (transaction.ngoId?.organization?.name || transaction.ngoId?.name || 'Unknown NGO')
                                        }
                                      </td>
                                      <td className="p-4 font-medium">{amount || 0} tCarbon</td>
                                      <td className="p-4 text-sm">
                                        {price ? `₹${price.toLocaleString()}` : '₹—'}
                                      </td>
                                      <td className="p-4 text-sm text-muted-foreground">
                                        {date ? new Date(date).toLocaleDateString() : '—'}
                                      </td>
                                      <td className="p-4">
                                        {status === 'PURCHASED' ? (
                                          <Badge className="bg-sky-100 text-sky-600 hover:bg-sky-200">Active</Badge>
                                        ) : (
                                          <Badge className="bg-emerald-100 text-emerald-600 hover:bg-emerald-200">Retired</Badge>
                                        )}
                                      </td>
                                      <td className="p-4">
                                        {canRetire && (
                                          <Button
                                            onClick={() => handleRetireCredits(transaction)}
                                            variant="destructive"
                                            size="sm"
                                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1"
                                          >
                                            Retire
                                          </Button>
                                        )}
                                        {!canRetire && (
                                          <span className="text-xs text-emerald-600 font-medium">✓ Offset Complete</span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Keep only summary stats - remove duplicate sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <Card className="bg-gradient-to-br from-sky-50 to-sky-100 border-sky-200">
                    <CardContent className="p-6 text-center">
                      <div className="text-lg text-sky-600 font-medium mb-2">Active Investments</div>
                      <div className="text-3xl font-bold text-sky-600 mb-2">{totalPurchased}</div>
                      <div className="text-sm text-sky-600">Credits Purchased</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="p-6 text-center">
                      <div className="text-lg text-emerald-600 font-medium mb-2">Carbon Offset</div>
                      <div className="text-3xl font-bold text-emerald-600 mb-2">{totalRetired}</div>
                      <div className="text-sm text-emerald-600">Credits Retired</div>
                    </CardContent>
                  </Card>
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

              {user || userData ? (
                <>
                  {/* Basic Information */}
                  <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground">Company Information</CardTitle>
                      <CardDescription>
                        {userData ? "Complete data loaded from server" : "Basic information from auth context"}
                        {userData?.updatedAt && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Last updated: {new Date(userData.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                            <p className="text-lg font-semibold text-foreground uppercase mt-1">
                              {userData?.name || (user as any)?.name || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.email || (user as any)?.email || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Organization</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.organization?.name || (user as any)?.organization?.name || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Business Type</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.organization?.type || (user as any)?.organization?.type || 'CORPORATE'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">KYC Status</label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={
                                (userData?.kycStatus || (user as any)?.kycStatus) === 'VERIFIED' ? 'default' : 
                                (userData?.kycStatus || (user as any)?.kycStatus) === 'PENDING' ? 'secondary' : 
                                'destructive'
                              }>
                                {userData?.kycStatus || (user as any)?.kycStatus || 'NOT_VERIFIED'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Registration Number</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.registrationNumber || (user as any)?.registrationNumber || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">PAN Number</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.panNumber || (user as any)?.panNumber || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.phoneNumber || userData?.organization?.phone || (user as any)?.phoneNumber || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Website</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {(userData?.website || userData?.organization?.website || (user as any)?.website) ? (
                                <a 
                                  href={userData?.website || userData?.organization?.website || (user as any)?.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-emerald-600 hover:underline"
                                >
                                  {userData?.website || userData?.organization?.website || (user as any)?.website}
                                </a>
                              ) : '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {(userData?.createdAt || (user as any)?.createdAt) ? 
                                new Date(userData?.createdAt || (user as any)?.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : '—'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Blockchain & Wallet Information */}
                      <div className="border-t pt-8 mt-8">
                        <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                          <Wallet className="w-5 h-5" />
                          Blockchain & Wallet Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Credit Balance</label>
                              <p className="text-lg font-semibold text-emerald-600 mt-1">
                                {userData?.credits?.balance || (user as any)?.credits?.balance || 0} Credits
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Wallet Address</label>
                              <p className="text-sm font-mono text-foreground mt-1 break-all bg-gray-100 p-2 rounded">
                                {userData?.credits?.walletAddress || (user as any)?.credits?.walletAddress || '—'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Total Transactions</label>
                              <p className="text-lg font-semibold text-blue-600 mt-1">
                                {userData?.transactions?.length || (user as any)?.transactions?.length || 0}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Last Credit Update</label>
                              <p className="text-sm text-foreground mt-1">
                                {(userData?.credits?.lastUpdated || (user as any)?.credits?.lastUpdated) ? 
                                  new Date(userData?.credits?.lastUpdated || (user as any)?.credits?.lastUpdated).toLocaleString() : '—'}
                              </p>
                            </div>
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
                          <p className="text-lg font-semibold text-foreground mt-1">
                            {userData?.organization?.address || (user as any)?.organization?.address || '—'}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">City</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.city || (user as any)?.city || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">State</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.state || (user as any)?.state || '—'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">PIN Code</label>
                            <p className="text-lg font-semibold text-foreground mt-1">
                              {userData?.pincode || (user as any)?.pincode || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Business Information */}
                  {(userData?.kycStatus === 'VERIFIED' || (user as any)?.kycStatus === 'VERIFIED') && (
                    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-semibold text-foreground">Business Information</CardTitle>
                      </CardHeader>
                      <CardContent className="p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Employee Count</label>
                              <p className="text-lg font-semibold text-foreground mt-1">
                                {userData?.organization?.employeeCount || (user as any)?.employeeCount || '—'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Incorporation Date</label>
                              <p className="text-lg font-semibold text-foreground mt-1">
                                {(userData?.organization?.incorporationDate || (user as any)?.incorporationDate) ? 
                                  new Date(userData?.organization?.incorporationDate || (user as any)?.incorporationDate).toLocaleDateString() : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Tax ID/GST</label>
                              <p className="text-lg font-semibold text-foreground mt-1">
                                {userData?.taxId || (user as any)?.taxId || '—'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
                              <p className="text-lg font-semibold text-foreground mt-1">
                                {userData?.contactPersonName || (user as any)?.contactPersonName || '—'}
                                {(userData?.contactPersonDesignation || (user as any)?.contactPersonDesignation) && (
                                  <span className="text-sm text-muted-foreground block">
                                    {userData?.contactPersonDesignation || (user as any)?.contactPersonDesignation}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {(userData?.organization?.businessDescription || (user as any)?.businessDescription) && (
                          <div className="mt-8 pt-6 border-t">
                            <label className="text-sm font-medium text-muted-foreground">Business Description</label>
                            <p className="text-base text-foreground mt-2 leading-relaxed">
                              {userData?.organization?.businessDescription || (user as any)?.businessDescription}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Portfolio Summary */}
                  <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-blue-50">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground">Portfolio Summary</CardTitle>
                      <CardDescription>
                        Your complete carbon credit transaction history
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-emerald-600 mb-1">{totalPurchased}</div>
                          <p className="text-sm text-muted-foreground">Credits Purchased</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600 mb-1">{totalRetired}</div>
                          <p className="text-sm text-muted-foreground">Credits Retired</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-purple-600 mb-1">{availableInWallet}</div>
                          <p className="text-sm text-muted-foreground">Available Credits</p>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-orange-600 mb-1">
                            ₹{portfolio.totalSpent || (totalPurchased * 15)}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Invested</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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