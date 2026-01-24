import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePayroll, DEPARTMENTS, POSITIONS, Employee } from "@/hooks/usePayroll";
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Wallet
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const PayrollTab = () => {
  const { 
    employees, 
    payrollRecords, 
    payrollSummary,
    createEmployee,
    createPayrollRecord,
    calculatePayroll,
    updatePayrollStatus,
    loadingEmployees
  } = usePayroll();

  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isGeneratePayrollOpen, setIsGeneratePayrollOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  // New employee form
  const [newEmployee, setNewEmployee] = useState({
    full_name: '',
    document_id: '',
    position: '',
    department: '',
    hire_date: format(new Date(), 'yyyy-MM-dd'),
    base_salary: '',
    payment_frequency: 'monthly' as const,
    phone: '',
  });

  // Payroll generation form
  const [payrollForm, setPayrollForm] = useState({
    employee_id: '',
    period_start: '',
    period_end: '',
    overtime_hours: '0',
    bonuses: '0',
    deductions: '0',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleAddEmployee = () => {
    createEmployee.mutate({
      ...newEmployee,
      base_salary: Number(newEmployee.base_salary),
      is_active: true,
      termination_date: undefined,
    }, {
      onSuccess: () => {
        setIsAddEmployeeOpen(false);
        setNewEmployee({
          full_name: '',
          document_id: '',
          position: '',
          department: '',
          hire_date: format(new Date(), 'yyyy-MM-dd'),
          base_salary: '',
          payment_frequency: 'monthly',
          phone: '',
        });
      }
    });
  };

  const handleGeneratePayroll = () => {
    const employee = employees.find(e => e.id === payrollForm.employee_id);
    if (!employee) return;

    const calculation = calculatePayroll(employee, {
      periodStart: payrollForm.period_start,
      periodEnd: payrollForm.period_end,
      overtimeHours: Number(payrollForm.overtime_hours),
      bonuses: Number(payrollForm.bonuses),
      deductions: Number(payrollForm.deductions),
    });

    createPayrollRecord.mutate({
      employee_id: payrollForm.employee_id,
      period_start: payrollForm.period_start,
      period_end: payrollForm.period_end,
      ...calculation,
      status: 'pending',
    }, {
      onSuccess: () => {
        setIsGeneratePayrollOpen(false);
        setPayrollForm({
          employee_id: '',
          period_start: '',
          period_end: '',
          overtime_hours: '0',
          bonuses: '0',
          deductions: '0',
        });
      }
    });
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'approved': return 'secondary';
      case 'pending': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Empleados Activos</p>
                <p className="text-3xl font-bold">{payrollSummary.totalEmployees}</p>
              </div>
              <Users className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Nómina Mensual</p>
                <p className="text-2xl font-bold">{formatCurrency(payrollSummary.totalMonthlyPayroll)}</p>
              </div>
              <Wallet className="h-10 w-10 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagos Pendientes</p>
                <p className="text-3xl font-bold text-yellow-500">{payrollSummary.pendingPayments}</p>
              </div>
              <Clock className="h-10 w-10 text-yellow-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pagado Este Mes</p>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(payrollSummary.paidThisMonth)}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="employees" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="employees">Empleados</TabsTrigger>
            <TabsTrigger value="payroll">Registros de Nómina</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Nuevo Empleado
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Registrar Empleado</DialogTitle>
                  <DialogDescription>
                    Agrega un nuevo empleado al sistema de nómina
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label>Nombre Completo *</Label>
                      <Input
                        value={newEmployee.full_name}
                        onChange={(e) => setNewEmployee({...newEmployee, full_name: e.target.value})}
                        placeholder="Nombre del empleado"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Documento</Label>
                      <Input
                        value={newEmployee.document_id}
                        onChange={(e) => setNewEmployee({...newEmployee, document_id: e.target.value})}
                        placeholder="CC / Cédula"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        placeholder="300 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cargo *</Label>
                      <Select 
                        value={newEmployee.position}
                        onValueChange={(v) => setNewEmployee({...newEmployee, position: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {POSITIONS.map((pos) => (
                            <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Select 
                        value={newEmployee.department}
                        onValueChange={(v) => setNewEmployee({...newEmployee, department: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dep) => (
                            <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Ingreso *</Label>
                      <Input
                        type="date"
                        value={newEmployee.hire_date}
                        onChange={(e) => setNewEmployee({...newEmployee, hire_date: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Salario Base (COP) *</Label>
                      <Input
                        type="number"
                        value={newEmployee.base_salary}
                        onChange={(e) => setNewEmployee({...newEmployee, base_salary: e.target.value})}
                        placeholder="1.300.000"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddEmployee} 
                    className="w-full"
                    disabled={!newEmployee.full_name || !newEmployee.position || !newEmployee.base_salary || createEmployee.isPending}
                  >
                    Registrar Empleado
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isGeneratePayrollOpen} onOpenChange={setIsGeneratePayrollOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar Nómina
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Generar Nómina</DialogTitle>
                  <DialogDescription>
                    Calcula y registra el pago para un empleado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Empleado *</Label>
                    <Select 
                      value={payrollForm.employee_id}
                      onValueChange={(v) => setPayrollForm({...payrollForm, employee_id: v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(e => e.is_active).map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.full_name} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Inicio Período *</Label>
                      <Input
                        type="date"
                        value={payrollForm.period_start}
                        onChange={(e) => setPayrollForm({...payrollForm, period_start: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Fin Período *</Label>
                      <Input
                        type="date"
                        value={payrollForm.period_end}
                        onChange={(e) => setPayrollForm({...payrollForm, period_end: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Horas Extra</Label>
                      <Input
                        type="number"
                        value={payrollForm.overtime_hours}
                        onChange={(e) => setPayrollForm({...payrollForm, overtime_hours: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bonificaciones</Label>
                      <Input
                        type="number"
                        value={payrollForm.bonuses}
                        onChange={(e) => setPayrollForm({...payrollForm, bonuses: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Deducciones Adicionales</Label>
                      <Input
                        type="number"
                        value={payrollForm.deductions}
                        onChange={(e) => setPayrollForm({...payrollForm, deductions: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleGeneratePayroll} 
                    className="w-full"
                    disabled={!payrollForm.employee_id || !payrollForm.period_start || !payrollForm.period_end || createPayrollRecord.isPending}
                  >
                    Calcular y Guardar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="employees">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Fecha Ingreso</TableHead>
                    <TableHead className="text-right">Salario Base</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.position}</TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>
                        {format(new Date(employee.hire_date), 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(employee.base_salary))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={employee.is_active ? 'default' : 'secondary'}>
                          {employee.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No hay empleados registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empleado</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Bruto</TableHead>
                    <TableHead className="text-right">Deducciones</TableHead>
                    <TableHead className="text-right">Neto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.employees?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.period_start), 'd MMM', { locale: es })} - 
                        {format(new Date(record.period_end), 'd MMM yyyy', { locale: es })}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(Number(record.gross_pay))}
                      </TableCell>
                      <TableCell className="text-right text-red-500">
                        -{formatCurrency(Number(record.health_insurance) + Number(record.pension_contribution) + Number(record.deductions))}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCurrency(Number(record.net_pay))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(record.status)}>
                          {record.status === 'paid' && 'Pagado'}
                          {record.status === 'approved' && 'Aprobado'}
                          {record.status === 'pending' && 'Pendiente'}
                          {record.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updatePayrollStatus.mutate({ 
                              id: record.id, 
                              status: 'paid',
                              paymentDate: format(new Date(), 'yyyy-MM-dd')
                            })}
                          >
                            Marcar Pagado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {payrollRecords.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay registros de nómina
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
