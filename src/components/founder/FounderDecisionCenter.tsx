import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Zap,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  Layers
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  urgency: 'immediate' | 'short-term' | 'long-term';
  metrics?: {
    label: string;
    value: string;
  }[];
  action?: string;
}

interface Decision {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: string;
  impact: string;
  votes?: { up: number; down: number };
}

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  requestedBy: number;
  priority: 'high' | 'medium' | 'low';
  status: 'requested' | 'planned' | 'in-progress' | 'completed';
  votes: number;
}

interface FounderDecisionCenterProps {
  insights: Insight[];
  decisions: Decision[];
  featureRequests: FeatureRequest[];
  loading?: boolean;
  onApproveDecision?: (id: string) => void;
  onRejectDecision?: (id: string) => void;
  onPrioritizeFeature?: (id: string, priority: 'high' | 'medium' | 'low') => void;
}

export function FounderDecisionCenter({
  insights,
  decisions,
  featureRequests,
  loading,
  onApproveDecision,
  onRejectDecision,
  onPrioritizeFeature,
}: FounderDecisionCenterProps) {
  const [activeTab, setActiveTab] = useState('insights');

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-emerald-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-amber-500" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> Pendiente</Badge>;
      case 'approved': return <Badge className="bg-emerald-500 gap-1"><CheckCircle2 className="h-3 w-3" /> Aprobado</Badge>;
      case 'rejected': return <Badge variant="destructive" className="gap-1">Rechazado</Badge>;
      case 'implemented': return <Badge className="bg-blue-500 gap-1"><Zap className="h-3 w-3" /> Implementado</Badge>;
      case 'requested': return <Badge variant="outline">Solicitado</Badge>;
      case 'planned': return <Badge className="bg-purple-500">Planificado</Badge>;
      case 'in-progress': return <Badge className="bg-amber-500">En Progreso</Badge>;
      case 'completed': return <Badge className="bg-emerald-500">Completado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-96 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-amber-500" />
          Centro de Decisiones
        </CardTitle>
        <CardDescription>
          Insights del producto, decisiones estratégicas y solicitudes de features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="insights" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Decisiones
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Layers className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* Insights Tab */}
          <TabsContent value="insights" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {insights.map((insight) => (
                  <Card key={insight.id} className="border-l-4" style={{ borderLeftColor: insight.type === 'opportunity' ? 'hsl(142.1, 76.2%, 36.3%)' : insight.type === 'risk' ? 'hsl(var(--destructive))' : 'hsl(47.9, 95.8%, 53.1%)' }}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {getTypeIcon(insight.type)}
                          <div className="flex-1">
                            <h4 className="font-semibold">{insight.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                            
                            {insight.metrics && (
                              <div className="flex gap-4 mt-3">
                                {insight.metrics.map((metric, i) => (
                                  <div key={i} className="text-center">
                                    <p className="text-lg font-bold">{metric.value}</p>
                                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {insight.action && (
                              <Button size="sm" className="mt-3 gap-1">
                                {insight.action}
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={getImpactColor(insight.impact)}>
                            Impacto {insight.impact === 'high' ? 'Alto' : insight.impact === 'medium' ? 'Medio' : 'Bajo'}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.urgency === 'immediate' ? 'Urgente' : insight.urgency === 'short-term' ? 'Corto plazo' : 'Largo plazo'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {insights.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay insights disponibles</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {decisions.map((decision) => (
                  <Card key={decision.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{decision.title}</h4>
                            {getStatusBadge(decision.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{decision.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Impacto esperado: {decision.impact}
                          </p>
                        </div>
                        {decision.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              onClick={() => onApproveDecision?.(decision.id)}
                            >
                              <ThumbsUp className="h-4 w-4" />
                              Aprobar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1 text-red-600 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => onRejectDecision?.(decision.id)}
                            >
                              <ThumbsDown className="h-4 w-4" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {decisions.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay decisiones pendientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-4">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {featureRequests.map((feature) => (
                  <Card key={feature.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{feature.title}</h4>
                            {getStatusBadge(feature.status)}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{feature.requestedBy} solicitudes</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                              <span>{feature.votes} votos</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge className={getImpactColor(feature.priority)}>
                            {feature.priority === 'high' ? 'Alta' : feature.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                          {feature.status === 'requested' && (
                            <div className="flex gap-1">
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => onPrioritizeFeature?.(feature.id, 'high')}
                              >
                                Priorizar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {featureRequests.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay solicitudes de features</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
