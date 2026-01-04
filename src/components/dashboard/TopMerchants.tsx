import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface TopMerchantsProps {
  data: {
    merchant: string;
    amount: number;
    count: number;
  }[];
  className?: string;
}

export function TopMerchants({ data, className }: TopMerchantsProps) {
  const maxAmount = Math.max(...data.map(d => d.amount));
  const navigate = useNavigate();

  return (
    <Card className={cn(className)}>
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
            <div
              key={item.merchant}
              className="space-y-2 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors group"
              onClick={() => navigate(`/transactions?search=${encodeURIComponent(item.merchant)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(`/transactions?search=${encodeURIComponent(item.merchant)}`);
                }
              }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate flex-1 group-hover:text-primary transition-colors">{item.merchant}</span>
                <span className="text-muted-foreground ml-2">
                  Rs. {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
