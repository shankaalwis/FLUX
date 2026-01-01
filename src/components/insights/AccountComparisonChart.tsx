
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AccountComparisonChartProps {
    data: {
        accountName: string;
        income: number;
        expenses: number;
    }[];
}

export function AccountComparisonChart({ data }: AccountComparisonChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Spending by Account</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis dataKey="accountName" className="text-xs" />
                            <YAxis className="text-xs" tickFormatter={(value) => `Rs. ${value.toLocaleString()}`} />
                            <Tooltip
                                formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, '']}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend iconType="circle" />
                            <Bar dataKey="income" fill="#22c55e" name="Income" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
