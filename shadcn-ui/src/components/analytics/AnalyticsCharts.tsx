import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AnalyticsChartsProps {
  totalCredits: number;
  availableCredits: number;
  myTasks: any[];
  availableTasks?: any[];
}

const COLORS = {
  primary: 'hsl(142, 76%, 36%)',
  success: 'hsl(142, 76%, 45%)',
  info: 'hsl(217, 91%, 60%)',
  warning: 'hsl(48, 96%, 53%)',
  purple: 'hsl(262, 83%, 58%)',
  muted: 'hsl(220, 8.9%, 46.1%)',
};

export default function AnalyticsCharts({ 
  totalCredits, 
  availableCredits,
  myTasks,
  availableTasks = []
}: AnalyticsChartsProps) {
  // Combine marketplace and my projects for unified metrics
  const allProjects = [ ...(availableTasks || []), ...(myTasks || []) ];

  // Project Status Distribution (derive from allProjects)
  const statusCounts = allProjects.reduce((acc: Record<string, number>, p: any) => {
    const s = p.status || 'Created';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const projectStatusData = [
    { name: 'Completed', value: statusCounts['Completed'] || 0, color: COLORS.success },
    { name: 'In Progress', value: statusCounts['InProgress'] || statusCounts['In Progress'] || 0, color: COLORS.info },
    { name: 'Created', value: statusCounts['Created'] || 0, color: COLORS.warning },
    { name: 'Verified', value: statusCounts['Verified'] || 0, color: COLORS.purple },
    { name: 'Assigned', value: statusCounts['Assigned'] || 0, color: COLORS.primary },
  ].filter(item => item.value > 0);

  // Credits Distribution
  const usedCredits = Math.max(0, totalCredits - availableCredits);
  const creditsData = [
    { name: 'Available for Sale', value: availableCredits, color: COLORS.success },
    { name: 'Sold/Used', value: usedCredits, color: COLORS.muted },
  ].filter(item => item.value >= 0);

  // Monthly Progress: last 6 months aggregation from project creation date (createdAt)
  const getLastNMonths = (n: number) => {
    const res: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = d.toLocaleString(undefined, { month: 'short' });
      res.push({ key, label });
    }
    return res;
  };

  const months = getLastNMonths(6);

  const monthlyMap: Record<string, { projects: number; credits: number }> = {};
  months.forEach(m => { monthlyMap[m.key] = { projects: 0, credits: 0 }; });

  allProjects.forEach((p: any) => {
    // try multiple date fields
    const dateStr = p.createdAt || p.createdOn || p.date || p.created_at;
    const d = dateStr ? new Date(dateStr) : new Date();
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const creditsForProject = p.carbonCredits ?? Math.floor((p.targetTrees || p.treeCount || 0) * 0.75);
    if (monthlyMap[key]) {
      monthlyMap[key].projects += 1;
      monthlyMap[key].credits += creditsForProject;
    }
  });

  const monthlyData = months.map(m => ({ month: m.label, projects: monthlyMap[m.key].projects, credits: monthlyMap[m.key].credits }));

  // Tree Planting Goals vs Achievement - combine marketplace and my projects
  const combinedProjects = [
    // Marketplace projects: no achieved yet (0)
    ...(availableTasks || []).map((p: any) => ({
      title: p.title || p.name || 'Marketplace Project',
      target: p.targetTrees || p.treeCount || 0,
      achieved: p.treeCount || 0,
      source: 'Marketplace'
    })),
    // My projects: show actual achieved/treeCount
    ...(myTasks || []).map((p: any) => ({
      title: p.title || p.name || 'My Project',
      target: p.targetTrees || p.treeCount || 0,
      achieved: p.treeCount || 0,
      source: 'My Projects'
    }))
  ];

  const goalData = combinedProjects.slice(0, 10).map((task: any, idx: number) => ({
    project: task.title.length > 18 ? task.title.slice(0, 15) + '...' : task.title,
    target: task.target || 0,
    achieved: task.achieved || 0,
    source: task.source,
    fullTitle: task.title,
    id: idx,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Project Status Pie Chart */}
      <Card className="bg-gradient-subtle border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Project Status Distribution</CardTitle>
          <CardDescription>Overview of all your projects by status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name} ${Math.round((entry.percent || 0) * 100)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Progress Chart */}
      <Card className="bg-gradient-subtle border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Monthly Progress</CardTitle>
          <CardDescription>Projects completed and credits earned over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="month" stroke="hsl(220, 8.9%, 46.1%)" />
              <YAxis stroke="hsl(220, 8.9%, 46.1%)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 100%)', 
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)'
                }} 
              />
              <Area
                type="monotone"
                dataKey="credits"
                stackId="1"
                stroke={COLORS.success}
                fill={COLORS.success}
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="projects"
                stackId="2"
                stroke={COLORS.info}
                fill={COLORS.info}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Credits Distribution */}
      <Card className="bg-gradient-subtle border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Carbon Credits Portfolio</CardTitle>
          <CardDescription>Available vs utilized carbon credits</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={creditsData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {creditsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-4">
            {creditsData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tree Planting Goals */}
      <Card className="bg-gradient-subtle border-0 shadow-card">
        <CardHeader>
          <CardTitle className="text-foreground">Tree Planting Performance</CardTitle>
          <CardDescription>Target vs achieved trees planted by project</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="project" stroke="hsl(220, 8.9%, 46.1%)" />
              <YAxis stroke="hsl(220, 8.9%, 46.1%)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(0, 0%, 100%)', 
                  border: '1px solid hsl(220, 13%, 91%)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-card)'
                }} 
              />
              <Bar dataKey="target" fill={COLORS.muted} name="Target" />
              <Bar dataKey="achieved" fill={COLORS.success} name="Achieved" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}