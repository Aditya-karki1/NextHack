import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Receipt, CreditCard } from "lucide-react";
import axios from "axios";

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

interface PaymentConfirmationProps {
  cart: CartItem[];
  user: any;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export default function PaymentConfirmation({ cart, user, onBack, onPaymentSuccess }: PaymentConfirmationProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate payment breakdown
  const subtotal = cart.reduce((sum, item) => sum + (item.credit.price * item.quantity), 0);
  const platformFeeRate = 0.05; // 5%
  const gstRate = 0.18; // 18%
  
  const platformFee = subtotal * platformFeeRate;
  const taxableAmount = subtotal + platformFee;
  const gst = taxableAmount * gstRate;
  const totalAmount = Math.round(taxableAmount + gst);

  // Group cart items by NGO
  const ngoGroups = cart.reduce((acc, item) => {
    const ngoId = item.credit.ngoId?._id || 'unknown';
    const ngoName = item.credit.ngoId?.organization?.name || item.credit.ngoId?.name || 'Unknown NGO';
    
    if (!acc[ngoId]) {
      acc[ngoId] = {
        ngoName,
        ngoId,
        items: [],
        totalCredits: 0,
        totalAmount: 0
      };
    }
    
    acc[ngoId].items.push(item);
    acc[ngoId].totalCredits += item.quantity;
    acc[ngoId].totalAmount += item.credit.price * item.quantity;
    
    return acc;
  }, {} as Record<string, any>);

  const handlePayment = async () => {
    if (!user) return alert("You must be logged in to make payment.");
    setIsProcessing(true);

    try {
      // Load Razorpay SDK
      const loadScript = (src: string) => new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      const sdkLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!sdkLoaded) {
        alert('Failed to load payment SDK. Please check your internet connection.');
        return;
      }

      const token = localStorage.getItem("token");

      // Create order for total amount
      let orderRes;
      try {
        console.debug('[PaymentConfirmation] initiating payment for total amount', { totalAmount, cartItems: cart.length });
        orderRes = await axios.post(
          'http://localhost:4000/api/v1/company/capture-payment',
          { 
            amount: totalAmount, 
            metadata: { 
              cartItems: cart.map(item => ({ creditId: item.credit._id, quantity: item.quantity })),
              companyId: user?._id ?? '',
              breakdown: { subtotal, platformFee, gst, totalAmount }
            } 
          },
          { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, withCredentials: true }
        );
      } catch (err: any) {
        console.error('[PaymentConfirmation] Order create failed', {
          message: err?.message,
          status: err?.response?.status,
          responseData: err?.response?.data,
        });
        const serverMsg = err?.response?.data?.message || err?.message || 'Unknown error';
        alert(`Failed to initiate payment. Server: ${serverMsg}`);
        return;
      }

      const orderData = orderRes?.data?.order;
      if (!orderData) {
        console.error('[PaymentConfirmation] Order creation returned no order:', orderRes?.data);
        alert('Server did not return order data. Please try again.');
        return;
      }

      const razorKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
      if (!razorKey) {
        alert('Payment configuration missing. Contact admin.');
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: razorKey,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: 'Eco Chain - Carbon Credits',
        description: `Purchase ${cart.length} carbon credit packages`,
        handler: async function(resp: any) {
          try {
            console.debug('[PaymentConfirmation] Verifying payment on server', { 
              orderId: resp?.razorpay_order_id, 
              paymentId: resp?.razorpay_payment_id 
            });

            // Verify payment
            const verifyRes = await axios.post(
              'http://localhost:4000/api/v1/company/verify-payment',
              {
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                metadata: { 
                  cartItems: cart.map(item => ({ creditId: item.credit._id, quantity: item.quantity })),
                  companyId: user?._id ?? ''
                }
              },
              { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, withCredentials: true }
            );

            if (verifyRes.data?.success) {
              // Process each cart item purchase
              for (const item of cart) {
                await axios.patch(
                  `http://localhost:4000/api/v1/company/purchase/${item.credit._id}`,
                  { quantity: item.quantity, companyId: user?._id ?? '' },
                  { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, withCredentials: true }
                );
              }

              console.info('[PaymentConfirmation] All purchases completed successfully');

              // Generate receipt
              try {
                const receiptHtml = `
                  <!doctype html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <title>Payment Receipt - Eco Chain</title>
                      <style>
                        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                        .header { text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                        .company-info { margin-bottom: 30px; }
                        .breakdown { margin: 20px 0; }
                        .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #10b981; padding-top: 10px; }
                        .ngo-section { margin: 20px 0; padding: 15px; background: #f0fdf4; border-left: 4px solid #10b981; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>Eco Chain - Carbon Credits Purchase Receipt</h1>
                        <p>Payment ID: ${resp.razorpay_payment_id}</p>
                        <p>Order ID: ${resp.razorpay_order_id}</p>
                        <p>Date: ${new Date().toLocaleString()}</p>
                      </div>
                      
                      <div class="company-info">
                        <h3>Company Details</h3>
                        <p><strong>Company:</strong> ${user?.name || ''}</p>
                        <p><strong>Organization:</strong> ${user?.organization?.name || ''}</p>
                      </div>
                      
                      <h3>Purchase Details</h3>
                      ${Object.values(ngoGroups).map((group: any) => `
                        <div class="ngo-section">
                          <h4>${group.ngoName}</h4>
                          <p>Credits: ${group.totalCredits} tCO₂</p>
                          <p>Amount: ₹${group.totalAmount.toFixed(2)}</p>
                        </div>
                      `).join('')}
                      
                      <div class="breakdown">
                        <h3>Payment Breakdown</h3>
                        <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
                        <p>Platform Fee (5%): ₹${platformFee.toFixed(2)}</p>
                        <p>GST (18%): ₹${gst.toFixed(2)}</p>
                        <p class="total">Total Amount: ₹${totalAmount.toFixed(2)}</p>
                      </div>
                    </body>
                  </html>
                `;
                
                const blob = new Blob([receiptHtml], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `carbon_credits_receipt_${Date.now()}.html`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.warn('Could not generate receipt download', e);
              }

              alert('Payment successful! Receipt downloaded. Redirecting to dashboard...');
              onPaymentSuccess();
            } else {
              console.error('Payment verification failed', verifyRes.data);
              alert('Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            console.error('[PaymentConfirmation] Error during verification/purchase', {
              message: err?.message,
              responseStatus: err?.response?.status,
              responseData: err?.response?.data,
            });
            alert('Error processing payment. Please contact support.');
          }
        },
        prefill: {
          name: user?.name || 'Corporate',
          email: user?.email || 'company@example.com',
          contact: user?.phone || '9999999999',
        },
        theme: { color: '#10B981' },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
            setIsProcessing(false);
          }
        }
      } as any;

      if (!(window as any).Razorpay) {
        alert('Razorpay is not available in this browser.');
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error("Error in payment process:", err.response?.data || err.message);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ecfdf5] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Marketplace
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Payment Confirmation</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Order Details */}
          <div className="space-y-6">
            {/* NGO Details */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.values(ngoGroups).map((group: any) => (
                  <div key={group.ngoId} className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-lg">{group.ngoName}</h4>
                      <Badge className="bg-emerald-100 text-emerald-600">Verified</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Credits: {group.totalCredits} tCO₂</p>
                      <p>Amount: ₹{group.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Company Details */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Billing Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Company:</strong> {user?.name || ''}</p>
                  <p><strong>Organization:</strong> {user?.organization?.name || ''}</p>
                  <p><strong>Email:</strong> {user?.email || ''}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Payment Breakdown */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Payment Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} credits)</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee (5%)</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>GST (18%)</span>
                    <span>₹{gst.toFixed(2)}</span>
                  </div>
                  
                  <hr />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span>₹{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold shadow-lg"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isProcessing ? 'Processing...' : `Pay ₹${totalAmount.toFixed(2)}`}
                </Button>

                <div className="text-xs text-center text-muted-foreground space-y-1">
                  <p>🔒 Secure payment powered by Razorpay</p>
                  <p>Your payment information is encrypted and secure</p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Accepted Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Credit Cards</Badge>
                  <Badge variant="outline">Debit Cards</Badge>
                  <Badge variant="outline">UPI</Badge>
                  <Badge variant="outline">Net Banking</Badge>
                  <Badge variant="outline">Wallets</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}