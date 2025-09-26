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
  // ngoDisplayName will be derived from state (ngoName)
  const [availableCredits, setAvailableCredits] = useState<number>(375);
  
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
  
  // mockTasks removed; data is fetched from backend

  // Fetch data from backend: projects list, NGO profile, and available credits
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

        // Fetch credit balance
        try {
          const balRes = await axios.get(`http://localhost:4000/api/v1/ngo/credits-test/${currentUserId}`);
          if (balRes?.data?.success) setAvailableCredits(balRes.data.balance || availableCredits);
        } catch (err) {
          console.debug('Failed to fetch credits balance', err);
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
    // run initial fetch
    fetchAll();
  }, []);

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

  const completedProjects = myTasks.filter(t => t.status === 'Completed').length;
  const activeProjects = myTasks.filter(t => t.status === 'InProgress').length;
  const totalCreditsEarned = myTasks
    .filter(t => t.status === 'Completed')
    .reduce((sum, task) => sum + (task.carbonCredits || 0), 0);

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
      toast({ title: 'Error', description: 'You must be logged in to request a task.' });
      return;
    }

    try {
      const res = await axios.put(`http://localhost:4000/api/v1/gov/projects/${taskId}/request`, { requestedBy: currentUserId }, { withCredentials: true });
      if (res.data?.success) {
        toast({ title: 'Success', description: 'Task request submitted successfully!' });
        // Re-fetch all data to reflect updated project state and balances
        try { await fetchAll(); } catch (e) { console.debug('Refresh after request failed', e); }
      } else {
        toast({ title: 'Error', description: res.data?.message || 'Request failed' });
      }
    } catch (err: any) {
      console.error('Request project failed', err?.response?.data || err.message || err);
      toast({ title: 'Error', description: 'Failed to request project.' });
    }
  };

  const handleCancelRequest = async (taskId: string) => {
    if (!currentUserId) {
      toast({ title: 'Error', description: 'You must be logged in to cancel a request.' });
      return;
    }

    try {
      const res = await axios.put(`http://localhost:4000/api/v1/gov/projects/${taskId}/cancel-request`, { requestedBy: currentUserId }, { withCredentials: true });
      if (res.data?.success) {
        toast({ title: 'Success', description: 'Your request has been cancelled.' });
        // Mark recently cancelled with TTL (e.g., 2 minutes)
        const TTL = 2 * 60 * 1000; // 2 minutes in ms
        setRecentlyCancelled(prev => ({ ...prev, [taskId]: Date.now() + TTL }));
        // Highlight the project and switch the UI to marketplace so NGOs can re-request
        setHighlightedProject(taskId);
        setActiveTab('marketplace');
        try { await fetchAll(); } catch (e) { console.debug('Refresh after cancel failed', e); }
        // remove highlight after a short animation period
        setTimeout(() => setHighlightedProject(null), 3500);
        // Toast with quick pointer
        toast({ title: 'Cancelled', description: 'Project request cancelled — it is now available in Marketplace.' });
      } else {
        toast({ title: 'Error', description: res.data?.message || 'Failed to cancel request.' });
      }
    } catch (err: any) {
      console.error('Cancel request failed', err?.response?.data || err.message || err);
      toast({ title: 'Error', description: 'Failed to cancel request.' });
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
    if (Object.keys(newErrors).length > 0) return;

    try {
      // Send verification request to backend. Prefer auth-protected endpoint if available.
        if (currentUserId) {
        const fd = new FormData();
        fd.append('name', ngoName);
        fd.append('email', email);
        fd.append('phone', phone);
        fd.append('address', address);
        if (govtDoc) fd.append('govtDoc', govtDoc, govtDoc.name);

        // Two possible endpoints exist in the backend: POST /api/v1/ngo/verifyNgo (auth) and POST /api/v1/ngo/:id/verify
        // We'll call the id-based verify as it exists and will update the NGO's kycStatus.
        const res = await axios.post(
          `http://localhost:4000/api/v1/ngo/${currentUserId}/verify`,
          fd,
          { withCredentials: true }
        );
        if (res.data?.ngo) {
          setIsVerified(res.data.ngo.kycStatus === 'VERIFIED');
          toast({ title: 'Success', description: 'NGO verification submitted and updated.' });
          // refresh data to pick up any server-side changes
          try { await fetchAll(); } catch (e) { console.debug('Refresh after verify failed', e); }
        } else {
          toast({ title: 'Success', description: 'NGO verification submitted successfully!' });
        }
      } else {
        toast({ title: 'Success', description: 'NGO verification submitted successfully!' });
      }
    } catch (err: any) {
      console.error('Verification failed', err?.response?.data || err);
      toast({ title: 'Error', description: 'Verification request failed.' });
    } finally {
      setVerifyOpen(false);
    }
  };

  const handleSellCredits = async () => {
    if (!currentUserId) {
      toast({ title: 'Error', description: 'You must be logged in to list credits.' });
      return;
    }

    setSelling(true);
    try {
      const res = await axios.post(`http://localhost:4000/api/v1/ngo/${currentUserId}/list-credits`, { amount: sellAmount, price: pricePerCredit }, { withCredentials: true });
      if (res.data?.success) {
        toast({ title: 'Success', description: `${sellAmount} credits listed for sale at ₹${pricePerCredit} each!` });
        // Update balance and project lists by re-fetching
        try { await fetchAll(); } catch (e) { console.debug('Refresh after listing credits failed', e); }
        setSellAmount(0);
      } else {
        toast({ title: 'Error', description: res.data?.message || 'Failed to list credits.' });
      }
    } catch (err: any) {
      console.error('List credits failed', err?.response?.data || err.message || err);
      toast({ title: 'Error', description: 'Failed to list credits for sale.' });
    } finally {
      setSelling(false);
    }
  };

  return (
    <Layout>
    <div className="min-h-screen bg-gradient-subtle p-6 space-y-8">
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
                variant="ghost"
                size="lg"
                className="bg-red-600 text-white"
              >
                Get Subscription
              </Button>
            )}
            {showSubscribed && (
              <div className="flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg shadow-sm">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-sm text-foreground">Subscribed</span>
              </div>
            )}
          <Button variant="default" size="lg" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
            <TrendingUp className="w-5 h-5 mr-2" />
            View Analytics
          </Button>
          <Button variant="secondary" size="lg" className="bg-green-600 text-white">
            <Award className="w-5 h-5 mr-2" />
            Achievements
          </Button>

          {/* Small profile / nav area */}
          <div className="flex items-center gap-3 bg-white/60 p-2 rounded-md shadow-sm">
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
          value={completedProjects}
          icon={CheckCircle}
          variant="success"
          trend={{ value: 25, isPositive: true }}
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={Clock}
          variant="info"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Credits Earned"
          value={totalCreditsEarned}
          icon={Coins}
          variant="purple"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Available Credits"
          value={availableCredits}
          icon={Wallet}
          variant="warning"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Analytics Charts */}
      <AnalyticsCharts
        totalCredits={totalCreditsEarned}
        availableCredits={availableCredits}
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
              <Badge variant="outline" className="bg-success-light text-success px-4 py-2 text-sm font-medium">
                <Leaf className="w-4 h-4 mr-2" />
                {availableTasks.length} projects available
              </Badge>
              {!isVerified && (
                <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="default" className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">Verify Organization</Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gradient-subtle border-0 shadow-elegant max-w-2xl">
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
                <Card key={task.id} className={`bg-white/70 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300 hover:scale-[1.02] ${highlightedProject === task.id ? 'ring-4 ring-yellow-300 animate-pulse' : ''}`}>
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
                          <Badge variant="outline" className="bg-success-light text-success">
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
                          <Badge variant="outline" className="bg-info-light text-info">
                            <Coins className="w-3 h-3 mr-1" />
                            Est. {Math.floor(task.treeCount * 0.75)} credits
                          </Badge>
                          <Badge variant="outline" className="bg-purple-light text-purple">
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
              <Card key={task.id} className="bg-white/70 backdrop-blur-sm border-0 shadow-card hover:shadow-elegant transition-all duration-300">
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
                            statusClassName = 'bg-success text-white';
                            statusLabel = 'Completed';
                          } else if (task.status === 'InProgress') {
                            statusClassName = 'bg-info-light text-info';
                            statusLabel = 'In Progress';
                          } else if (task.status === 'UnderVerification') {
                            statusClassName = 'bg-warning-light text-warning';
                            statusLabel = 'Under Verification';
                          } else if (task.status === 'Verified') {
                            statusClassName = 'bg-success text-black';
                            statusLabel = 'Verified';
                          } else if (task.status === 'Requested') {
                            statusClassName = 'bg-muted text-foreground';
                            statusLabel = 'Requested';
                          }

                          return (
                            <Badge variant={task.status === 'Completed' ? 'default' : 'outline'} className={statusClassName}>
                              {statusLabel}
                            </Badge>
                          );
                        })()}

                        <Badge variant="outline" className="bg-success-light text-success">
                          <Leaf className="w-3 h-3 mr-1" />
                          {task.treeCount} trees
                        </Badge>
                        {task.carbonCredits && (
                          <Badge variant="outline" className="bg-purple-light text-purple">
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
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-card">
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
                          {r.status === 'Pending' && <Badge className="bg-warning-light text-warning">Under Verification</Badge>}
                          {r.status === 'Verified' && <Badge className="bg-success text-black">Verified</Badge>}
                          {r.status === 'Rejected' && <Badge className="bg-destructive text-white">Rejected</Badge>}
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
              <p className="text-3xl font-bold text-success">{availableCredits} Credits</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-white/70 backdrop-blur-sm border-0 shadow-card">
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
                        <Badge className="bg-success text-white">Earned</Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Urban Forest Development</TableCell>
                      <TableCell>150 tCO₂</TableCell>
                      <TableCell>Nov 28, 2024</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-info-light text-info">Pending</Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="bg-gradient-success text-white border-0 shadow-elegant">
              <CardHeader>
                <CardTitle>Credit Summary</CardTitle>
                <CardDescription className="text-success-light">Your carbon credit overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Available:</span>
                  <span className="font-bold">{availableCredits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Earned:</span>
                  <span className="font-bold">{totalCreditsEarned}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Market Value:</span>
                  <span className="font-bold">₹{(availableCredits * 15).toLocaleString()}</span>
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
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-card">
              <CardHeader>
                <CardTitle>List Credits for Sale</CardTitle>
                <CardDescription>
                  You have <span className="font-bold text-success">{availableCredits}</span> credits available
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
                    max={availableCredits}
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
                
                <div className="bg-gradient-subtle p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Transaction Summary:</p>
                  <div className="flex justify-between">
                    <span>Total Value:</span>
                    <span className="font-bold">₹{(sellAmount * pricePerCredit).toLocaleString()}</span>
                  </div>
                </div>
                
                <Button
                  disabled={selling || sellAmount <= 0 || sellAmount > availableCredits}
                  onClick={handleSellCredits}
                  variant="secondary"
                  size="lg"
                  className="w-full"
                >
                  {selling ? 'Listing Credits...' : 'List for Sale'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-info text-white border-0 shadow-elegant">
              <CardHeader>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription className="text-info-light">Current market trends and pricing</CardDescription>
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
                
                <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium mb-1">💡 Market Tip</p>
                  <p className="text-xs text-info-light">
                    Prices are 12% higher this month due to increased corporate demand
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Organization Profile</h2>
            <p className="text-muted-foreground">Manage your organization details and performance metrics</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-card">
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Organization Name</Label>
                    <p className="text-lg font-semibold">{ngoName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registration ID</Label>
                    <p className="font-mono">NGO-2024-GE-001</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                    <p>{ngoType}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Founded</Label>
                    <p>2019</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p>{address}</p>
                </div>

                <div className="mt-3">
                  <Label className="text-sm font-medium text-muted-foreground">Contact</Label>
                  <p className="text-sm">{phone} • {email}</p>
                </div>

                <div className="mt-3">
                  <Label className="text-sm font-medium text-muted-foreground">Verification Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {isVerified ? (
                      <Badge className="bg-success text-white">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-muted text-foreground">Not Verified</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-card">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                    <p className="text-2xl font-bold text-success">{completedProjects + 13}</p>
                    <p className="text-sm text-muted-foreground">Projects Completed</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                    <p className="text-2xl font-bold text-info">3,750</p>
                    <p className="text-sm text-muted-foreground">Trees Planted</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                    <p className="text-2xl font-bold text-purple">{totalCreditsEarned + 1875}</p>
                    <p className="text-sm text-muted-foreground">Credits Earned</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-subtle rounded-lg">
                    <p className="text-2xl font-bold text-warning">4.8★</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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