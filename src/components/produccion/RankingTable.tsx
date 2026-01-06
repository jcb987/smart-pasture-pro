import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';

interface RankingItem {
  position: number;
  tag_id: string;
  name: string | null;
  value: number;
  secondary?: number;
  unit: string;
  secondaryUnit?: string;
}

interface RankingTableProps {
  title: string;
  items: RankingItem[];
  valueLabel: string;
  secondaryLabel?: string;
}

export const RankingTable = ({ title, items, valueLabel, secondaryLabel }: RankingTableProps) => {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-muted-foreground">{position}</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Animal</TableHead>
              <TableHead className="text-right">{valueLabel}</TableHead>
              {secondaryLabel && <TableHead className="text-right">{secondaryLabel}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 10).map((item) => (
              <TableRow key={item.tag_id}>
                <TableCell className="font-medium">
                  {getPositionIcon(item.position)}
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{item.tag_id}</span>
                    {item.name && (
                      <span className="text-muted-foreground ml-1">({item.name})</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant={item.position <= 3 ? 'default' : 'secondary'}>
                    {item.value.toFixed(1)} {item.unit}
                  </Badge>
                </TableCell>
                {secondaryLabel && item.secondary !== undefined && (
                  <TableCell className="text-right text-muted-foreground">
                    {item.secondary.toFixed(1)} {item.secondaryUnit}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={secondaryLabel ? 4 : 3} className="text-center text-muted-foreground py-8">
                  No hay datos suficientes para el ranking
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
