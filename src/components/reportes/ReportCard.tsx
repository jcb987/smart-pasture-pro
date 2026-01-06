import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReportConfig } from '@/hooks/useReports';
import { Milk, Beef, Baby, HeartPulse, ClipboardList, DollarSign, Wheat } from 'lucide-react';

interface ReportCardProps {
  config: ReportConfig;
  onSelect: (reportType: ReportConfig['id']) => void;
}

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    milk: <Milk className="h-8 w-8" />,
    beef: <Beef className="h-8 w-8" />,
    baby: <Baby className="h-8 w-8" />,
    'heart-pulse': <HeartPulse className="h-8 w-8" />,
    'clipboard-list': <ClipboardList className="h-8 w-8" />,
    'dollar-sign': <DollarSign className="h-8 w-8" />,
    wheat: <Wheat className="h-8 w-8" />,
  };
  return icons[iconName] || <ClipboardList className="h-8 w-8" />;
};

const getCategoryColor = (category: ReportConfig['category']) => {
  const colors: Record<string, string> = {
    produccion: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    reproduccion: 'text-pink-600 bg-pink-50 dark:bg-pink-950/30',
    salud: 'text-green-600 bg-green-50 dark:bg-green-950/30',
    economico: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  };
  return colors[category] || 'text-gray-600 bg-gray-50';
};

export const ReportCard = ({ config, onSelect }: ReportCardProps) => {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={() => onSelect(config.id)}
    >
      <CardHeader className="pb-2">
        <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-2 ${getCategoryColor(config.category)}`}>
          {getIcon(config.icon)}
        </div>
        <CardTitle className="text-lg">{config.name}</CardTitle>
        <CardDescription className="text-sm">{config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" size="sm" className="w-full">
          Generar Reporte
        </Button>
      </CardContent>
    </Card>
  );
};

interface ReportGridProps {
  configs: ReportConfig[];
  onSelect: (reportType: ReportConfig['id']) => void;
}

export const ReportGrid = ({ configs, onSelect }: ReportGridProps) => {
  const categories = ['produccion', 'reproduccion', 'salud', 'economico'] as const;
  const categoryLabels: Record<typeof categories[number], string> = {
    produccion: 'Producción',
    reproduccion: 'Reproducción',
    salud: 'Salud y Sanidad',
    economico: 'Económico',
  };

  return (
    <div className="space-y-8">
      {categories.map(category => {
        const categoryConfigs = configs.filter(c => c.category === category);
        if (categoryConfigs.length === 0) return null;

        return (
          <div key={category}>
            <h3 className="text-lg font-semibold mb-4">{categoryLabels[category]}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categoryConfigs.map(config => (
                <ReportCard key={config.id} config={config} onSelect={onSelect} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
