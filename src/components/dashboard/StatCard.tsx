
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CountUp } from '@/components/ui/count-up';

interface StatCardProps {
  title: string;
  value: string;
  rawValue?: number; // Enable animation if provided
  prefix?: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, rawValue, prefix = "", subtitle, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold">
              {rawValue !== undefined ? (
                <CountUp
                  end={rawValue}
                  decimals={2}
                  prefix={prefix}
                  duration={1500}
                />
              ) : (
                value
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                "text-xs font-medium flex items-center gap-1",
                trend.positive ? "text-emerald-500" : "text-rose-500"
              )}>
                <span>{trend.positive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}% from last month</span>
              </p>
            )}
          </div>
          <div className="p-2 rounded-xl bg-background border shadow-sm">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
