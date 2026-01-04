import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategoryPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
}

const COLORS = [
  '#22c55e', // Green
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#f97316', // Orange
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#14b8a6', // Teal
];

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isMobile = useIsMobile();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={isMobile ? "h-[350px]" : "h-[300px]"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={isMobile ? 80 : 100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend
                layout={isMobile ? 'horizontal' : 'vertical'}
                verticalAlign={isMobile ? 'bottom' : 'middle'}
                align={isMobile ? 'center' : 'right'}
                iconType="circle"
                formatter={(value, entry) => {
                  const item = data.find(d => d.name === value);
                  const percentage = item ? ((item.value / total) * 100).toFixed(1) : 0;
                  return `${value} (${percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
