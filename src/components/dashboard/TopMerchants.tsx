import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface TopMerchantsProps {
  data: {
    merchant: string;
    amount: number;
    count: number;
  }[];
}

export function TopMerchants({ data }: TopMerchantsProps) {
  const maxAmount = Math.max(...data.map(d => d.amount));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Merchants</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transaction data available
          </p>
        ) : (
          data.map((item, index) => (
            <div key={item.merchant} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate flex-1">{item.merchant}</span>
                <span className="text-muted-foreground ml-2">
                  ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Progress 
                value={(item.amount / maxAmount) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {item.count} transaction{item.count !== 1 ? 's' : ''}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
