import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Plus, CheckCircle, Clock, AlertCircle, BarChart3, Shield } from 'lucide-react';
import { mockTasks, type Task } from '@/lib/mockData';
import AIVerification from './AIVerification';

export default function GovernmentPortal() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    location: '',
    treeCount: '',
    species: '',
    description: ''
  });

  const handleCreateTask = () => {
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      location: newTask.location,
      coordinates: { lat: 28.6139, lng: 77.2090 }, // Default Delhi coordinates
      treeCount: parseInt(newTask.treeCount),
      species: newTask.species.split(',').map(s => s.trim()),
      status: 'pending',
      createdBy: 'Government Official',
      createdDate: new Date().toISOString().split('T')[0]
    };
    
    setTasks([task, ...tasks]);
    setNewTask({ title: '', location: '', treeCount: '', species: '', description: '' });
    setShowCreateTask(false);
  };

  const handleVerifyTask = (task: Task) => {
    setSelectedTask(task);
    setShowVerification(true);
  };

  const handleApproveVerification = (taskId: string) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: 'verified' as const, carbonCredits: Math.floor(task.treeCount * 0.75) }
        : task
    ));
    setShowVerification(false);
    setSelectedTask(null);
  };

  if (showVerification && selectedTask) {
    return (
      <AIVerification 
        task={selectedTask}
        onApprove={() => handleApproveVerification(selectedTask.id)}
        onReject={() => setShowVerification(false)}
        onBack={() => setShowVerification(false)}
      />
    );
  }

  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const activeTasks = tasks.filter(t => t.status === 'active').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalCreditsIssued = tasks.reduce((sum, t) => sum + (t.carbonCredits || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Pending Tasks</p>
                <p className="text-3xl font-bold">{pendingTasks}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Tasks</p>
                <p className="text-3xl font-bold">{activeTasks}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completed</p>
                <p className="text-3xl font-bold">{completedTasks}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Credits Issued</p>
                <p className="text-3xl font-bold">{totalCreditsIssued}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tasks">Task Management</TabsTrigger>
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Afforestation Tasks</h2>
            <Button onClick={() => setShowCreateTask(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Create New Task
            </Button>
          </div>

          {showCreateTask && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Afforestation Task</CardTitle>
                <CardDescription>Define a new plantation project for NGOs to execute</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                      placeholder="e.g., Urban Forest Development"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={newTask.location}
                      onChange={(e) => setNewTask({...newTask, location: e.target.value})}
                      placeholder="e.g., Delhi Ridge Area"
                    />
                  </div>
                  <div>
                    <Label htmlFor="treeCount">Number of Trees</Label>
                    <Input
                      id="treeCount"
                      type="number"
                      value={newTask.treeCount}
                      onChange={(e) => setNewTask({...newTask, treeCount: e.target.value})}
                      placeholder="e.g., 500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="species">Tree Species (comma-separated)</Label>
                    <Input
                      id="species"
                      value={newTask.species}
                      onChange={(e) => setNewTask({...newTask, species: e.target.value})}
                      placeholder="e.g., Neem, Peepal, Banyan"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Describe the project objectives and requirements..."
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleCreateTask} className="bg-green-600 hover:bg-green-700">
                    Create Task
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {task.location}
                        </div>
                      </TableCell>
                      <TableCell>{task.treeCount}</TableCell>
                      <TableCell>
                        <Badge variant={
                          task.status === 'pending' ? 'secondary' :
                          task.status === 'active' ? 'default' :
                          task.status === 'completed' ? 'outline' : 'default'
                        }>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{task.assignedTo || 'Unassigned'}</TableCell>
                      <TableCell>
                        {task.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVerifyTask(task)}
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Verify
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

        <TabsContent value="verification" className="space-y-6">
          <h2 className="text-2xl font-bold">Verification Queue</h2>
          <div className="grid gap-4">
            {tasks.filter(t => t.status === 'completed').map((task) => (
              <Card key={task.id} className="border-orange-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{task.title}</h3>
                      <p className="text-gray-600">{task.location}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Completed by {task.assignedTo} on {task.completedDate}
                      </p>
                      <div className="mt-2">
                        <Badge variant="outline" className="mr-2">
                          {task.treeCount} trees planted
                        </Badge>
                        <Badge variant="outline">
                          Potential: {Math.floor(task.treeCount * 0.75)} credits
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleVerifyTask(task)}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Review & Verify
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-bold">System Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Projects Created:</span>
                    <span className="font-semibold">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Trees Planned:</span>
                    <span className="font-semibold">{tasks.reduce((sum, t) => sum + t.treeCount, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completion Rate:</span>
                    <span className="font-semibold">{Math.round((completedTasks / tasks.length) * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbon Credits Issued:</span>
                    <span className="font-semibold">{totalCreditsIssued} tonnes CO₂</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>West Bengal</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-1/3 h-2 bg-green-500 rounded"></div>
                      </div>
                      <span className="text-sm">1 project</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delhi</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-1/3 h-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-sm">1 project</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Odisha</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-1/3 h-2 bg-purple-500 rounded"></div>
                      </div>
                      <span className="text-sm">1 project</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}