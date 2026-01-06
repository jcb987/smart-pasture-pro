import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ReportData } from '@/hooks/useReports';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { FileSpreadsheet, FileText, Printer, X } from 'lucide-react';

interface ReportViewerProps {
  reportData: ReportData;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onClose: () => void;
}

const CHART_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export const ReportViewer = ({ reportData, onExportExcel, onExportPDF, onClose }: ReportViewerProps) => {
  const showBarChart = reportData.chartData && reportData.chartData.length > 5;
  const showPieChart = reportData.chartData && reportData.chartData.length <= 5 && reportData.chartData.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{reportData.title}</CardTitle>
              <CardDescription>{reportData.subtitle}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button variant="outline" size="sm" onClick={onExportPDF}>
                <FileText className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">{key}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {(showBarChart || showPieChart) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gráfica</CardTitle>
          </CardHeader>
          <CardContent>
            {showBarChart && (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" tick={{ fontSize: 10 }} />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            {showPieChart && (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width={300} height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ label, percent }) => `${label}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {reportData.chartData?.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Detalle de Datos</CardTitle>
            <Badge variant="outline">{reportData.rows.length} registros</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {reportData.rows.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos para mostrar con los filtros seleccionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {reportData.headers.map((header, i) => (
                      <TableHead key={i} className="whitespace-nowrap">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.rows.slice(0, 100).map((row, i) => (
                    <TableRow key={i}>
                      {row.map((cell, j) => (
                        <TableCell key={j} className="whitespace-nowrap">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportData.rows.length > 100 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Mostrando 100 de {reportData.rows.length} registros. Exporta para ver todos.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
