import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Activity, 
  FileCheck, 
  Calculator,
  Brain
} from "lucide-react";
import { SaleSimulatorTab } from "@/components/inteligencia/SaleSimulatorTab";
import { PayrollTab } from "@/components/inteligencia/PayrollTab";
import { BenchmarkingTab } from "@/components/inteligencia/BenchmarkingTab";
import { KPIDashboardTab } from "@/components/inteligencia/KPIDashboardTab";
import { MedicationAuditTab } from "@/components/inteligencia/MedicationAuditTab";
import { CostAbsorptionTab } from "@/components/inteligencia/CostAbsorptionTab";

const Inteligencia = () => {
  const [activeTab, setActiveTab] = useState("kpis");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Inteligencia de Negocio</h1>
            <p className="text-muted-foreground">
              Análisis avanzado, simulaciones y herramientas para tomar mejores decisiones
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-2 bg-muted/50">
            <TabsTrigger 
              value="kpis" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard KPIs</span>
              <span className="sm:hidden">KPIs</span>
            </TabsTrigger>
            <TabsTrigger 
              value="simulador" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Simulador Ventas</span>
              <span className="sm:hidden">Ventas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="benchmarking" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Benchmarking</span>
              <span className="sm:hidden">Bench</span>
            </TabsTrigger>
            <TabsTrigger 
              value="costos" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Costo/Unidad</span>
              <span className="sm:hidden">Costos</span>
            </TabsTrigger>
            <TabsTrigger 
              value="nomina" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Nómina</span>
              <span className="sm:hidden">Nómina</span>
            </TabsTrigger>
            <TabsTrigger 
              value="auditoria" 
              className="flex items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Auditoría</span>
              <span className="sm:hidden">Audit</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="mt-6">
            <KPIDashboardTab />
          </TabsContent>

          <TabsContent value="simulador" className="mt-6">
            <SaleSimulatorTab />
          </TabsContent>

          <TabsContent value="benchmarking" className="mt-6">
            <BenchmarkingTab />
          </TabsContent>

          <TabsContent value="costos" className="mt-6">
            <CostAbsorptionTab />
          </TabsContent>

          <TabsContent value="nomina" className="mt-6">
            <PayrollTab />
          </TabsContent>

          <TabsContent value="auditoria" className="mt-6">
            <MedicationAuditTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Inteligencia;
