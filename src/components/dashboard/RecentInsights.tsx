import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AIInsight } from '@/types/database';
import { Lightbulb, TrendingUp, AlertTriangle, RefreshCw, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentInsightsProps {
  insights: AIInsight[];
}

const insightIcons = {
  monthly_summary: BarChart3,
  spending_spike: TrendingUp,
  category_change: RefreshCw,
  anomaly_alert: AlertTriangle,
  recurring_detected: RefreshCw,
  general: Lightbulb,
};

const insightColors = {
  monthly_summary: 'bg-primary/10 text-primary',
  spending_spike: 'bg-chart-3/10 text-chart-3',
  category_change: 'bg-chart-2/10 text-chart-2',
  anomaly_alert: 'bg-destructive/10 text-destructive',
  recurring_detected: 'bg-chart-4/10 text-chart-4',
  general: 'bg-primary/10 text-primary',
};

export function RecentInsights({ insights }: RecentInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Recent Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No insights yet. Upload some statements to get started!</p>
          </div>
        ) : (
          insights.slice(0, 5).map((insight) => {
            const Icon = insightIcons[insight.insight_type];
            const colorClass = insightColors[insight.insight_type];
            
            return (
              <div key={insight.id} className="flex gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-sm truncate">{insight.title}</p>
                    {!insight.is_read && (
                      <Badge variant="secondary" className="text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
