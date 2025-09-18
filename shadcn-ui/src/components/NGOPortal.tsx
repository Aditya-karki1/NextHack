import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Wallet, CheckCircle, Clock, Camera, Coins } from 'lucide-react';
import axios from 'axios';
import MRVReportModal from './MRVReportModal';

// Mock data types and functions for a clean example, assuming these are in '@/lib/mockData'
type Task = {
  id: string;
  title: string;
  location: string;
  treeCount: number;
  species?: string[];
  status: 'Created' | 'Assigned' | 'InProgress' | 'Completed' | 'Verified';
  ngoId?: string;
  // New field from the mongoose model to track requests
  requestedBy?: string; 
};

type CarbonCredit = {
  id: string;
  location: string;
  amount: number;
  price: number;
  status: 'available' | 'sold';
  ngoName: string;
};

const mockCarbonCredits: CarbonCredit[] = [
  { id: 'cc-001', ngoName: 'Green Earth NGO', location: 'Odisha Coastline', amount: 375, price: 15, status: 'available' },
  { id: 'cc-002', ngoName: 'Green Earth NGO', location: 'Odisha Coastline', amount: 100, price: 15, status: 'sold' },
];

// Main component
export default function NGOPortal() {
  const { toast } = useToast();
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [ngoDisplayName, setNgoDisplayName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myCredits] = useState<CarbonCredit[]>(mockCarbonCredits.filter(c => c.ngoName === 'Green Earth NGO'));

  // Verification dialog & form state
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [ngoName, setNgoName] = useState<string>('');
  const [ngoType, setNgoType] = useState<string | undefined>(undefined);
  const [govtDoc, setGovtDoc] = useState<File | null>(null);
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [geoBoundary, setGeoBoundary] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => setErrors(prev => {
    const copy = { ...prev };
    delete (copy as any)[field];
    return copy;
  });

  const [mrvOpen, setMrvOpen] = useState(false);
  const [mrvProjectId, setMrvProjectId] = useState<string | null>(null);
  const [mrvByProject, setMrvByProject] = useState<Record<string, any>>({});

  const openMrvFor = (projectId: string) => {
    setMrvProjectId(projectId);
    setMrvOpen(true);
  };

const fetchProjects = async (userId: string | null) => {
  try {
    const response = await axios.get("http://localhost:4000/api/v1/gov/projects"); 
    console.log("Fetched projects:", response.data);

    if (response.status === 200 && Array.isArray(response.data.projects)) {
      const projects = response.data.projects.map((p: any) => ({
        id: p._id,
        title: p.title,
        location: p.location.coordinates ? `${p.location.coordinates[1]}, ${p.location.coordinates[0]}` : 'N/A',
        treeCount: p.targetTrees,
        status: p.status,
        ngoId: p.ngoId,
        requestedBy: p.requestedBy || [],
      }));

      if (userId) {
        setAvailableTasks(
          projects.filter(t => t.status === "Created" && !t.requestedBy.includes(userId))
        );

        setMyTasks(
          projects.filter(t => t.requestedBy.includes(userId) || t.ngoId === userId)
        );
      } else {
        setAvailableTasks(projects.filter(t => t.status === "Created"));
      }

      console.log("Available tasks:", projects.filter(t => t.status === "Created" && !t.requestedBy.includes(userId)));
    }
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    toast({ title: 'Error', description: 'Failed to load projects.' });
  }
};

  useEffect(() => {
    (async () => {
      // 1. Fetch current authenticated user
      try {
        const res = await axios.get('http://localhost:4000/api/v1/auth/me', { withCredentials: true });
        if (res.status === 200 && res.data?.user) {
          const userId = res.data.user._id || res.data.user.id || null;
          setCurrentUserId(userId);
          const name = res.data.user.name || res.data.user.orgName || res.data.user.registrationId || res.data.user.ngoName;
          if (name) setNgoDisplayName(name);
        }
      } catch (err) {
        console.debug('No authenticated user found', (err as any)?.response?.status ?? (err as any)?.message ?? err);
      }

      // 2. Fetch MRV for all projects
      try {
        const res = await axios.get(`http://localhost:4000/api/v1/mrv/all`);
        if (res.status === 200 && res.data?.records) {
          const map: Record<string, any> = {};
          res.data.records.forEach((record: any) => {
            const key = record.projectId ?? record.externalProjectId;
            if (key) {
              map[key] = record;
            }
          });
          setMrvByProject(map);
        }
      } catch (err) {
        console.error("Failed to fetch MRV records:", err);
      }
    })();
  }, []);

  // Use a separate effect to fetch projects after the user ID is set
  useEffect(() => {
    if (currentUserId) {
      console.log("Fetching projects for user:", currentUserId);
      fetchProjects(currentUserId);
    }
  }, [currentUserId]);

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

    let parsedGeo: any = null;
    try {
      parsedGeo = geoBoundary ? JSON.parse(geoBoundary) : null;
    } catch (err) {
      parsedGeo = geoBoundary;
    }

    const organization = {
      name: ngoName || undefined,
      type: ngoType || undefined,
      address: address || undefined,
      geoBoundary: parsedGeo,
      contact: {
        phone: phone || undefined,
        email: email || undefined,
      },
      documents: govtDoc ? [{ cid: null, filename: govtDoc.name }] : [],
    };

    try {
      const formData = new FormData();
      formData.append("organization", JSON.stringify(organization));
      if (govtDoc) formData.append("govtDoc", govtDoc);

      const response = await axios.post(
        "http://localhost:4000/api/v1/ngo/verifyNgo",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200) {
        toast({ title: 'Submitted', description: 'NGO verification submitted successfully!' });
        setVerifyOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Verification failed', description: err.response?.data?.message || 'Verification failed' });
    }
  };

  const handleRequestTask = async (taskId: string) => {
    if (!currentUserId) {
      toast({ title: 'Error', description: 'You must be logged in to request a task.' });
      return;
    }
    try {
      // API call to update the task with a request
      const response = await axios.put(
        `http://localhost:4000/api/v1/gov/projects/${taskId}/request`,
        { requestedBy: currentUserId },
        { withCredentials: true }
      );
      if (response.status === 200) {
        toast({ title: 'Request Submitted', description: `Request for task has been submitted.` });
        fetchProjects(currentUserId); // Refresh the task lists
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Request Failed', description: err.response?.data?.message || 'Could not request task.' });
    }
  };
  
  const totalCreditsEarned = myCredits.reduce((sum, credit) => sum + credit.amount, 0);
  const availableCredits = myCredits.filter(c => c.status === 'available').reduce((sum, c) => sum + c.amount, 0);
  const completedProjects = myTasks.filter(t => t.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completed Projects</p>
                <p className="text-3xl font-bold">{completedProjects}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Active Tasks</p>
                <p className="text-3xl font-bold">{myTasks.filter(t => t.status === 'InProgress').length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Credits Earned</p>
                <p className="text-3xl font-bold">{totalCreditsEarned}</p>
              </div>
              <Coins className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Available for Sale</p>
                <p className="text-3xl font-bold">{availableCredits}</p>
              </div>
              <Wallet className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="marketplace" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="marketplace">Task Marketplace</TabsTrigger>
          <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
          <TabsTrigger value="wallet">Digital Wallet</TabsTrigger>
          <TabsTrigger value="profile">NGO Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="flex flex-col items-center md:flex-row md:justify-between md:items-center">
            <h2 className="text-2xl font-bold">Available Tasks</h2>
            <div className="flex-1 flex justify-center md:justify-end items-center gap-3">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {availableTasks.length} tasks available
              </Badge>
              <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md">Verify NGO</Button>
                </DialogTrigger>
                <DialogContent className="bg-white text-slate-900 rounded-lg shadow-lg p-6">
                  <DialogHeader>
                    <DialogTitle>Verify NGO</DialogTitle>
                    <DialogDescription>Provide official details to verify this NGO.</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleVerifyNgo} className="grid gap-3 py-2">
                    <div>
                      <Label htmlFor="ngoName">Name of NGO</Label>
                      <Input id="ngoName" value={ngoName} onChange={(e) => { setNgoName(e.target.value); clearError('ngoName'); }} placeholder="e.g., Green Earth NGO" />
                      {errors.ngoName && <p className="text-sm text-red-600 mt-1">{errors.ngoName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="ngoType">Organization Type</Label>
                      <Select value={ngoType} onValueChange={(v) => { setNgoType(v); clearError('ngoType'); }}>
                        <SelectTrigger id="ngoType" className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={6} align="start" className="z-50 min-w-[12rem] bg-white text-slate-900 rounded-md shadow-lg ring-1 ring-slate-200 p-1">
                          <SelectItem value="NGO">NGO</SelectItem>
                          <SelectItem value="PANCHAYAT">PANCHAYAT</SelectItem>
                          <SelectItem value="COMMUNITY">COMMUNITY</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.ngoType && <p className="text-sm text-red-600 mt-1">{errors.ngoType}</p>}
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" value={address} onChange={(e) => { setAddress(e.target.value); clearError('address'); }} placeholder="Organization address" />
                      {errors.address && <p className="text-sm text-red-600 mt-1">{errors.address}</p>}
                    </div>
                    <div>
                      <Label htmlFor="geoBoundary">Geo Boundary (optional, GeoJSON)</Label>
                      <Input id="geoBoundary" value={geoBoundary} onChange={(e) => setGeoBoundary(e.target.value)} placeholder='e.g. {"type":"Polygon",...}' />
                    </div>
                    <div>
                      <Label htmlFor="govtDoc">Govt Document (PDF)</Label>
                      <Input id="govtDoc" type="file" accept="application/pdf" onChange={(e) => { setGovtDoc(e.target.files?.[0] ?? null); clearError('govtDoc'); }} />
                      {errors.govtDoc && <p className="text-sm text-red-600 mt-1">{errors.govtDoc}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={phone} onChange={(e) => { setPhone(e.target.value); clearError('phone'); }} placeholder="+91 98765 43210" />
                        {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearError('email'); }} placeholder="contact@ngo.org" />
                        {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button type="button" variant="outline" onClick={() => setVerifyOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-green-600 text-white hover:bg-green-700">Submit for Verification</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

         <div className="grid gap-4">
  {availableTasks.map((task) => {
    const hasRequested = task.requestedBy.includes(currentUserId);

    return (
      <Card key={task.id} className="border-green-200 hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="w-4 h-4 mr-1" />
                {task.location}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline">{task.treeCount} trees</Badge>
                <Badge variant="outline">Est. {Math.floor(task.treeCount * 0.75)} credits</Badge>
                {mrvByProject[task.id] && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Submitted
                  </Badge>
                )}
                {hasRequested && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                    Requested
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Created by Government Body on {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Request Button */}
            {task.status === 'Created' && !hasRequested && (
              <Button
                onClick={() => handleRequestTask(task.id)}
                className="bg-blue-600 hover:bg-blue-700 ml-4"
              >
                Request Task
              </Button>
            )}

            {hasRequested && (
              <Button disabled className="ml-4 bg-gray-400">
                Request Pending
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  })}
</div>

        </TabsContent>

        <TabsContent value="wallet" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Digital Wallet</h2>
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-green-600">{availableCredits} Credits</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Carbon Credit Portfolio</CardTitle>
              <CardDescription>Manage your earned carbon credits</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credit ID</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Amount (tCO₂)</TableHead>
                    <TableHead>Market Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myCredits.map((credit) => (
                    <TableRow key={credit.id}>
                      <TableCell className="font-mono text-sm">{credit.id}</TableCell>
                      <TableCell>{credit.location}</TableCell>
                      <TableCell>{credit.amount}</TableCell>
                      <TableCell>${credit.price}/tonne</TableCell>
                      <TableCell>
                        <Badge variant={credit.status === 'available' ? 'default' : 'secondary'}>
                          {credit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {credit.status === 'available' && (
                          <Button size="sm" variant="outline">
                            List for Sale
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Credits Minted</p>
                    <p className="text-sm text-gray-600">Odisha Coastline Project</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">+375 Credits</p>
                    <p className="text-sm text-gray-600">Jan 8, 2024</p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Credits Sold</p>
                    <p className="text-sm text-gray-600">To TechCorp Solutions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">-100 Credits</p>
                    <p className="text-sm text-gray-600">Jan 10, 2024</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

  <TabsContent value="mytasks" className="space-y-6">
  <h2 className="text-2xl font-bold">My Tasks</h2>
  <div className="grid gap-4">
    {myTasks.map((task) => {
      const record = mrvByProject[task.id];
      const isSubmitted = !!record;

      const assignedToMe = task.ngoId?._id === currentUserId;
      const assignedToSomeoneElse = task.ngoId?._id && task.ngoId._id !== currentUserId;
      const requestedByMe = task.requestedBy?.includes(currentUserId);

      // Determine status label
      let statusLabel = task.status;
      if (assignedToMe) statusLabel = 'Assigned to Me';
      else if (assignedToSomeoneElse) statusLabel = 'Assigned to another NGO';
      else if (requestedByMe) statusLabel = 'Requested';

      return (
        <Card
          key={task.id}
          className={`${
            statusLabel.includes('InProgress') ? 'border-blue-200' :
            statusLabel.includes('Completed') ? 'border-green-200' :
            statusLabel.includes('Assigned') ? 'border-yellow-200' :
            statusLabel.includes('Requested') ? 'border-purple-200' :
            'border-gray-200'
          }`}
        >
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {task.location?.coordinates
                    ? `${task.location.coordinates[1]}, ${task.location.coordinates[0]}`
                    : 'No location'}
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={
                    statusLabel.includes('InProgress') ? 'default' :
                    statusLabel.includes('Completed') ? 'secondary' :
                    statusLabel.includes('Assigned') ? 'outline' :
                    statusLabel.includes('Requested') ? 'outline' :
                    'outline'
                  }>
                    {statusLabel}
                  </Badge>
                  <Badge variant="outline">{task.targetTrees} trees</Badge>
                  {task.carbonCredits && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {task.carbonCredits} credits earned
                    </Badge>
                  )}
                </div>
              </div>

              <div className="ml-4">
                {assignedToMe && (
                  <div className="flex flex-col gap-2">
                    {isSubmitted ? (
                      <div>
                        <div className="text-sm text-gray-600">
                          Under Verification • Status: {statusLabel}
                        </div>
                        {statusLabel === 'Validated' && (
                          <Badge variant="default" className="bg-green-100 text-green-700">
                            Verified
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => openMrvFor(task.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Submit Report
                      </Button>
                    )}
                  </div>
                )}

                {requestedByMe && !assignedToMe && !assignedToSomeoneElse && (
                  <div>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      Request Pending
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
</TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <h2 className="text-2xl font-bold">NGO Profile</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Organization Name</Label>
                  <p className="text-lg font-medium">Green Earth NGO</p>
                </div>
                <div>
                  <Label>Registration ID</Label>
                  <p className="font-mono">NGO-2024-GE-001</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p>New Delhi, India</p>
                </div>
                <div>
                  <Label>Verification Status</Label>
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Projects Completed:</span>
                  <span className="font-semibold">15</span>
                </div>
                <div className="flex justify-between">
                  <span>Trees Planted:</span>
                  <span className="font-semibold">3,750</span>
                </div>
                <div className="flex justify-between">
                  <span>Credits Earned:</span>
                  <span className="font-semibold">2,250 tCO₂</span>
                </div>
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className="font-semibold">100%</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Rating:</span>
                  <span className="font-semibold">4.8/5.0</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>
      <MRVReportModal
        open={mrvOpen}
        onOpenChange={(open) => setMrvOpen(open)}
        projectId={mrvProjectId}
        ngoRegistrationId={currentUserId || 'NGO-2024-GE-001'}
        onSuccess={(record: any) => {
          const key = record?.projectId ?? record?.externalProjectId;
          if (key) {
            setMrvByProject(prev => ({ ...prev, [key]: record }));
            setMyTasks(prev => prev.map(t => t.id === key ? { ...t, status: 'InProgress' } : t));
          }
        }}
      />
    </div>
  );
}