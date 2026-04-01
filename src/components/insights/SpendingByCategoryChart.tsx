import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface CategorySpendingItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface SpendingByCategoryChartProps {
  data: CategorySpendingItem[];
  accountName?: string;
  className?: string;
}

const CATEGORY_COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload as CategorySpendingItem;
    return (
      <div className="rounded-lg border bg-card shadow-lg p-3 text-sm">
        <p className="font-semibold mb-1">{label}</p>
        <p className="text-muted-foreground">
          Amount:{' '}
          <span className="font-bold text-foreground">
            Rs. {d.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </p>
        <p className="text-muted-foreground">
          Transactions: <span className="font-bold text-foreground">{d.count}</span>
        </p>
        <p className="text-muted-foreground">
          Share:{' '}
          <span className="font-bold text-foreground">{d.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function SpendingByCategoryChart({
  data,
  accountName,
  className,
}: SpendingByCategoryChartProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Spending by Category</CardTitle>
        <CardDescription>
          {accountName ? `Breakdown for ${accountName}` : 'Across all accounts · debit transactions only'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 ? (
          <div className="flex h-[340px] items-center justify-center text-sm text-muted-foreground">
            No spending data available
          </div>
        ) : (
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                  className="text-xs fill-muted-foreground"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                <Bar dataKey="amount" name="Spent" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  {data.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary table below chart */}
        {data.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {data.slice(0, 5).map((item, i) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                />
                <span className="flex-1 truncate text-muted-foreground">{item.name}</span>
                <span className="font-medium tabular-nums">
                  Rs. {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="w-10 text-right text-muted-foreground">
                  {item.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
