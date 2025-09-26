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
          `http://localhost:4000/api/v1/company/portfolio/${user?._id}`,
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
          { quantity: item.quantity, companyId: user._id },
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

  const totalCartValue = cart.reduce(
    (sum, item) => sum + item.credit.price * item.quantity,
    0
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* ------------------- Marketplace ------------------- */}
        <TabsContent value="marketplace">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Carbon Credit Marketplace</h2>
            {cart.length > 0 && (
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  {cart.length} items • ${totalCartValue.toFixed(2)}
                </Badge>
                <Button
                  onClick={handlePurchase}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Purchase & Mint Tokens
                </Button>
              </div>
            )}
          </div>
          <div className="grid gap-4">
            {credits.map((credit) => (
              <Card key={credit._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">
                      {credit.ngoId?.organization?.name || credit.ngoId?.name || "Unknown NGO"}
                    </h3>
                    <div className="text-sm text-gray-600 mb-2">
                      {credit.ngoId?.organization?.type || "NGO"} •{" "}
                      {credit.ngoId?.organization?.address || "No address"}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline">{credit.amount} tonnes CO₂</Badge>
                      <Badge variant="outline">${credit.price}/tonne</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button
                      onClick={() => handleAddToCart(credit)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------- Portfolio / Transactions ------------------- */}
        <TabsContent value="portfolio">
          <h2 className="text-2xl font-bold mb-4">Your Transactions</h2>
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Purchased Credits</h3>
            {purchasedCredits.length === 0 && <p>No purchased credits yet.</p>}
            {purchasedCredits.map((credit) => (
              <Card key={credit._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex justify-between">
                  <div>
                    <p>{credit.ngoId?.organization?.name || credit.ngoId?.name || "Unknown NGO"}</p>
                    <p>{credit.amount} tonnes CO₂ • ${credit.price}/tonne</p>
                  </div>
                  <Button
                    onClick={() => handleRetireCredits(credit)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Retire
                  </Button>
                </CardContent>
              </Card>
            ))}

            <h3 className="font-semibold text-lg mt-6">Retired Credits</h3>
            {retiredCredits.length === 0 && <p>No retired credits yet.</p>}
            {retiredCredits.map((credit) => (
              <Card key={credit._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <p>{credit.ngoId?.organization?.name || credit.ngoId?.name || "Unknown NGO"}</p>
                  <p>{credit.amount} tonnes CO₂ • ${credit.price}/tonne (Retired)</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------- Profile / Personal Details ------------------- */}
        <TabsContent value="profile">
          <h2 className="text-2xl font-bold mb-4">Company Details</h2>
          {user ? (
            <Card className="p-6">
              <p><strong>Name:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Organization:</strong> {user.organization?.name}</p>
              <p><strong>Organization Type:</strong> {user.organization?.type}</p>
              <p><strong>Address:</strong> {user.organization?.address}</p>
              <p><strong>KYC Status:</strong> {user.kycStatus}</p>
            </Card>
          ) : (
            <p>No user logged in.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
