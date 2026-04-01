import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

export interface AccountCategoryRow {
  category: string;
  [accountName: string]: string | number;
}

interface SpendingByAccountChartProps {
  data: AccountCategoryRow[];
  accountNames: string[];
  className?: string;
}

const ACCOUNT_COLORS = [
  '#6366f1',
  '#f97316',
  '#22c55e',
  '#ec4899',
  '#14b8a6',
  '#eab308',
  '#a855f7',
  '#3b82f6',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-card shadow-lg p-3 text-sm min-w-[160px]">
        <p className="font-semibold mb-2 text-foreground">{label}</p>
        {payload.map((p: any) => (
          <div key={p.name} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: p.fill }}
              />
              {p.name}
            </span>
            <span className="font-medium tabular-nums">
              Rs. {Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function SpendingByAccountChart({
  data,
  accountNames,
  className,
}: SpendingByAccountChartProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Spending by Account per Category</CardTitle>
        <CardDescription>
          Compare how each account spends across categories
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {data.length === 0 || accountNames.length === 0 ? (
          <div className="flex h-[380px] items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        ) : (
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 8, right: 16, left: 8, bottom: 60 }}
                barCategoryGap="25%"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  angle={-35}
                  textAnchor="end"
                  height={70}
                  interval={0}
                />
                <YAxis
                  tickFormatter={(v) => `Rs. ${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  iconType="circle"
                />
                {accountNames.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    name={name}
                    fill={ACCOUNT_COLORS[i % ACCOUNT_COLORS.length]}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                    animationDuration={800}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
