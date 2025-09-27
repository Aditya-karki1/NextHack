import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, CheckCircle, Clock, Shield, Users, FileText } from "lucide-react";
import AIVerification from "./AIVerification";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function GovernmentPortal() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [ngos, setNgos] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const [newProject, setNewProject] = useState({
    title: "",
    areaHectares: "",
    targetTrees: "",
    startDate: "",
    endDate: "",
    lat: "",
    lng: "",
    description: "",
    images: [] as File[],
  });

  const navigate = useNavigate();

  // Fetch tasks and NGOs
  const fetchAllData = async () => {
    try {
      const projectsRes = await axios.get("http://localhost:4000/api/v1/gov/projects", { withCredentials: true });
      if (projectsRes.data?.success) {
            // APPLYING SORTING: Sort tasks by creation date (newest first)
            const sortedTasks = (projectsRes.data.projects || []).sort(
                (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTasks(sortedTasks);
        }
      
      const ngosRes = await axios.get("http://localhost:4000/api/v1/gov/ngos", { withCredentials: true });
      if (ngosRes.data?.success) setNgos(ngosRes.data.ngos || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setNewProject(prev => ({ ...prev, images: Array.from(e.target.files) }));
  };

  const handleCreateTask = async () => {
    const formData = new FormData();
    const fields = ["title", "areaHectares", "targetTrees", "startDate", "endDate", "lat", "lng", "description"];
    fields.forEach(key => { if (newProject[key]) formData.append(key, newProject[key as keyof typeof newProject]); });
    newProject.images?.forEach(img => formData.append("landImages", img));

    try {
      const res = await axios.post("http://localhost:4000/api/v1/gov/projects", formData, {
        withCredentials: true,
        headers: { "Accept": "application/json" },
      });
      if (res.status === 200 || res.status === 201) {
        fetchAllData();
        setShowCreateModal(false);
        setNewProject({ title: "", areaHectares: "", targetTrees: "", startDate: "", endDate: "", lat: "", lng: "", description: "", images: [] });
      }
    } catch (err: any) {
      console.error("Error creating project:", err.response?.data || err.message);
    }
  };

  const handleAssignProject = async (projectId: string, ngoId: string) => {
    try {
      await axios.put(`http://localhost:4000/api/v1/gov/projects/${projectId}/assign`, { ngoId }, { withCredentials: true });
      fetchAllData();
    } catch (err) {
      console.error("Error assigning project:", err);
    }
  };

  const handleVerifyTask = (task: any) => {
    setSelectedTask(task);
    setShowVerification(true);
  };

  const handleApproveVerification = (taskId: string) => {
    setTasks(tasks.map(t => (t?._id === taskId ? { ...t, status: "Verified" } : t)));
    setShowVerification(false);
    setSelectedTask(null);
  };

  // 1. Project Card Click: Navigates to the base Project Detail Page
  const handleProjectClick = (projectId: string) => navigate(`/government/projects/${projectId}`);
  
  const handleNgoClick = (ngoId: string) => navigate(`/ngos/${ngoId}`);
  
  // 2. Reports List Navigation
  const handleViewReports = (projectId: string) => navigate(`/government/projects/${projectId}/reports`);
  
  // 3. Specific MRV Detail Navigation
  const handleViewMRVDetailFromAction = (projectId: string, mrvId: string) => {
      navigate(`/government/projects/${projectId}/reports/${mrvId}`);
  };


  const createdTasks = tasks.filter(t => t?.status === "Created").length;
  const assignedTasks = tasks.filter(t => t?.status === "Assigned").length;
  const inProgressTasks = tasks.filter(t => t?.status === "InProgress").length;
  const completedTasks = tasks.filter(t => t?.status === "Completed").length;
  const verifiedTasks = tasks.filter(t => t?.status === "Verified").length;
  const totalCreditsIssued = tasks.reduce((sum, t) => sum + (t?.carbonCredits || 0), 0);

  if (showVerification && selectedTask) {
    return (
      <AIVerification
        task={selectedTask}
        onApprove={() => handleApproveVerification(selectedTask._id)}
        onReject={() => setShowVerification(false)}
        onBack={() => setShowVerification(false)}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 m-4" style={{ backgroundColor: '#F0FFF4' }}>
      
      {/* --- STATIC TOP HEADER (GHG NCCR Portal) --- */}
      <div 
          className="w-full bg-white p-4 shadow-lg mb-6" 
          style={{ 
              borderRadius: '12px',
              border: '1px solid #E0E0E0'
          }}
      >
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-green-600" /> NCCR Portal
          </h1>
      </div>
      {/* --- END STATIC TOP HEADER --- */}

      {/* Header Cards - Uses dashboard colors */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { title: "Created", count: createdTasks, bg: "bg-yellow-500", icon: Plus },
          { title: "Assigned", count: assignedTasks, bg: "bg-blue-500", icon: Users },
          { title: "In Progress", count: inProgressTasks, bg: "bg-indigo-600", icon: Clock },
          { title: "Completed", count: completedTasks, bg: "bg-green-600", icon: CheckCircle },
          { title: "Verified", count: verifiedTasks, bg: "bg-purple-700", icon: Shield },
        ].map(({ title, count, bg, icon: Icon }) => (
          <Card key={title} className={`${bg} text-white p-2 shadow-md`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className={`text-white text-sm opacity-80`}>{title}</p>
                <p className="text-3xl font-bold">{count}</p>
              </div>
              <Icon className={`w-8 h-8 text-white opacity-50`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Content Area */}
      <Tabs defaultValue="tasks" className="space-y-6 mt-6">
        <TabsList 
            className="w-full h-auto bg-white p-2 rounded-xl shadow-md border border-gray-200" 
            style={{ display: 'flex', justifyContent: 'space-around', overflow: 'hidden' }}
        >
          {["tasks", "ngos", "verification", "analytics"].map(value => (
                <TabsTrigger 
                    key={value}
                    value={value}
                    className={`
                        py-3 px-6 
                        text-sm font-semibold 
                        text-gray-700 
                        transition-all duration-300 
                        data-[state=active]:text-white
                        data-[state=active]:shadow-md
                        data-[state=active]:bg-gradient-to-r from-green-400 to-teal-500
                        data-[state=active]:rounded-lg
                        data-[state=inactive]:bg-transparent
                        data-[state=inactive]:hover:bg-gray-100
                        mx-1
                        rounded-lg
                    `}
                >
                    {value === 'tasks' && 'Task Management'}
                    {value === 'ngos' && 'NGO List'}
                    {value === 'verification' && 'Verification Queue'}
                    {value === 'analytics' && 'Analytics'}
                </TabsTrigger>
            ))}
        </TabsList>

        {/* Task Management - CONVERTED TO CARD GRID */}
        <TabsContent value="tasks" className="space-y-6 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Afforestation Tasks</h2>
            <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create New Project
            </Button>
          </div>

          {/* Create Project Modal (JSX updated for new UI) */}
          <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 m-4">
                <Dialog.Title className="text-lg font-bold mb-4 border-b pb-2">Create New Project</Dialog.Title>
                <div className="space-y-4 mt-4">
                  
                  {/* Two-Column Grid for Input Fields */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    {/* Input Mapping */}
                    {[
                      { label: "Project Title", key: "title", type: "text" },
                      { label: "Area (Hectares)", key: "areaHectares", type: "number" },
                      { label: "Target Trees", key: "targetTrees", type: "number" },
                      { label: "Start Date", key: "startDate", type: "date" },
                      { label: "End Date", key: "endDate", type: "date" },
                      { label: "Latitude", key: "lat", type: "text" },
                      { label: "Longitude", key: "lng", type: "text" },
                    ].map(({ label, key, type }) => (
                      <div key={key} className={key === 'title' ? 'col-span-2' : 'col-span-1'}>
                        <Label className="text-sm font-medium">{label}</Label>
                        <Input 
                          type={type} 
                          value={newProject[key as keyof typeof newProject] as string}
                          onChange={e => setNewProject({ ...newProject, [key as keyof typeof newProject]: e.target.value })} 
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    ))}
                  </div> {/* End Grid */}

                  {/* Full-Width Description */}
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea 
                      value={newProject.description} 
                      onChange={e => setNewProject({ ...newProject, description: e.target.value })} 
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      rows={3}
                    />
                  </div>
                  
                  {/* Full-Width Image Upload */}
                  <div>
                    <Label className="text-sm font-medium">Upload Land Images</Label>
                    <Input 
                      type="file" 
                      multiple 
                      onChange={handleFileChange} 
                      className="mt-1 block w-full text-sm text-gray-500"
                    />
                  </div>
                </div>
                
                {/* Footer Buttons */}
                <div className="flex justify-end mt-6 space-x-3">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} className="bg-green-600 hover:bg-green-700">Submit Project</Button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>

            {/* PROJECT LISTING - MARKETPLACE CARD STYLE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tasks.map(task => {
                    const reportCount = task.hasMRVReport?.length || 0;
                    const firstMrvId = reportCount > 0 ? task.hasMRVReport[0] : null;

                    return (
                        <Card 
                            key={task._id} 
                            className="p-4 shadow-lg hover:shadow-xl transition-shadow duration-300"
                            style={{ backgroundColor: '#FFFFFF' }}
                        >
                            <CardHeader className="p-0 pb-3 border-b border-gray-100">
                                <div className="flex justify-between items-start">
                                    <CardTitle 
                                        className="text-xl font-semibold cursor-pointer hover:text-green-600"
                                        onClick={() => handleProjectClick(task._id)}
                                    >
                                        {task.title || "Untitled Project"}
                                    </CardTitle>
                                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 font-bold">
                                        {task.status || "Unknown"}
                                    </Badge>
                                </div >
                                <div className="flex items-center text-sm text-gray-500">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {task.location?.coordinates ? `Lat: ${task.location.coordinates[1]}, Lon: ${task.location.coordinates[0]}` : "No location"}
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-0 pt-3 space-y-3">
                                
                                {/* Status and Metric Boxes */}
                                <div className="flex flex-wrap gap-2 text-sm font-medium">
                                    <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">
                                        {task.targetTrees || 0} Target Trees
                                    </Badge>
                                    <Badge className="bg-gray-500/10 text-gray-700 hover:bg-gray-500/20">
                                        Est. {(task.areaHectares * 15).toFixed(0) || 0} Credits*
                                    </Badge>
                                    <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20">
                                        {task.governmentId ? 'Government Project' : 'NGO Lead'}
                                    </Badge>
                                </div >

                                <p className="text-xs text-gray-500">
                                    **Timeline:** {task.startDate?.substring(0, 10)} to {task.endDate?.substring(0, 10) || 'N/A'}
                                </p>
                                
                                {/* Assigned NGO / Assign Button */}
                                <div className="flex items-center pt-2 border-t">
                                    {task.ngoId ? (
                                        <div className="text-sm text-gray-600 flex items-center">
                                            <Users className="w-4 h-4 mr-1 text-blue-500" /> 
                                            Assigned to: <span className="font-semibold ml-1">{task.ngoId.name}</span>
                                        </div>
                                    ) : (
                                        <select
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => handleAssignProject(task._id, e.target.value)}
                                            className="border border-gray-300 rounded p-1 text-sm bg-gray-50"
                                        >
                                            <option value="">Assign NGO</option>
                                            {ngos.filter(ngo => ngo.kycStatus === "VERIFIED").map(ngo => (
                                                <option key={ngo._id} value={ngo._id}>{ngo.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center pt-2">
                                    {/* 1. NEW BUTTON: VIEW ALL REPORTS LIST */}
                                    {reportCount > 0 && (
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                            onClick={e => { 
                                                e.stopPropagation(); 
                                                handleViewMRVDetailFromAction(task._id,firstMrvId); // Navigates to /reports
                                            }}
                                        >
                                            <FileText className="w-4 h-4 mr-1" /> verify report
                                        </Button>
                                    )}
                                     {reportCount > 0 && (
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                            onClick={e => { 
                                                e.stopPropagation(); 
                                                handleViewReports(task._id); // Navigates to /reports
                                            }}
                                        >
                                            <FileText className="w-4 h-4 mr-1" /> All Reports
                                        </Button>
                                    )}

                                    {/* 2. Action Button: VERIFY */}
                                    {task.status === "Completed" && (
                                        <Button
                                            size="sm"
                                            className="bg-orange-500 hover:bg-orange-600 text-white"
                                            onClick={e => { e.stopPropagation(); handleVerifyTask(task); }}
                                        >
                                            <Shield className="w-4 h-4 mr-1" /> VERIFY
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
                </div>
            </TabsContent>

        {/* NGO List - UPDATED UI */}
        <TabsContent value="ngos" className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">All NGOs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ngos.map(ngo => (
                <Card key={ngo._id} className="p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-300" onClick={() => handleNgoClick(ngo._id)}>
                    <CardContent className="p-0">
                        <h3 className="font-semibold text-lg">{ngo.name}</h3>
                        <p className="text-sm text-gray-500">{ngo.email}</p>
                        <Badge className="mt-2 bg-green-500/10 text-green-700">
                            Verified
                        </Badge>
                    </CardContent>
                </Card>
            ))}
          </div>
        </TabsContent>

        {/* Verification Queue (JSX remains the same) */}
        <TabsContent value="verification" className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">Verification Queue</h2>
          {tasks.filter(t => t.status === "Completed").map(task => (
            <Card key={task._id} className="p-2 shadow-md">
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{task.title || "Untitled"}</h3>
                  <p className="text-gray-600">{task.location?.coordinates?.join(", ") || "No location"}</p>
                  <div className="mt-2 space-x-2">
                    <Badge variant="outline">{task.targetTrees || 0} trees planted</Badge>
                    <Badge variant="outline">Potential: {Math.floor((task.targetTrees || 0) * 0.75)} credits</Badge>
                </div>
                </div>
                <Button onClick={() => handleVerifyTask(task)} className="bg-orange-600 hover:bg-orange-700">
                  <Shield className="w-4 h-4 mr-2" /> Review & Verify
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Analytics (JSX remains the same) */}
        <TabsContent value="analytics" className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-2 shadow-md">
              <CardHeader><CardTitle>Project Overview</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between"><span>Total Projects:</span><span className="font-semibold">{tasks.length}</span></div>
                  <div className="flex justify-between"><span>Total Trees Planned:</span><span className="font-semibold">{tasks.reduce((sum, t) => sum + (t.targetTrees || 0), 0)}</span></div>
                  <div className="flex justify-between"><span>Completion Rate:</span><span className="font-semibold">{tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0}%</span></div>
                  <div className="flex justify-between"><span>Carbon Credits Issued:</span><span className="font-semibold">{totalCreditsIssued} tonnes CO₂</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}