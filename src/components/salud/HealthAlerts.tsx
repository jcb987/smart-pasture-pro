import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, Info, Activity } from 'lucide-react';

interface HealthAlert {
  type: 'warning' | 'danger' | 'info';
  message: string;
  count: number;
}

interface DiagnosisStat {
  diagnosis: string;
  count: number;
  percentage: number;
}

interface HealthAlertsProps {
  alerts: HealthAlert[];
}

export const HealthAlerts = ({ alerts }: HealthAlertsProps) => {
  if (alerts.length === 0) return null;

  const getAlertIcon = (type: HealthAlert['type']) => {
    switch (type) {
      case 'danger':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertVariant = (type: HealthAlert['type']): 'default' | 'destructive' => {
    return type === 'danger' ? 'destructive' : 'default';
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <Alert key={index} variant={getAlertVariant(alert.type)}>
          {getAlertIcon(alert.type)}
          <AlertTitle className="ml-2">{alert.count} {alert.message}</AlertTitle>
          <AlertDescription className="ml-6">
            Requiere atención
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

interface DiagnosisStatsCardProps {
  stats: DiagnosisStat[];
}

export const DiagnosisStatsCard = ({ stats }: DiagnosisStatsCardProps) => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-green-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Estadísticas de Diagnósticos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin datos de diagnósticos
          </p>
        ) : (
          <div className="space-y-3">
            {stats.slice(0, 7).map((stat, index) => (
              <div key={stat.diagnosis} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{stat.diagnosis}</span>
                  <span className="text-muted-foreground">{stat.count} casos ({stat.percentage.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${colors[index % colors.length]} transition-all`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
