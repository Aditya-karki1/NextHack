import { type FC } from 'react';
// framer-motion intentionally not used (not in dependencies); using simple CSS transitions instead
import { Check } from 'lucide-react';
import axios from 'axios';
// Using plain markup for the subscription page to avoid unused component imports
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

type Plan = {
  id: string;
  title: string;
  price: string;
  period: string;
  features: string[];
  highlight?: boolean;
};

const plans: Plan[] = [
  { id: 'monthly', title: '1 Month', price: '₹299', period: '/month', features: ['5 requests in month', 'Email support', 'Cancel anytime'] },
  { id: 'six', title: '6 Months', price: '₹1,499', period: '/6 months', features: ['50 requests in total', 'Priority support', '5% discount'], highlight: true },
  { id: 'yearly', title: '1 Year', price: '₹2,499', period: '/year', features: ['120 requests in total', 'Best value', 'Dedicated support', '20% discount'] },
];

function loadScript(src: string) {
  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const Subscription: FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const handleSubmit = async (planId: string) => {
    const type = planId === 'monthly' ? 'first' : planId === 'six' ? 'second' : 'third';
    const amount = planId === 'monthly' ? 299 : planId === 'six' ? 1499 : 2499;

    try {
      console.debug('[Subscription] starting payment', { planId, type, amount });
      // Load Razorpay SDK
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!res) {
        toast({ title: 'Error', description: 'Razorpay SDK failed to load. Check your Internet connection.' });
        return;
      }
      console.debug('[Subscription] razorpay SDK loaded');

      // Create order on backend
      let orderResponse;
      try {
        orderResponse = await axios.post('http://localhost:4000/api/v1/ngo/capture-payment', { type, amount }, { withCredentials: true });
      } catch (err: any) {
        console.error('[Subscription] order create request failed full error:', err);
        const serverMsg = err?.response?.data?.message || err?.message || 'Order creation failed';
        const details = err?.response?.data?.details || err?.response?.data || null;
        console.debug('[Subscription] order create details:', details);
        // show concise message but log full details
        toast({ title: 'Order error', description: serverMsg });
        return;
      }

      const orderData = orderResponse?.data?.order;
      if (!orderData) {
        console.error('[Subscription] order creation returned no order', orderResponse?.data);
        toast({ title: 'Order error', description: orderResponse?.data?.message || 'Server did not return an order.' });
        return;
      }
      console.debug('[Subscription] order created', orderData);

      const razorKey = (import.meta as any).env.VITE_RAZORPAY_KEY_ID;
      if (!razorKey) {
        console.error('[Subscription] missing VITE_RAZORPAY_KEY_ID');
        toast({ title: 'Config error', description: 'Razorpay key is not configured in the frontend (VITE_RAZORPAY_KEY_ID).' });
        return;
      }

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID, // frontend key
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: 'Eco Chain',
        description: 'Thank you for getting the Subscription.',
        handler: async function (response: any) {
          try {
            // send top-level fields expected by backend
            const payload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              type,
            };

            const verifyRes = await axios.post('http://localhost:4000/api/v1/ngo/verify-payment', payload, { withCredentials: true });
            if (verifyRes.data?.success) {
              // mark recent subscription so the NGO dashboard can show immediate feedback
              try { localStorage.setItem('recentSubscribed', JSON.stringify({ at: Date.now(), ngo: verifyRes.data?.ngo || null })); } catch (e) { /* ignore */ }
              toast({ title: 'Success', description: 'Payment verified successfully!' });
              // after successful purchase, navigate back to previous page/dashboard
              setTimeout(() => navigate(-1), 900);
            } else {
              toast({ title: 'Error', description: verifyRes.data?.message || 'Payment verification failed!' });
            }
          } catch (err) {
            console.error('VERIFY ERROR', err);
            toast({ title: 'Error', description: 'Verification error!' });
          }
        },
        prefill: {
          name: authUser?.name || 'Test User',
          // AuthContext User type does not include email/phone. Use static fallbacks here.
          email: 'test@example.com',
          contact: '9999999999',
        },
        theme: { color: '#10B981' },
      } as any;

      if (!(window as any).Razorpay) {
        console.error('[Subscription] window.Razorpay is not available');
        toast({ title: 'Error', description: 'Razorpay checkout is not available.' });
        return;
      }

      let paymentObject;
      try {
        paymentObject = new (window as any).Razorpay(options);
      } catch (err) {
        console.error('[Subscription] Razorpay instantiation failed', err);
        toast({ title: 'Error', description: 'Failed to initialize Razorpay.' });
        return;
      }

      try {
        paymentObject.open();
      } catch (err) {
        console.error('[Subscription] open() failed', err);
        toast({ title: 'Error', description: 'Failed to open payment modal.' });
      }
    } catch (error) {
      // Provide more details when available
      console.error('PAYMENT API ERROR', error);
      const msg = (error as any)?.response?.data?.message || (error as any)?.message || 'Could not make payment.';
      toast({ title: 'Error', description: msg });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50 p-6">
      <div className="w-full max-w-6xl">
        <header className="mb-10 text-center">
          <h1 className="text-3xl md:text-6xl font-extrabold text-emerald-900">Choose your plan</h1>
          <p className="mt-2 text-lg  text-emerald-700">Simple, transparent pricing. Change or cancel anytime.</p>
        </header>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl h-[450px] p-6 md:p-8 shadow-lg border transform transition-all duration-300 ease-out delay-[${idx * 80}ms] ${plan.highlight ? 'bg-white border-emerald-200 shadow-2xl' : 'bg-white/95 border-transparent'}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-md font-semibold bg-emerald-100 text-emerald-800 shadow">Best value</span>
                </div>
              )}
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-emerald-900">{plan.title}</h2>
                  <div className="mt-2 flex items-baseline gap-x-2">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-sm text-emerald-600">{plan.period}</span>
                  </div>
                </div>
                <ul className="mb-6 space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-emerald-700">
                      <Check size={16} />
                      <span className="text-sm">{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <button
                    className={`w-full py-3 rounded-xl font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 ${plan.highlight ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-transparent border border-emerald-200 text-emerald-800 hover:bg-emerald-50'}`}
                    onClick={() => handleSubmit(plan.id)}>
                    {plan.highlight ? 'Get started' : 'Select'}
                  </button>
                </div>
                <small className="mt-3 text-xs text-emerald-500">• Secure payments</small>
                <small className="mt-1 text-xs text-emerald-500">• Cancel anytime</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscription;
