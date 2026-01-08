import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FounderProvider } from "@/contexts/FounderContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FounderModeBanner } from "@/components/founder/FounderModeBanner";

// Public pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Legal pages
import Terminos from "./pages/legal/Terminos";
import Privacidad from "./pages/legal/Privacidad";
import Cookies from "./pages/legal/Cookies";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Animales from "./pages/Animales";
import ConsultarAnimal from "./pages/ConsultarAnimal";
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

// Founder pages
import FounderDashboard from "./pages/FounderDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FounderProvider>
        <OfflineProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <FounderModeBanner />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />

                {/* Legal routes */}
                <Route path="/terminos" element={<Terminos />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/cookies" element={<Cookies />} />

                {/* Founder route */}
                <Route path="/founder" element={<ProtectedRoute><FounderDashboard /></ProtectedRoute>} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/usuarios" element={<ProtectedRoute><Usuarios /></ProtectedRoute>} />
                <Route path="/consultar-animal" element={<ProtectedRoute><ConsultarAnimal /></ProtectedRoute>} />
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
        </OfflineProvider>
      </FounderProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
