import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

interface SpendingChartProps {
  data: {
    month: string;
    income: number;
    expenses: number;
  }[];
  className?: string;
}

export function SpendingChart({ data, className }: SpendingChartProps) {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="text-lg">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" tickFormatter={(value) => `Rs. ${value.toLocaleString()}`} />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Month
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {label}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {entry.name}
                              </span>
                              <span className="font-bold" style={{ color: entry.fill }}>
                                Rs. {entry.value?.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} animationDuration={1000} />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} animationDuration={1000} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Screen Reader Only Table for Accessibility */}
        <div className="sr-only">
          <h3>Income vs Expenses Data</h3>
          <table>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Income</th>
                <th scope="col">Expenses</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  <td>{row.month}</td>
                  <td>{row.income}</td>
                  <td>{row.expenses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
