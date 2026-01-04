import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface CategoryPieChartProps {
  data: {
    name: string;
    value: number;
    color: string;
  }[];
  className?: string;
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

import { useNavigate } from 'react-router-dom';

export function CategoryPieChart({ data, className }: CategoryPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <Card className={cn(className)}>
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
                isAnimationActive={true}
                onClick={(data) => {
                  if (data && data.name) {
                    navigate(`/transactions?category=${encodeURIComponent(data.name)}`);
                  }
                }}
                className="cursor-pointer outline-none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend
                layout={isMobile ? 'horizontal' : 'vertical'}
                verticalAlign={isMobile ? 'bottom' : 'middle'}
                align={isMobile ? 'center' : 'right'}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value, entry) => {
                  const item = data.find(d => d.name === value);
                  const percentage = item ? ((item.value / total) * 100).toFixed(1) : 0;
                  return `${value} (${percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Screen Reader Only Table */}
        <div className="sr-only">
          <h3>Spending by Category Data</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Amount</th>
                <th scope="col">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.name}</td>
                  <td>{row.value}</td>
                  <td>{((row.value / total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
