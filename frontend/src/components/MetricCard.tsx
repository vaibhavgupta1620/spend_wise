import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn, formatCurrencyCompact } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: number;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  className?: string;
}

export const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend = "neutral", 
  subtitle,
  className 
}: MetricCardProps) => {
  const formatValue = (val: number) => {
    return formatCurrencyCompact(val);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp size={16} className="text-success" />;
      case "down":
        return <TrendingDown size={16} className="text-expense" />;
      default:
        return <Minus size={16} className="text-muted-foreground" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-success";
      case "down":
        return "text-expense";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className={cn("metric-card hover-lift animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          <div className="flex items-center space-x-2">
            <p className={cn("text-2xl font-bold", getTrendColor())}>
              {formatValue(value)}
            </p>
            {getTrendIcon()}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
      </div>
    </Card>
  );
};