import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users } from 'lucide-react';
import { PedigreeNode } from '@/hooks/useGenetics';

interface PedigreeTreeProps {
  pedigree: PedigreeNode | null;
  depth?: number;
}

const PedigreeNodeCard = ({ node, level }: { node: PedigreeNode; level: number }) => {
  const bgColor = node.sex === 'hembra' ? 'bg-pink-50 border-pink-200' : 'bg-blue-50 border-blue-200';
  const iconColor = node.sex === 'hembra' ? 'text-pink-500' : 'text-blue-500';

  return (
    <div className={`p-3 rounded-lg border-2 ${bgColor} min-w-[140px]`}>
      <div className="flex items-center gap-2 mb-1">
        <User className={`h-4 w-4 ${iconColor}`} />
        <span className="font-semibold text-sm">{node.tag_id}</span>
      </div>
      {node.name && (
        <p className="text-xs text-muted-foreground">{node.name}</p>
      )}
      {node.breed && (
        <Badge variant="outline" className="text-xs mt-1">{node.breed}</Badge>
      )}
      {node.geneticValue !== undefined && (
        <div className="mt-2">
          <span className="text-xs text-muted-foreground">VG: </span>
          <span className="text-xs font-semibold text-primary">{node.geneticValue}</span>
        </div>
      )}
    </div>
  );
};

const TreeLevel = ({ nodes, level }: { nodes: (PedigreeNode | undefined)[]; level: number }) => {
  return (
    <div className="flex justify-center gap-4">
      {nodes.map((node, index) => (
        <div key={index} className="flex flex-col items-center">
          {node ? (
            <PedigreeNodeCard node={node} level={level} />
          ) : (
            <div className="p-3 rounded-lg border-2 border-dashed border-muted min-w-[140px] flex items-center justify-center">
              <span className="text-xs text-muted-foreground">Desconocido</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const PedigreeTree = ({ pedigree, depth = 3 }: PedigreeTreeProps) => {
  if (!pedigree) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Selecciona un animal para ver su pedigrí</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Construir niveles del árbol
  const level0 = [pedigree];
  const level1 = [pedigree.mother, pedigree.father];
  const level2 = [
    pedigree.mother?.mother,
    pedigree.mother?.father,
    pedigree.father?.mother,
    pedigree.father?.father,
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Árbol Genealógico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 overflow-x-auto pb-4">
          {/* Animal principal */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Animal</p>
            <TreeLevel nodes={level0} level={0} />
          </div>

          {/* Conectores */}
          <div className="flex justify-center">
            <div className="w-px h-6 bg-border" />
          </div>

          {/* Padres */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Padres</p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-xs text-pink-500 mb-1">Madre</p>
                <TreeLevel nodes={[level1[0]]} level={1} />
              </div>
              <div className="text-center">
                <p className="text-xs text-blue-500 mb-1">Padre</p>
                <TreeLevel nodes={[level1[1]]} level={1} />
              </div>
            </div>
          </div>

          {/* Conectores */}
          <div className="flex justify-center gap-32">
            <div className="w-px h-6 bg-border" />
            <div className="w-px h-6 bg-border" />
          </div>

          {/* Abuelos */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Abuelos</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Abuela M.</p>
                <TreeLevel nodes={[level2[0]]} level={2} />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Abuelo M.</p>
                <TreeLevel nodes={[level2[1]]} level={2} />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Abuela P.</p>
                <TreeLevel nodes={[level2[2]]} level={2} />
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Abuelo P.</p>
                <TreeLevel nodes={[level2[3]]} level={2} />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
