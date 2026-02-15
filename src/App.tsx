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
import PermissionGuard from "@/components/PermissionGuard";
import ErrorBoundary from "@/components/shared/ErrorBoundary";

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
import Herramientas from "./pages/Herramientas";

// Founder pages
import FounderDashboard from "./pages/FounderDashboard";
import Inteligencia from "./pages/Inteligencia";

// Configure QueryClient with retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 2,
      retryDelay: 1000,
    },
  },
});

const App = () => (
  <ErrorBoundary moduleName="Aplicación">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FounderProvider>
          <OfflineProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />

                  {/* Legal routes */}
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  <Route path="/cookies" element={<Cookies />} />

                  {/* Founder route */}
                  <Route path="/founder" element={<ProtectedRoute><ErrorBoundary moduleName="Panel Founder"><FounderDashboard /></ErrorBoundary></ProtectedRoute>} />

                  {/* Protected routes with Error Boundaries */}
                  <Route path="/dashboard" element={<ProtectedRoute><PermissionGuard moduleName="dashboard"><ErrorBoundary moduleName="Dashboard"><Dashboard /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/usuarios" element={<ProtectedRoute><PermissionGuard moduleName="usuarios"><ErrorBoundary moduleName="Usuarios"><Usuarios /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/consultar-animal" element={<ProtectedRoute><PermissionGuard moduleName="animales"><ErrorBoundary moduleName="Consultar Animal"><ConsultarAnimal /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/animales" element={<ProtectedRoute><PermissionGuard moduleName="animales"><ErrorBoundary moduleName="Animales"><Animales /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/reproduccion" element={<ProtectedRoute><PermissionGuard moduleName="reproduccion"><ErrorBoundary moduleName="Reproducción"><Reproduccion /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/produccion-leche" element={<ProtectedRoute><PermissionGuard moduleName="produccion-leche"><ErrorBoundary moduleName="Producción de Leche"><ProduccionLeche /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/produccion-carne" element={<ProtectedRoute><PermissionGuard moduleName="produccion-carne"><ErrorBoundary moduleName="Producción de Carne"><ProduccionCarne /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/salud" element={<ProtectedRoute><PermissionGuard moduleName="salud"><ErrorBoundary moduleName="Salud"><Salud /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/alimentacion" element={<ProtectedRoute><PermissionGuard moduleName="alimentacion"><ErrorBoundary moduleName="Alimentación"><Alimentacion /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/praderas" element={<ProtectedRoute><PermissionGuard moduleName="praderas"><ErrorBoundary moduleName="Praderas"><Praderas /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/simulaciones" element={<ProtectedRoute><PermissionGuard moduleName="simulaciones"><ErrorBoundary moduleName="Simulaciones"><Simulaciones /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/reportes" element={<ProtectedRoute><PermissionGuard moduleName="reportes"><ErrorBoundary moduleName="Reportes"><Reportes /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/costos" element={<ProtectedRoute><PermissionGuard moduleName="costos"><ErrorBoundary moduleName="Costos"><Costos /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/insumos" element={<ProtectedRoute><PermissionGuard moduleName="insumos"><ErrorBoundary moduleName="Insumos"><Insumos /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/genetica" element={<ProtectedRoute><PermissionGuard moduleName="genetica"><ErrorBoundary moduleName="Genética"><Genetica /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/intercambio" element={<ProtectedRoute><PermissionGuard moduleName="intercambio"><ErrorBoundary moduleName="Intercambio"><Intercambio /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/app-movil" element={<ProtectedRoute><PermissionGuard moduleName="app-movil"><ErrorBoundary moduleName="App Móvil"><AppMovil /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/configuracion" element={<ProtectedRoute><PermissionGuard moduleName="configuracion"><ErrorBoundary moduleName="Configuración"><Configuracion /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/ayuda" element={<ProtectedRoute><PermissionGuard moduleName="ayuda"><ErrorBoundary moduleName="Ayuda"><Ayuda /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/herramientas" element={<ProtectedRoute><PermissionGuard moduleName="herramientas"><ErrorBoundary moduleName="Herramientas"><Herramientas /></ErrorBoundary></PermissionGuard></ProtectedRoute>} />
                  <Route path="/inteligencia" element={<ProtectedRoute><ErrorBoundary moduleName="Inteligencia"><Inteligencia /></ErrorBoundary></ProtectedRoute>} />

                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </OfflineProvider>
        </FounderProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
