import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Animales from "./pages/Animales";
import Reproduccion from "./pages/Reproduccion";
import ProduccionLeche from "./pages/ProduccionLeche";
import ProduccionCarne from "./pages/ProduccionCarne";
import Salud from "./pages/Salud";
import Alimentacion from "./pages/Alimentacion";
import Praderas from "./pages/Praderas";
import Simulaciones from "./pages/Simulaciones";
import Reportes from "./pages/Reportes";
import Costos from "./pages/Costos";
import Insumos from "./pages/Insumos";
import Genetica from "./pages/Genetica";
import Intercambio from "./pages/Intercambio";
import AppMovil from "./pages/AppMovil";
import Configuracion from "./pages/Configuracion";
import Ayuda from "./pages/Ayuda";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
            <Route path="/animales" element={<ProtectedRoute><Animales /></ProtectedRoute>} />
            <Route path="/reproduccion" element={<ProtectedRoute><Reproduccion /></ProtectedRoute>} />
            <Route path="/produccion-leche" element={<ProtectedRoute><ProduccionLeche /></ProtectedRoute>} />
            <Route path="/produccion-carne" element={<ProtectedRoute><ProduccionCarne /></ProtectedRoute>} />
            <Route path="/salud" element={<ProtectedRoute><Salud /></ProtectedRoute>} />
            <Route path="/alimentacion" element={<ProtectedRoute><Alimentacion /></ProtectedRoute>} />
            <Route path="/praderas" element={<ProtectedRoute><Praderas /></ProtectedRoute>} />
            <Route path="/simulaciones" element={<ProtectedRoute><Simulaciones /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute><Reportes /></ProtectedRoute>} />
            <Route path="/costos" element={<ProtectedRoute><Costos /></ProtectedRoute>} />
            <Route path="/insumos" element={<ProtectedRoute><Insumos /></ProtectedRoute>} />
            <Route path="/genetica" element={<ProtectedRoute><Genetica /></ProtectedRoute>} />
            <Route path="/intercambio" element={<ProtectedRoute><Intercambio /></ProtectedRoute>} />
            <Route path="/app-movil" element={<ProtectedRoute><AppMovil /></ProtectedRoute>} />
            <Route path="/configuracion" element={<ProtectedRoute><Configuracion /></ProtectedRoute>} />
            <Route path="/ayuda" element={<ProtectedRoute><Ayuda /></ProtectedRoute>} />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
