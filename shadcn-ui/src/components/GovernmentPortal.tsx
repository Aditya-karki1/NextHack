import { useState, useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, CheckCircle, Clock, AlertCircle, BarChart3, Shield, Users } from "lucide-react";
import AIVerification from "./AIVerification";
import { useNavigate } from "react-router-dom";
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

  // Fetch projects & NGOs on load
  useEffect(() => {
    fetch("http://localhost:4000/api/v1/gov/projects")
      .then((res) => res.json())
      .then((data) => {console.log(data),setTasks(data?.projects || [])})
      .catch(() => setTasks([]));

    fetch("http://localhost:4000/api/v1/gov/ngos")
      .then((res) => res.json())
      .then((data) =>{console.log(data), setNgos(data?.ngos || [])})
      .catch(() => setNgos([]));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewProject((prev) => ({ ...prev, images: Array.from(e.target.files) }));
    }
  };

  const handleCreateTask = async () => {
    const formData = new FormData();
    Object.entries(newProject).forEach(([key, value]) => {
      if (key === "images") (value as File[]).forEach((img) => formData.append("landImages", img));
      else formData.append(key, value as string);
    });
console.log("Submitting project:", newProject);
for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }
    try {
      const res = await fetch("http://localhost:4000/api/v1/gov/projects", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      setTasks([data?.project, ...tasks]);
      setShowCreateModal(false);
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const handleAssignProject = async (projectId: string, ngoId: string) => {
    console.log("Assigning project:", projectId, "to NGO:", ngoId);
    await fetch(`http://localhost:4000/api/v1/gov/projects/${projectId}/assign`, {
      method: "POST",
       credentials: "include",
        headers: {
    "Content-Type": "application/json", // <-- Important!
  },
      body: JSON.stringify({ ngoId }),
    });

    const updatedProjects = await fetch("http://localhost:4000/api/v1/gov/projects").then((res) => res.json());
    console.log(updatedProjects);
    setTasks(updatedProjects?.projects || []);
  };

  const handleVerifyTask = (task: any) => {
    setSelectedTask(task);
    setShowVerification(true);
  };

  const handleApproveVerification = (taskId: string) => {
    setTasks(tasks.map((t) => (t?._id === taskId ? { ...t, status: "verified" } : t)));
    setShowVerification(false);
    setSelectedTask(null);
  };

  if (showVerification && selectedTask) {
    return (
      <AIVerification
        task={selectedTask}
        onApprove={() => handleApproveVerification(selectedTask?._id)}
        onReject={() => setShowVerification(false)}
        onBack={() => setShowVerification(false)}
      />
    );
  }
  const navigate = useNavigate();
const handleProjectClick = (projectId: string) => {
  navigate(`/government/projects/${projectId}`);
};
const handleNgoClick = (ngoId: string) => {
  navigate(`/ngos/${ngoId}`);
};
  // Safe analytics
  const pendingTasks = tasks?.filter((t) => t?.status === "pending")?.length || 0;
  const activeTasks = tasks?.filter((t) => t?.status === "active")?.length || 0;
  const completedTasks = tasks?.filter((t) => t?.status === "completed")?.length || 0;
  const totalCreditsIssued = tasks?.reduce((sum, t) => sum + (t?.carbonCredits || 0), 0) || 0;

  return (
    <div className="space-y-6 p-6 m-4">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { title: "Pending Tasks", count: pendingTasks, color: "blue", icon: Clock },
          { title: "Active Tasks", count: activeTasks, color: "orange", icon: AlertCircle },
          { title: "Completed", count: completedTasks, color: "green", icon: CheckCircle },
          { title: "Credits Issued", count: totalCreditsIssued, color: "purple", icon: BarChart3 },
          { title: "Total NGOs", count: ngos.length, color: "pink", icon: Users },
        ].map(({ title, count, color, icon: Icon }) => (
          <Card key={title} className={`bg-gradient-to-r from-${color}-500 to-${color}-600 text-white p-2`}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className={`text-${color}-100 text-sm`}>{title}</p>
                <p className="text-3xl font-bold">{count}</p>
              </div>
              <Icon className={`w-8 h-8 text-${color}-200`} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-6 mt-6">
        <TabsList className="grid w-full grid-cols-4 p-2">
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="ngos">NGO List</TabsTrigger>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Task Management */}
        <TabsContent value="tasks" className="space-y-6 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Afforestation Tasks</h2>
            <Button onClick={() => setShowCreateModal(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" /> Create New Project
            </Button>
          </div>

          {/* Create Project Modal */}
          <Dialog open={showCreateModal} onClose={() => setShowCreateModal(false)} className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <Dialog.Panel className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 m-4">
                <Dialog.Title className="text-lg font-bold mb-4">Create New Project</Dialog.Title>
                <div className="space-y-4 mt-4">
                  {[
                    { label: "Project Title", key: "title", type: "text" },
                    { label: "Area (Hectares)", key: "areaHectares", type: "number" },
                    { label: "Target Trees", key: "targetTrees", type: "number" },
                    { label: "Start Date", key: "startDate", type: "date" },
                    { label: "End Date", key: "endDate", type: "date" },
                    { label: "Latitude", key: "lat", type: "text" },
                    { label: "Longitude", key: "lng", type: "text" },
                  ].map(({ label, key, type }) => (
                    <div key={key}>
                      <Label>{label}</Label>
                      <Input type={type} value={newProject[key as keyof typeof newProject] as string}
                        onChange={(e) => setNewProject({ ...newProject, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div><Label>Description</Label><Textarea value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} /></div>
                  <div><Label>Upload Images</Label><Input type="file" multiple onChange={handleFileChange} /></div>
                </div>
                <div className="flex justify-end mt-6 space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                  <Button onClick={handleCreateTask} className="bg-green-600 hover:bg-green-700">Submit</Button>
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>

          {/* Task Table */}
          <Card className="p-2">
            <CardHeader><CardTitle>All Tasks</CardTitle></CardHeader>
            <CardContent className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Trees</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks?.map((task) => (
                    <TableRow key={task?._id}  onClick={() => handleProjectClick(task._id)}>
                      <TableCell>{task?.title || "Untitled"}</TableCell>
                      <TableCell>
                        <MapPin className="w-4 h-4 mr-1 text-gray-400 inline" />
                        {task?.location?.coordinates
                          ? `${task.location.coordinates[1]}, ${task.location.coordinates[0]}`
                          : "No location"}
                      </TableCell>
                      <TableCell>{task?.targetTrees || 0}</TableCell>
                      <TableCell><Badge>{task?.status || "Unknown"}</Badge></TableCell>
                     <TableCell>
  {task?.ngoId ? task.ngoId.name : (
    <select onChange={(e) => handleAssignProject(task._id, e.target.value)} className="border rounded p-1">
      <option value="">Assign NGO</option>
      {ngos?.map((ngo) => (
        <option key={ngo._id} value={ngo._id}>{ngo.name}</option>
      ))}
    </select>
  )}
</TableCell>

                      <TableCell>
                        {task?.status === "completed" && (
                          <Button size="sm" variant="outline" onClick={() => handleVerifyTask(task)}>
                            <Shield className="w-4 h-4 mr-1" /> Verify
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NGO List */}
        <TabsContent value="ngos" className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">All NGOs</h2>
          {ngos?.map((ngo) => (
            <Card key={ngo._id} className="p-2 m-2" onClick={() => handleNgoClick(ngo._id)}>
              <CardContent>
                <h3 className="font-semibold">{ngo?.name}</h3>
                <p>{ngo?.email}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Verification Queue */}
        <TabsContent value="verification" className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">Verification Queue</h2>
          {tasks?.filter((t) => t?.status === "completed").map((task) => (
            <Card key={task._id} className="p-2 m-2">
              <CardContent className="p-6 flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{task?.title || "Untitled"}</h3>
                  <p className="text-gray-600">{task?.location?.coordinates?.join(", ") || "No location"}</p>
                  <div className="mt-2 space-x-2">
                    <Badge variant="outline">{task?.targetTrees || 0} trees planted</Badge>
                    <Badge variant="outline">Potential: {Math.floor((task?.targetTrees || 0) * 0.75)} credits</Badge>
                  </div>
                </div>
                <Button onClick={() => handleVerifyTask(task)} className="bg-orange-600 hover:bg-orange-700">
                  <Shield className="w-4 h-4 mr-2" /> Review & Verify
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6 p-4">
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-2">
              <CardHeader><CardTitle>Project Overview</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between"><span>Total Projects:</span><span className="font-semibold">{tasks?.length || 0}</span></div>
                  <div className="flex justify-between"><span>Total Trees Planned:</span><span className="font-semibold">{tasks?.reduce((sum, t) => sum + (t?.targetTrees || 0), 0)}</span></div>
                  <div className="flex justify-between"><span>Completion Rate:</span><span className="font-semibold">{tasks?.length ? Math.round((completedTasks / tasks?.length) * 100) : 0}%</span></div>
                  <div className="flex justify-between"><span>Carbon Credits Issued:</span><span className="font-semibold">{totalCreditsIssued} tonnes CO₂</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-2">
              <CardHeader><CardTitle>Regional Distribution</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {["West Bengal", "Delhi", "Odisha"].map((region, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <span>{region}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded">
                          <div className="w-1/3 h-2 rounded" style={{ backgroundColor: ["#22c55e", "#3b82f6", "#8b5cf6"][idx] }}></div>
                        </div>
                        <span className="text-sm">1 project</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
