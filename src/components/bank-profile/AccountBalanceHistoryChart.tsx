
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AccountBalanceHistoryChartProps {
    data: {
        date: string;
        balance: number;
        income: number;
        expenses: number;
    }[];
}

export function AccountBalanceHistoryChart({ data }: AccountBalanceHistoryChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Account History</CardTitle>
                <CardDescription>Balance, Income, and Expenses over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                            <XAxis
                                dataKey="date"
                                className="text-xs"
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                className="text-xs"
                                tickFormatter={(value) => `Rs. ${value.toLocaleString()}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend iconType="circle" />
                            <Line type="monotone" dataKey="income" name="Income" stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                            <Line type="monotone" dataKey="balance" name="Balance" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
