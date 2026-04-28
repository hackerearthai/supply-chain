import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useApp } from "@/context/AppContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { Login } from "@/components/Login";
import Dashboard from "./pages/Dashboard";
import Shipments from "./pages/Shipments";
import DemandForecast from "./pages/DemandForecast";
import Warehouses from "./pages/Warehouses";
import MyData from "./pages/MyData";
import CsvUpload from "./pages/CsvUpload";
import GoogleSheetsIntegration from "./pages/GoogleSheetsIntegration";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Auth wrapper component
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user } = useApp();
  return user ? <>{children}</> : <Login onLoginSuccess={() => {}} />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login onLoginSuccess={() => {}} />} />
    <Route element={<AuthWrapper><AppLayout /></AuthWrapper>}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/shipments" element={<Shipments />} />
      <Route path="/forecast" element={<DemandForecast />} />
      <Route path="/warehouses" element={<Warehouses />} />
      <Route path="/data" element={<MyData />} />
      <Route path="/orders" element={<MyData />} />
      <Route path="/upload" element={<CsvUpload />} />
      <Route path="/sheets" element={<GoogleSheetsIntegration />} />
    </Route>
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
