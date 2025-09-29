import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Wallet, CheckCircle, Clock, Camera, Coins, TrendingUp, Users, Leaf, Award } from 'lucide-react';
// axios removed (not used here) to avoid unused import lint error
import StatCard from '@/components/analytics/StatCard';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import MRVReportModal from '@/components/analytics/MRVReportModal';
import MRVDetailsModal from './analytics/MRVDetailsModal';

type Task = {
  id: string;
  title: string;
  location: string;
  treeCount: number;
  targetTrees: number;
  species?: string[];
    status: 'Created' | 'Assigned' | 'InProgress' | 'Completed' | 'Verified' | 'UnderVerification' | 'Requested';
  ngoId?: string;
  requestedBy?: string[];
  carbonCredits?: number;
};

export default function NGODashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('marketplace');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [ngoDetails, setNgoDetails] = useState<any | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [mrvReports, setMrvReports] = useState<any[]>([]);
  const { user } = useAuth();
  const currentUserId: string | null = user?.id ?? null;
  const navigate = useNavigate();
  
  // Dashboard stats from backend
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    completedProjects: 0, 
    activeProjects: 1,
    totalCreditsEarned: 0,
    availableCredits: 30,
    kycStatus: 'PENDING'
  });
  
  // Legacy states (will be replaced with real data)
  const [loading, setLoading] = useState<boolean>(true);
  const [dataFetching, setDataFetching] = useState<boolean>(false);
  
  // Modal states
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [mrvOpen, setMrvOpen] = useState(false);
  const [mrvProjectId, setMrvProjectId] = useState<string | null>(null);
  const [mrvDetailsOpen, setMrvDetailsOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  // track recently cancelled project ids with expiry timestamp (ms)
  const [recentlyCancelled, setRecentlyCancelled] = useState<Record<string, number>>({});
  // temporarily highlight a project card after cancel (for animation)
  const [highlightedProject, setHighlightedProject] = useState<string | null>(null);
  
  // Form states for verification (prefilled so profile shows useful details)
  const [ngoName, setNgoName] = useState<string>('Green Earth NGO');
  const [ngoType, setNgoType] = useState<string | undefined>('Environmental NGO');
  const [govtDoc, setGovtDoc] = useState<File | null>(null);
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [email, setEmail] = useState<string>('contact@greenearthngo.org');
  const [address, setAddress] = useState<string>('New Delhi, India - 110001');
  // geoBoundary was unused and removed to avoid lint warning
  const [errors, setErrors] = useState<Record<string, string>>({});
  // local flag set by subscription flow to show immediate subscribed UI before server sync
  const [recentSubscribed, setRecentSubscribed] = useState<boolean>(false);
  
  // Credit selling states
  const [sellAmount, setSellAmount] = useState<number>(0);
  const [pricePerCredit, setPricePerCredit] = useState<number>(15);
  const [selling, setSelling] = useState(false);
  // removed duplicate ngoDetail - use ngoDetails/setNgoDetails above

  const handleGetSubscription = () => {
    // navigate to subscription page
    navigate('/subscription');
  };
  
  // Comprehensive NGO dashboard data fetching
  const fetchDashboardData = async () => {
    if (!currentUserId) return;
    
    setDataFetching(true);
    try {
      console.log("🔄 Fetching NGO dashboard data for ID:", currentUserId);
      
      // Fetch dashboard stats
      const dashboardRes = await axios.get(
        `http://localhost:4000/api/v1/ngo/dashboard/${currentUserId}`,
        { withCredentials: true }
      );
      
      if (dashboardRes.data.success) {
        const { stats, profile, recentMRVRecords } = dashboardRes.data.data;
        
        setDashboardStats({
          totalProjects: stats.totalProjects || 0,
          completedProjects: stats.completedProjects || 0,
          activeProjects: stats.activeProjects || 1,
          totalCreditsEarned: stats.totalCreditsEarned || 0,
          availableCredits: stats.availableCredits || 30,
          kycStatus: stats.kycStatus || 'PENDING'
        });
        
        setNgoDetails(profile);
        setIsVerified(stats.kycStatus === 'VERIFIED');
        
        console.log("✅ Dashboard stats loaded:", stats);
        
        // Set recent MRV records
        if (recentMRVRecords && recentMRVRecords.length > 0) {
          setMrvReports(recentMRVRecords);
        }
      }
      
      // Fetch projects
      const projectsRes = await axios.get(
        `http://localhost:4000/api/v1/ngo/projects/${currentUserId}`,
        { withCredentials: true }
      );
      
      if (projectsRes.data.success) {
        const projects = projectsRes.data.projects || [];
        setAllProjects(projects);
        console.log("✅ Projects loaded:", projects.length);
      }
      
      // Fetch MRV reports
      const mrvRes = await axios.get(
        `http://localhost:4000/api/v1/ngo/mrv-reports/${currentUserId}`,
        { withCredentials: true }
      );
      
      if (mrvRes.data.success) {
        const reports = mrvRes.data.reports || [];
        setMrvReports(reports);
        console.log("✅ MRV reports loaded:", reports.length);
      }
      
      toast({
        title: "Dashboard Updated",
        description: "Your NGO data has been refreshed successfully.",
        variant: "success",
      });
      
    } catch (error: any) {
      console.error("❌ Error fetching dashboard data:", error);
      toast({
        title: "Data Loading Error",
        description: error.response?.data?.message || "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setDataFetching(false);
      setLoading(false);
    }
  };
  
  // mockTasks removed; data is fetched from backend

  // Fetch data from backend: projects list, NGO profile, and available credits (legacy)
  const fetchAll = async () => {
    try {
  // Fetch all projects (marketplace)
  const projectsRes = await axios.get('http://localhost:4000/api/v1/gov/projects');
  const projects = projectsRes.data?.projects || [];
  setAllProjects(projects);

      // Determine available vs my tasks
      const my = [] as Task[];
      const available = [] as Task[];
        projects.forEach((p: any) => {
        const asTask: Task = {
          id: p._id,
          title: p.title,
          location: p.location?.type === 'Point' && Array.isArray(p.location.coordinates) ? `${p.location.coordinates[1]}, ${p.location.coordinates[0]}` : (p.location?.name || p.location || ''),
          treeCount: p.treeCount || p.targetTrees || 0,
          targetTrees: p.targetTrees || p.treeCount || 0,
          status: p.status || 'Created',
          ngoId: p.ngoId?._id || p.ngoId || undefined,
            requestedBy: Array.isArray(p.requestedBy) ? p.requestedBy.map((x: any) => String(x)) : [],
          carbonCredits: p.carbonCredits || p.credits || 0,
        };

  const requested = Array.isArray(p.requestedBy) && currentUserId ? p.requestedBy.map((x:any) => String(x)).includes(currentUserId) : false;
  // p.ngoId may be populated (object) or a raw id string. Normalize to id string.
  const projectNgoId = p.ngoId && (p.ngoId._id ? String(p.ngoId._id) : String(p.ngoId));
  const assignedToMe = Boolean(currentUserId && projectNgoId && String(projectNgoId) === String(currentUserId));

        // Include both assigned projects and projects requested by this NGO in "My Projects".
        // Requested projects will be visible here with status 'Requested' until the government assigns them.
        if (assignedToMe) {
          my.push(asTask);
        } else if (requested) {
          my.push({ ...asTask, status: 'Requested' as any });
        }

  // Available projects are those that are currently unassigned (no ngoId), not completed,
  // and not already requested by the current user. This ensures that if the current user
  // cancels a request (server removes them from requestedBy), the project reappears in
  // the marketplace and other NGOs can request it.
  const isUnassigned = !p.ngoId;
  const isNotCompleted = asTask.status !== 'Completed';
  if (isUnassigned && isNotCompleted && !requested) available.push(asTask);
      });

      setMyTasks(my);
      setAvailableTasks(available);

      // Fetch NGO profile
      if (currentUserId) {
        try {
          const res = await axios.get(`http://localhost:4000/api/v1/ngo/${currentUserId}`, { withCredentials: true });
          console.log("NGOPortal fetched ngo profile:", res.data);
          setNgoDetails(res.data.ngo);
          console.log("NGOPortal ngoDetails set to:", res.data.ngo);
          const ngo = res.data.ngo;
          if (ngo) {
            setNgoName(ngo.name || ngo.organization?.name || ngoName);
            setNgoType(ngo.organization?.type || ngoType);
            setAddress(ngo.organization?.address || address);
            setPhone(ngo.organization?.contact?.phone || phone);
            setEmail(ngo.email || ngo.organization?.contact?.email || email);
              setIsVerified(ngo.kycStatus === 'VERIFIED' || ngo.kycStatus === 'APPROVED');
              setNgoDetails(ngo);
          }
        } catch (err) {
          console.debug('Failed to fetch NGO profile', err);
        }

        // Fetch MRV reports submitted by this NGO
        try {
          const mrvRes = await axios.get(`http://localhost:4000/api/v1/mrv/user/${currentUserId}`, { withCredentials: true });
          const records = mrvRes?.data?.records || [];
          setMrvReports(records);
        } catch (err) {
          console.debug('Failed to fetch MRV reports', err);
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    }
  };

  useEffect(() => {
    // Use new comprehensive dashboard data fetching
    if (currentUserId) {
      fetchDashboardData();
    }
    
    // Fallback: run legacy fetch for projects marketplace
    fetchAll();
  }, [currentUserId]);

  // Read recentSubscribed flag (set by subscription page) so we can show immediate feedback
  useEffect(() => {
    try {
      const raw = localStorage.getItem('recentSubscribed');
      if (raw) {
        const parsed = JSON.parse(raw);
        const at = parsed?.at;
        const TTL = 5 * 60 * 1000; // 5 minutes
        if (at && Date.now() - at < TTL) {
          setRecentSubscribed(true);
        } else {
          localStorage.removeItem('recentSubscribed');
        }
      }
    } catch (e) {
      // malformed value - clear
      localStorage.removeItem('recentSubscribed');
    }
  }, []);

  // If server profile confirms subscription (requestCall > 0) clear the local flag
  useEffect(() => {
    if (recentSubscribed && ngoDetails && typeof ngoDetails.requestCall !== 'undefined' && ngoDetails.requestCall > 0) {
      localStorage.removeItem('recentSubscribed');
      setRecentSubscribed(false);
    }
  }, [ngoDetails, recentSubscribed]);

  // Legacy calculations (now replaced with backend data)
  // const completedProjects = myTasks.filter(t => t.status === 'Completed').length;
  // const activeProjects = myTasks.filter(t => t.status === 'InProgress').length;
  // const totalCreditsEarned = myTasks
  //   .filter(t => t.status === 'Completed')
  //   .reduce((sum, task) => sum + (task.carbonCredits || 0), 0);

  const clearError = (field: string) => setErrors(prev => {
    const copy = { ...prev };
    delete copy[field];
    return copy;
  });

  const openMrvFor = (projectId: string) => {
    setMrvProjectId(projectId);
    setMrvOpen(true);
  };

  const handleRequestTask = async (taskId: string) => {
    if (!currentUserId) {
      toast({ 
        title: 'Authentication Required', 
        description: 'You must be logged in to request a task.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:4000/api/v1/gov/projects/${taskId}/request`, 
        { requestedBy: currentUserId }, 
        { withCredentials: true }
      );
      
      if (res.status === 200 || res.status === 201) {
        const isSuccess = res.data?.success !== false && !res.data?.error;
        
        if (isSuccess) {
          toast({ 
            title: 'Request Submitted Successfully! 🎯', 
            description: 'Your task request has been submitted and is now pending approval.',
            variant: 'default'
          });
          
          // Re-fetch all data to reflect updated project state and balances
          try { 
            await fetchAll(); 
          } catch (e) { 
            console.debug('Refresh after request failed', e); 
          }
        } else {
          toast({ 
            title: 'Request Failed', 
            description: res.data?.message || 'Unable to submit task request.',
            variant: 'destructive'
          });
        }
      } else {
        toast({ 
          title: 'Request Failed', 
          description: `Server responded with status: ${res.status}`,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Request project failed', err?.response?.data || err.message || err);
      
      if (err?.response?.status === 401) {
        toast({ 
          title: 'Authentication Error', 
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
      } else if (err?.response?.status === 400) {
        toast({ 
          title: 'Invalid Request', 
          description: err?.response?.data?.message || 'This project may no longer be available.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Network Error', 
          description: 'Failed to submit request. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleCancelRequest = async (taskId: string) => {
    if (!currentUserId) {
      toast({ 
        title: 'Authentication Required', 
        description: 'You must be logged in to cancel a request.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const res = await axios.put(
        `http://localhost:4000/api/v1/gov/projects/${taskId}/cancel-request`, 
        { requestedBy: currentUserId }, 
        { withCredentials: true }
      );
      
      if (res.status === 200 || res.status === 201) {
        const isSuccess = res.data?.success !== false && !res.data?.error;
        
        if (isSuccess) {
          toast({ 
            title: 'Request Cancelled Successfully! ✅', 
            description: 'Your request has been cancelled and the project is available again.',
            variant: 'default'
          });
          
          // Mark recently cancelled with TTL (e.g., 2 minutes)
          const TTL = 2 * 60 * 1000; // 2 minutes in ms
          setRecentlyCancelled(prev => ({ ...prev, [taskId]: Date.now() + TTL }));
          
          // Highlight the project and switch the UI to marketplace so NGOs can re-request
          setHighlightedProject(taskId);
          setActiveTab('marketplace');
          
          try { 
            await fetchAll(); 
          } catch (e) { 
            console.debug('Refresh after cancel failed', e); 
          }
          
          // Remove highlight after animation
          setTimeout(() => setHighlightedProject(null), 3500);
          
          // Additional informational toast
          setTimeout(() => {
            toast({ 
              title: 'Project Available in Marketplace 📍', 
              description: 'The project is now available for other NGOs to request.',
              variant: 'default'
            });
          }, 1000);
        } else {
          toast({ 
            title: 'Cancellation Failed', 
            description: res.data?.message || 'Unable to cancel the request.',
            variant: 'destructive'
          });
        }
      } else {
        toast({ 
          title: 'Cancellation Failed', 
          description: `Server responded with status: ${res.status}`,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Cancel request failed', err?.response?.data || err.message || err);
      
      if (err?.response?.status === 401) {
        toast({ 
          title: 'Authentication Error', 
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
      } else if (err?.response?.status === 400) {
        toast({ 
          title: 'Invalid Request', 
          description: err?.response?.data?.message || 'This request may have already been processed.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Network Error', 
          description: 'Failed to cancel request. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  // Purge expired recentlyCancelled entries every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setRecentlyCancelled(prev => {
        const now = Date.now();
        const next: Record<string, number> = {};
        Object.keys(prev).forEach(k => { if (prev[k] > now) next[k] = prev[k]; });
        return next;
      });
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Helpers to decide subscription UI
  const showSubscribed = Boolean(recentSubscribed || (ngoDetails && typeof ngoDetails.requestCall !== 'undefined' && ngoDetails.requestCall > 0));
  const showGetSubscription = Boolean(ngoDetails && typeof ngoDetails.requestCall !== 'undefined' && ngoDetails.requestCall <= 0 && !recentSubscribed);

  const handleVerifyNgo = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!ngoName.trim()) newErrors.ngoName = "Name is required";
    if (!ngoType) newErrors.ngoType = "Organization type is required";
    if (!address.trim()) newErrors.address = "Address is required";
    if (!govtDoc) newErrors.govtDoc = "Government document (PDF) is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Enter a valid email";

    if (govtDoc && govtDoc.type !== "application/pdf") newErrors.govtDoc = "Only PDF files are accepted";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast({ 
        title: 'Validation Error', 
        description: 'Please fill in all required fields correctly.',
        variant: 'destructive'
      });
      return;
    }

    try {
      if (currentUserId) {
        const fd = new FormData();
        fd.append('name', ngoName);
        fd.append('email', email);
        fd.append('phone', phone);
        fd.append('address', address);
        if (govtDoc) fd.append('govtDoc', govtDoc, govtDoc.name);

        const res = await axios.post(
          `http://localhost:4000/api/v1/ngo/${currentUserId}/verify`,
          fd,
          { withCredentials: true }
        );
        
        if (res.status === 200 || res.status === 201) {
          const isSuccess = res.data?.success !== false && !res.data?.error;
          
          if (isSuccess) {
            if (res.data?.ngo) {
              const newKycStatus = res.data.ngo.kycStatus === 'VERIFIED';
              setIsVerified(newKycStatus);
              
              toast({ 
                title: 'Verification Submitted Successfully! 🎉', 
                description: newKycStatus ? 
                  'Your NGO has been verified and is now active!' : 
                  'Your verification request has been submitted for review.',
                variant: 'default'
              });
              
              // Refresh data to pick up server-side changes
              try { 
                await fetchAll(); 
              } catch (e) { 
                console.debug('Refresh after verify failed', e); 
              }
            } else {
              toast({ 
                title: 'Verification Submitted Successfully! 📋', 
                description: 'Your verification request has been submitted and is being reviewed.',
                variant: 'default'
              });
            }
          } else {
            toast({ 
              title: 'Verification Failed', 
              description: res.data?.message || 'Unable to submit verification request.',
              variant: 'destructive'
            });
          }
        } else {
          toast({ 
            title: 'Verification Failed', 
            description: `Server responded with status: ${res.status}`,
            variant: 'destructive'
          });
        }
      } else {
        toast({ 
          title: 'Authentication Required', 
          description: 'You must be logged in to submit verification.',
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('Verification failed', err?.response?.data || err);
      
      if (err?.response?.status === 401) {
        toast({ 
          title: 'Authentication Error', 
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
      } else if (err?.response?.status === 400) {
        toast({ 
          title: 'Invalid Data', 
          description: err?.response?.data?.message || 'Please check your information and try again.',
          variant: 'destructive'
        });
      } else if (err?.response?.status >= 500) {
        toast({ 
          title: 'Server Error', 
          description: 'The verification service is temporarily unavailable. Please try again later.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Network Error', 
          description: 'Failed to submit verification request. Please check your connection.',
          variant: 'destructive'
        });
      }
    } finally {
      setVerifyOpen(false);
    }
  };

  const handleSellCredits = async () => {
    if (!currentUserId) {
      toast({ 
        title: 'Authentication Required', 
        description: 'You must be logged in to list credits.',
        variant: 'destructive'
      });
      return;
    }

    if (sellAmount <= 0 || sellAmount > dashboardStats.availableCredits) {
      toast({ 
        title: 'Invalid Amount', 
        description: 'Please enter a valid amount within your available credits.',
        variant: 'destructive'
      });
      return;
    }

    if (pricePerCredit <= 0) {
      toast({ 
        title: 'Invalid Price', 
        description: 'Please enter a valid price per credit.',
        variant: 'destructive'
      });
      return;
    }

    setSelling(true);
    try {
      const res = await axios.post(
        `http://localhost:4000/api/v1/ngo/${currentUserId}/list-credits`, 
        { amount: sellAmount, price: pricePerCredit }, 
        { withCredentials: true }
      );
      
      // Check for successful response
      if (res.status === 200 || res.status === 201) {
        // Check if response indicates success
        const isSuccess = res.data?.success !== false && !res.data?.error;
        
        if (isSuccess) {
          toast({ 
            title: 'Credits Listed Successfully! 🎉', 
            description: `${sellAmount} credits listed for sale at ₹${pricePerCredit} each. Total value: ₹${(sellAmount * pricePerCredit).toLocaleString()}`,
            variant: 'default'
          });
          
          // Update available credits locally
          setDashboardStats(prev => ({
            ...prev,
            availableCredits: prev.availableCredits - sellAmount
          }));
          
          // Reset form
          setSellAmount(0);
          setPricePerCredit(15);
          
          // Refresh data
          try { 
            await fetchAll(); 
          } catch (e) { 
            console.debug('Refresh after listing credits failed', e); 
          }
        } else {
          toast({ 
            title: 'Listing Failed', 
            description: res.data?.message || 'Unable to list credits for sale.',
            variant: 'destructive'
          });
        }
      } else {
        toast({ 
          title: 'Request Failed', 
          description: `Server responded with status: ${res.status}`,
          variant: 'destructive'
        });
      }
    } catch (err: any) {
      console.error('List credits failed', err?.response?.data || err.message || err);
      
      // Handle different error scenarios
      if (err?.response?.status === 401) {
        toast({ 
          title: 'Authentication Error', 
          description: 'Your session has expired. Please log in again.',
          variant: 'destructive'
        });
      } else if (err?.response?.status === 400) {
        toast({ 
          title: 'Invalid Request', 
          description: err?.response?.data?.message || 'Please check your input and try again.',
          variant: 'destructive'
        });
      } else if (err?.response?.status >= 500) {
        toast({ 
          title: 'Server Error', 
          description: 'The server is temporarily unavailable. Please try again later.',
          variant: 'destructive'
        });
      } else {
        toast({ 
          title: 'Network Error', 
          description: 'Failed to connect to the server. Please check your connection.',
          variant: 'destructive'
        });
      }
    } finally {
      setSelling(false);
    }
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50/30 to-green-50/20 p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">NGO Dashboard</h1>
          <p className="text-lg text-muted-foreground">Welcome back, {ngoName}</p>
        </div>
        <div className="flex items-center gap-4">
            {showGetSubscription && (
              <Button
                onClick={() => handleGetSubscription()}
                variant="default"
                size="lg"
                className="bg-red-500 hover:bg-red-600 text-white shadow-lg"
              >
                Get Subscription
              </Button>
            )}
            {showSubscribed && (
              <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-sm text-gray-800">Subscribed</span>
              </div>
            )}
          <Button variant="default" size="lg" className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mr-2" />
            View Analytics
          </Button>
          <Button variant="default" size="lg" className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg">
            <Award className="w-5 h-5 mr-2" />
            Achievements
          </Button>

          {/* Small profile / nav area */}
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-md border border-gray-200">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">G</div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{ngoName}</span>
              <div className="flex items-center gap-2 text-xs">
                {isVerified ? (
                  <Badge className="bg-success text-black">Verified</Badge>
                ) : (
                  <Badge className="bg-muted text-foreground">Not Verified</Badge>
                )}
              </div>
            </div>
            <Button
              onClick={() => {
                if (currentUserId) {
                  // Navigate to dedicated NGO detail page
                  navigate(`/ngos/${currentUserId}`);
                } else {
                  setActiveTab('profile');
                }
              }}
              variant="ghost"
              size="sm"
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Completed Projects"
          value={dashboardStats.completedProjects}
          icon={CheckCircle}
          variant="success"
          trend={{ value: 25, isPositive: true }}
        />
        <StatCard
          title="Active Projects"
          value={dashboardStats.activeProjects}
          icon={Clock}
          variant="info"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Credits Earned"
          value={dashboardStats.totalCreditsEarned}
          icon={Coins}
          variant="purple"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Available Credits"
          value={dashboardStats.availableCredits}
          icon={Wallet}
          variant="warning"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Add refresh button */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={fetchDashboardData} 
          variant="outline" 
          size="sm"
          disabled={dataFetching}
          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
        >
          {dataFetching ? "Loading..." : "🔄 Refresh Dashboard"}
        </Button>
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts
        totalCredits={dashboardStats.totalCreditsEarned}
        availableCredits={dashboardStats.availableCredits}
        myTasks={myTasks}
        availableTasks={availableTasks}
      />

  {/* Main Content Tabs */}
  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)} className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 ngop-beautiful-nav">
  <TabsTrigger value="marketplace" className="ngop-beautiful-trigger">
    Marketplace
  </TabsTrigger>
  <TabsTrigger value="mytasks" className="ngop-beautiful-trigger">
    My Projects
  </TabsTrigger>
  <TabsTrigger value="wallet" className="ngop-beautiful-trigger">
    Digital Wallet
  </TabsTrigger>
  <TabsTrigger value="profile" className="ngop-beautiful-trigger">
    Organization
  </TabsTrigger>
  <TabsTrigger value="sellcredits" className="ngop-beautiful-trigger">
    Sell Credits
  </TabsTrigger>
</TabsList>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold text-foreground">Project Marketplace</h2>
              <p className="text-muted-foreground">Discover and request new environmental projects</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 px-4 py-2 text-sm font-medium">
                <Leaf className="w-4 h-4 mr-2" />
                {availableTasks.length} projects available
              </Badge>
              {!isVerified && (
                <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg">Verify Organization</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white/95 backdrop-blur-lg border border-gray-200 shadow-2xl max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Organization Verification</DialogTitle>
                    <DialogDescription>Submit your official documents for verification</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleVerifyNgo} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ngoName">Organization Name</Label>
                        <Input 
                          id="ngoName" 
                          value={ngoName} 
                          onChange={(e) => { setNgoName(e.target.value); clearError('ngoName'); }} 
                          placeholder="Green Earth NGO" 
                        />
                        {errors.ngoName && <p className="text-sm text-destructive">{errors.ngoName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ngoType">Organization Type</Label>
                        <Select value={ngoType} onValueChange={(v) => { setNgoType(v); clearError('ngoType'); }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NGO">NGO</SelectItem>
                            <SelectItem value="PANCHAYAT">Panchayat</SelectItem>
                            <SelectItem value="COMMUNITY">Community Group</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.ngoType && <p className="text-sm text-destructive">{errors.ngoType}</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input 
                          id="phone" 
                          value={phone} 
                          onChange={(e) => { setPhone(e.target.value); clearError('phone'); }} 
                          placeholder="+91 98765 43210" 
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={email} 
                          onChange={(e) => { setEmail(e.target.value); clearError('email'); }} 
                          placeholder="contact@greenearthngo.org" 
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Complete Address</Label>
                      <Input 
                        id="address" 
                        value={address} 
                        onChange={(e) => { setAddress(e.target.value); clearError('address'); }} 
                        placeholder="Organization headquarters address" 
                      />
                      {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="govtDoc">Government Registration Document (PDF)</Label>
                      <Input 
                        id="govtDoc" 
                        type="file" 
                        accept="application/pdf" 
                        onChange={(e) => { setGovtDoc(e.target.files?.[0] ?? null); clearError('govtDoc'); }} 
                      />
                      {errors.govtDoc && <p className="text-sm text-destructive">{errors.govtDoc}</p>}
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setVerifyOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="secondary">
                        Submit for Verification
                      </Button>
                    </div>
                  </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          <div className="grid gap-6">
            {availableTasks.map((task) => {
              const alreadyRequested = Boolean(task.requestedBy && currentUserId && task.requestedBy.includes(currentUserId));
              const isRecentlyCancelled = Boolean(recentlyCancelled[task.id] && recentlyCancelled[task.id] > Date.now());
              return (
                <Card key={task.id} className={`bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${highlightedProject === task.id ? 'ring-4 ring-yellow-300 animate-pulse' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-2">{task.title}</h3>
                          <div className="flex items-center text-muted-foreground mb-3">
                            <MapPin className="w-4 h-4 mr-2" />
                            {task.location}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            <Leaf className="w-3 h-3 mr-1" />
                            {task.treeCount} trees
                          </Badge>
                          {alreadyRequested && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-muted text-foreground">
                                Requested
                              </Badge>
                              <Button size="sm" variant="ghost" onClick={() => handleCancelRequest(task.id)}>Cancel</Button>
                            </div>
                          )}
                          {isRecentlyCancelled && (
                            <Badge variant="outline" className="bg-warning-light text-warning">
                              Recently cancelled
                            </Badge>
                          )}
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Coins className="w-3 h-3 mr-1" />
                            Est. {Math.floor(task.treeCount * 0.75)} credits
                          </Badge>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Government Project
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          Project timeline: 6 months • Created on {new Date().toLocaleDateString()}
                        </p>
                      </div>

                      {showGetSubscription && !alreadyRequested && !isRecentlyCancelled ? (
                        <Button
                          onClick={() => handleGetSubscription()}
                          variant="ghost"
                          size="lg"
                          className="ml-6 bg-red-600 text-white"
                          title="You need an active subscription to request projects"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          Get Subscription
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRequestTask(task.id)}
                          variant="secondary"
                          size="lg"
                          className="ml-6"
                          disabled={!isVerified || alreadyRequested || isRecentlyCancelled}
                          title={!isVerified ? 'Only verified organizations can request projects' : (alreadyRequested ? 'You have already requested this project' : (isRecentlyCancelled ? 'Recently cancelled — try again in a moment' : undefined))}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {alreadyRequested ? 'Requested' : (isVerified ? 'Request Project' : 'Request (Verify first)')}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
    </TabsContent>

        {/* My Tasks Tab */}
        <TabsContent value="mytasks" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">My Projects</h2>
            <p className="text-muted-foreground">Track progress and submit reports for your active projects</p>
          </div>
          
          <div className="grid gap-6">
            {myTasks.map((task) => (
              <Card key={task.id} className="bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">{task.title}</h3>
                        <div className="flex items-center text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 mr-2" />
                          {task.location}
                        </div>
                      </div>
                      

                      <div className="flex flex-wrap gap-3">
                        {(() => {
                          let statusClassName = 'bg-muted text-foreground';
                          let statusLabel: string = String(task.status);

                          if (task.status === 'Completed') {
                            statusClassName = 'bg-green-600 text-white border-green-600';
                            statusLabel = 'Completed';
                          } else if (task.status === 'InProgress') {
                            statusClassName = 'bg-blue-50 text-blue-700 border-blue-200';
                            statusLabel = 'In Progress';
                          } else if (task.status === 'UnderVerification') {
                            statusClassName = 'bg-amber-50 text-amber-700 border-amber-200';
                            statusLabel = 'Under Verification';
                          } else if (task.status === 'Verified') {
                            statusClassName = 'bg-green-600 text-white border-green-600';
                            statusLabel = 'Verified';
                          } else if (task.status === 'Requested') {
                            statusClassName = 'bg-gray-100 text-gray-700 border-gray-200';
                            statusLabel = 'Requested';
                          }

                          return (
                            <Badge variant={task.status === 'Completed' ? 'default' : 'outline'} className={statusClassName}>
                              {statusLabel}
                            </Badge>
                          );
                        })()}

                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                          <Leaf className="w-3 h-3 mr-1" />
                          {task.treeCount} trees
                        </Badge>
                        {task.carbonCredits && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            <Coins className="w-3 h-3 mr-1" />
                            {task.carbonCredits} credits earned
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {task.status === 'InProgress' && (
                        <Button
                          onClick={() => openMrvFor(task.id)}
                          variant="secondary"
                          size="lg"
                          className="ml-6"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Submit Report
                        </Button>
                      )}

                      {task.status === 'Requested' && (
                        <div className="flex items-center gap-2">
                          <Badge className="bg-muted text-foreground">Requested</Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleCancelRequest(task.id)}>Cancel Request</Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* MRV Reports Table */}
          <Card className="bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-lg">
            <CardHeader>
              <CardTitle>Submitted MRV Reports</CardTitle>
              <CardDescription>Track the verification status of your submitted reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Trees Reported</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrvReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">No MRV reports submitted yet.</TableCell>
                    </TableRow>
                  )}
                  {mrvReports.map((r) => {
                    const proj = allProjects.find(p => String(p._id) === String(r.projectId));
                    return (
                      <TableRow key={r._id}>
                        <TableCell>{proj ? proj.title : (r.externalProjectId || 'External Project')}</TableCell>
                        <TableCell>{new Date(r.dateReported || r.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>{r.treeCount}</TableCell>
                        <TableCell>
                          {r.status === 'Pending' && <Badge className="bg-amber-100 text-amber-800 border-amber-300">Under Verification</Badge>}
                          {r.status === 'Verified' && <Badge className="bg-green-600 text-white">Verified</Badge>}
                          {r.status === 'Rejected' && <Badge className="bg-red-600 text-white">Rejected</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedReport(r); setMrvDetailsOpen(true); }}>View</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digital Wallet Tab */}
        <TabsContent value="wallet" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Digital Wallet</h2>
              <p className="text-muted-foreground">Manage your carbon credit portfolio</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold text-success">{dashboardStats.availableCredits} Credits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle>Carbon Credit Transactions</CardTitle>
                <CardDescription>Recent credit earnings and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Coastal Restoration Project</TableCell>
                      <TableCell>375 tCO₂</TableCell>
                      <TableCell>Dec 15, 2024</TableCell>
                      <TableCell>
                        <Badge className="bg-green-600 text-white">Earned</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Urban Forest Development</TableCell>
                      <TableCell>150 tCO₂</TableCell>
                      <TableCell>Nov 28, 2024</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-teal-500 to-green-600 text-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Credit Summary</CardTitle>
                <CardDescription className="text-teal-100">Your carbon credit overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Available:</span>
                  <span className="font-bold">{dashboardStats.availableCredits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Earned:</span>
                  <span className="font-bold">{dashboardStats.totalCreditsEarned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Market Value:</span>
                  <span className="font-bold">₹{(dashboardStats.availableCredits * 15).toLocaleString()}</span>
                </div>
                <Button variant="outline" className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30">
                  View Market Rates
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sell Credits Tab */}
        <TabsContent value="sellcredits" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Credit Marketplace</h2>
            <p className="text-muted-foreground">List your carbon credits for sale to buyers</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/95 backdrop-blur-lg border border-gray-200/50 shadow-lg">
              <CardHeader>
                <CardTitle>List Credits for Sale</CardTitle>
                <CardDescription>
                  You have <span className="font-bold text-success">{dashboardStats.availableCredits}</span> credits available
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Amount of Credits to Sell</Label>
                  <Input
                    type="number"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(Number(e.target.value))}
                    min={1}
                    max={dashboardStats.availableCredits}
                    placeholder="Enter amount"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Price per Credit (₹)</Label>
                  <Input
                    type="number"
                    value={pricePerCredit}
                    onChange={(e) => setPricePerCredit(Number(e.target.value))}
                    min={1}
                    placeholder="Enter price"
                  />
                </div>
                
                <div className="bg-gradient-to-r from-teal-50 to-green-50 border border-teal-200 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Transaction Summary:</p>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-bold">₹{(sellAmount * pricePerCredit).toLocaleString()}</span>
                  </div>
                </div>
                
                <Button
                  disabled={selling || sellAmount <= 0 || sellAmount > dashboardStats.availableCredits}
                  onClick={handleSellCredits}
                  variant="default"
                  size="lg"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {selling ? 'Listing Credits...' : 'List for Sale'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription className="text-blue-100">Current market trends and pricing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Current Market Rate:</span>
                    <span className="font-bold">₹12-18 per credit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your Average Rate:</span>
                    <span className="font-bold">₹15 per credit</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Volume:</span>
                    <span className="font-bold">2,450 credits</span>
                  </div>
                </div>
                
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm border border-white/30">
                  <p className="text-sm font-medium mb-1">💡 Market Tip</p>
                  <p className="text-xs text-blue-100">
                    Prices are 12% higher this month due to increased corporate demand
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Organization Profile</h2>
            <p className="text-muted-foreground">Manage your organization details, account settings, and verification status</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Account Details Section */}
            <Card className="xl:col-span-1 bg-white/80 backdrop-blur-sm border-0 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Picture/Logo */}
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {ngoName.charAt(0) || 'N'}
                    </div>
                    <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0">
                      <Camera className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Upload Logo</p>
                </div>

                {/* Account Information */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Name</Label>
                    <p className="text-base font-semibold">testNGO</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <p className="text-sm">test@gmail.com</p>
                    </div>
                    <Button variant="outline" size="sm">Change</Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-muted-foreground">Password</Label>
                      <p className="text-sm">••••••••</p>
                    </div>
                    <Button variant="outline" size="sm">Change</Button>
                  </div>

                  {/* KYC Status - Prominent */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium text-amber-800">KYC Status</Label>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                        <Clock className="w-3 h-3 mr-1" />
                        PENDING
                      </Badge>
                    </div>
                    <p className="text-xs text-amber-700 mb-3">Your KYC verification is under review. Complete your organization details to expedite the process.</p>
                    <Button variant="default" size="sm" className="bg-amber-600 hover:bg-amber-700">
                      Complete KYC
                    </Button>
                  </div>

                  {/* 2FA Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                      <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                    </div>
                    <Button variant="outline" size="sm">Setup</Button>
                  </div>

                  {/* Notifications */}
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <span>Notification Preferences</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organization Information Section */}
            <Card className="xl:col-span-2 bg-white/80 backdrop-blur-sm border-0 shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="w-5 h-5" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Organization Info */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Organization Name *</Label>
                      <Input value={ngoName} onChange={(e) => setNgoName(e.target.value)} className="mt-1" placeholder="Enter organization name" />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Organization Type</Label>
                      <Select value={ngoType} onValueChange={setNgoType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                          <SelectItem value="Charity">Charity</SelectItem>
                          <SelectItem value="Social Enterprise">Social Enterprise</SelectItem>
                          <SelectItem value="Foundation">Foundation</SelectItem>
                          <SelectItem value="Environmental NGO">Environmental NGO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                      <Input placeholder="Enter registration/tax ID" className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Founded Year</Label>
                      <Input type="number" placeholder="2019" className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Geographical Focus</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select focus area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Local">Local</SelectItem>
                          <SelectItem value="Regional">Regional</SelectItem>
                          <SelectItem value="National">National</SelectItem>
                          <SelectItem value="International">International</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Contact & Address Info */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Primary Contact Person</Label>
                      <Input placeholder="Full name" className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Contact Title</Label>
                      <Input placeholder="Executive Director" className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Official Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" />
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Website URL</Label>
                      <Input placeholder="https://www.organization.org" className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Address Section */}
                <div className="border-t pt-6">
                  <h4 className="text-base font-semibold mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Street Address</Label>
                      <Input placeholder="Building, street name" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">City</Label>
                      <Input placeholder="City" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">State/Province</Label>
                      <Input placeholder="State" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Postal Code</Label>
                      <Input placeholder="110001" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="USA">United States</SelectItem>
                          <SelectItem value="UK">United Kingdom</SelectItem>
                          <SelectItem value="Canada">Canada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Social Media & Mission */}
                <div className="border-t pt-6">
                  <h4 className="text-base font-semibold mb-4">Additional Information</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">LinkedIn</Label>
                        <Input placeholder="linkedin.com/company/org" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Twitter</Label>
                        <Input placeholder="@organization" className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Facebook</Label>
                        <Input placeholder="facebook.com/org" className="mt-1" />
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Mission Statement</Label>
                      <textarea 
                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" 
                        rows={3}
                        placeholder="Describe your organization's mission and environmental impact goals..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents & Certifications Section */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5" />
                Documents & Certifications
              </CardTitle>
              <CardDescription>
                Upload required verification documents and sustainability certifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Required Documents */}
              <div>
                <h4 className="text-base font-semibold mb-4">Required Verification Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                    <div className="mb-4">
                      <div className="mx-auto w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-teal-600" />
                      </div>
                    </div>
                    <h5 className="font-semibold mb-2">Registration Certificate</h5>
                    <p className="text-sm text-muted-foreground mb-4">Official registration document from government authorities</p>
                    <Button variant="outline" size="sm" className="mb-2">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                    <div className="mb-4">
                      <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                    <h5 className="font-semibold mb-2">Tax Exemption Letter</h5>
                    <p className="text-sm text-muted-foreground mb-4">Tax exemption certificate or 80G certificate</p>
                    <Button variant="outline" size="sm" className="mb-2">
                      <Camera className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div>
                <h4 className="text-base font-semibold mb-4">Uploaded Documents</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center text-muted-foreground">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="font-medium">No documents uploaded yet</p>
                    <p className="text-sm">Upload your first verification document to get started</p>
                  </div>
                </div>
              </div>

              {/* Certifications */}
              <div className="border-t pt-6">
                <h4 className="text-base font-semibold mb-4">Sustainability Certifications (Optional)</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                  <div className="mb-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <h5 className="font-semibold mb-2">Upload Certifications</h5>
                  <p className="text-sm text-muted-foreground mb-4">ISO certifications, environmental awards, accreditations</p>
                  <Button variant="outline" size="sm">
                    <Camera className="w-4 h-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics Summary */}
          <Card className="bg-gradient-to-br from-teal-50 to-green-50 border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-lg">Performance Overview</CardTitle>
              <CardDescription>Your organization's impact and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-teal-700">{dashboardStats.completedProjects + 13}</p>
                  <p className="text-sm text-muted-foreground">Projects Completed</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Leaf className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">3,750</p>
                  <p className="text-sm text-muted-foreground">Trees Planted</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{dashboardStats.totalCreditsEarned + 1875}</p>
                  <p className="text-sm text-muted-foreground">Credits Earned</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-amber-700">4.8★</p>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button variant="outline" size="lg">
              Cancel Changes
            </Button>
            <Button 
              variant="default" 
              size="lg"
              className="bg-teal-600 hover:bg-teal-700 px-8"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* MRV Report Modal */}
      <MRVReportModal
        open={mrvOpen}
        onOpenChange={setMrvOpen}
        projectId={mrvProjectId}
        ngoRegistrationId={currentUserId || 'NGO-2024-GE-001'}
        onSuccess={() => {
            // Optimistically mark the project as under verification in the UI
            setMyTasks(prev => prev.map(t => t.id === mrvProjectId ? { ...t, status: 'UnderVerification' } : t));
            // Refresh dashboard data (projects, credits) after MRV submission
            (async () => {
              try {
                await fetchAll();
              } catch (e) {
                console.debug('Failed to refresh after MRV submit', e);
              }
            })();
            toast({ title: 'Success', description: 'MRV report submitted successfully! The report is now under verification.' });
        }}
      />
      <MRVDetailsModal
        open={mrvDetailsOpen}
        onOpenChange={setMrvDetailsOpen}
        report={selectedReport}
      />
    </div>
    </Layout>
  );
}