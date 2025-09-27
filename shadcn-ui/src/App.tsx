import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import Dashboard from "./pages/Dashboard";
import GovernmentPortal from "./components/GovernmentPortal";
import NGOPortal from "./components/NGOPortal";
import CorporatePortal from "./components/CorporatePortal";
import NotFound from "./pages/NotFound";

import LoginGov from "./components/LoginGov";
import LoginNGO from "./components/Ngo/LoginNGO";
import RegisterNGO from "./components/Ngo/RegisterNGO";
import LoginCorporate from "./components/Corporate/LoginCorporate";
import RegisterCorporate from "./components/Corporate/RegisterCorporate";
import ProjectDetail from "./pages/ProjectDetail";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";
import NgoDetail from "./pages/NgoDetail";
import ProjectReports from "./pages/ProjectReports";
import SubscriptionPage from "./pages/Subscription";
import MRVReportDetail from "./pages/MRVReportDetail";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Auth Routes */}
            <Route path="/login-gov" element={<LoginGov />} />
            <Route path="/login-ngo" element={<LoginNGO />} />
            <Route path="/register-ngo" element={<RegisterNGO />} />
            <Route path="/login-corporate" element={<LoginCorporate />} />
            <Route path="/register-corporate" element={<RegisterCorporate />} />
            <Route path="/government/projects/:projectId" element={<ProjectDetail />} />
                <Route path="/ngos/:ngoId" element={<NgoDetail/>} />
            {/* Protected Routes with Role Access */}
            <Route
              path="/government"
              element={
                <ProtectedRoute allowedRoles={["GOV"]}>
                  <GovernmentPortal />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ngo"
              element={
                <ProtectedRoute allowedRoles={["NGO"]}>
                  <NGOPortal />
                </ProtectedRoute>
              }
            />
                <Route path="/government/projects/:projectId/reports/:mrvId" element={<MRVReportDetail />} />
            <Route path="/government/projects/:projectId/reports" element={<ProjectReports />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            
            <Route
              path="/corporate"
              element={
                <ProtectedRoute allowedRoles={["Comp"]}>
                  <CorporatePortal />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
