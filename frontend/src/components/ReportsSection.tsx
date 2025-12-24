import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Target, ArrowUpRight } from 'lucide-react';
import type { Expense } from "./Dashboard";
import { formatCurrency } from "@/lib/utils";

interface ReportsSectionProps {
  expenses: Expense[];
}

export const ReportsSection = ({ expenses }: ReportsSectionProps) => {
  // Daily data calculation
  const getDailyData = () => {
    const dailyData: Record<string, { expenses: number; income: number; net: number; date: string }> = {};
    
    expenses.forEach(expense => {
      const dateKey = expense.date;
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = { expenses: 0, income: 0, net: 0, date: dateKey };
      }
      
      if (expense.type === 'expense') {
        dailyData[dateKey].expenses += expense.amount;
      } else {
        dailyData[dateKey].income += expense.amount;
      }
      dailyData[dateKey].net = dailyData[dateKey].income - dailyData[dateKey].expenses;
    });

    return Object.values(dailyData)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7) // Last 7 days
      .map(item => ({
        ...item,
        day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' })
      }));
  };

  // Weekly data calculation
  const getWeeklyData = () => {
    const weeklyData: Record<string, { expenses: number; income: number; net: number; week: string }> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { 
          expenses: 0, 
          income: 0, 
          net: 0, 
          week: `Week ${Math.ceil(date.getDate() / 7)}` 
        };
      }
      
      if (expense.type === 'expense') {
        weeklyData[weekKey].expenses += expense.amount;
      } else {
        weeklyData[weekKey].income += expense.amount;
      }
      weeklyData[weekKey].net = weeklyData[weekKey].income - weeklyData[weekKey].expenses;
    });

    return Object.values(weeklyData)
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-4); // Last 4 weeks
  };

  // Monthly data calculation
  const getMonthlyData = () => {
    const monthlyData: Record<string, { expenses: number; income: number; net: number; month: string }> = {};
    
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          expenses: 0, 
          income: 0, 
          net: 0, 
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      }
      
      if (expense.type === 'expense') {
        monthlyData[monthKey].expenses += expense.amount;
      } else {
        monthlyData[monthKey].income += expense.amount;
      }
      monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  };

  // Category data for pie charts
  const getCategoryData = () => {
    const categoryData: Record<string, number> = {};
    
    expenses
      .filter(expense => expense.type === 'expense')
      .forEach(expense => {
        categoryData[expense.category] = (categoryData[expense.category] || 0) + expense.amount;
      });

    return Object.entries(categoryData).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    }));
  };

  const dailyData = getDailyData();
  const weeklyData = getWeeklyData();
  const monthlyData = getMonthlyData();
  const categoryData = getCategoryData();

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--success))',
    'hsl(var(--expense))',
    'hsl(217 91% 70%)',
    'hsl(280 100% 70%)',
    'hsl(25 95% 65%)',
    'hsl(195 100% 65%)',
    'hsl(120 100% 65%)',
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl">
          <p className="font-semibold text-card-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">{entry.name}:</span>
              <span 
                className="font-medium" 
                style={{ color: entry.color }}
              >
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderPieChart = (data: any[], title: string, icon: React.ReactNode) => (
    <Card className="dashboard-card group hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
          <ArrowUpRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {data.slice(0, 3).map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium truncate">{entry.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {formatCurrency(entry.value)}
                  </Badge>
                </div>
              ))}
              {data.length > 3 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{data.length - 3} more categories
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <PieChartIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAreaChart = (data: any[], title: string, icon: React.ReactNode) => (
    <Card className="dashboard-card group hover-lift">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
          <ArrowUpRight className="h-4 w-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--expense))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--expense))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey={title.includes('Daily') ? 'day' : title.includes('Weekly') ? 'week' : 'month'}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="income" 
                  stackId="1"
                  stroke="hsl(var(--success))" 
                  fillOpacity={1} 
                  fill="url(#colorIncome)"
                  strokeWidth={2}
                  name="Income"
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stackId="2"
                  stroke="hsl(var(--expense))" 
                  fillOpacity={1} 
                  fill="url(#colorExpenses)"
                  strokeWidth={2}
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (expenses.length === 0) {
    return (
      <Card className="dashboard-card text-center py-12">
        <div className="text-muted-foreground">
          <BarChart3 className="mx-auto mb-4 opacity-50" size={48} />
          <h3 className="text-xl font-semibold mb-2">No Reports Available</h3>
          <p className="text-sm">Add some transactions to see your detailed reports and insights.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gradient-primary flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Financial Reports
          </h2>
          <p className="text-muted-foreground">Comprehensive analysis of your spending patterns</p>
        </div>
        <Badge className="bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2">
          Live Data
        </Badge>
      </div>

      {/* Tabbed Reports */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/30 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Overview
          </TabsTrigger>
          <TabsTrigger value="daily" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Monthly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderPieChart(categoryData, "Expense Categories", <PieChartIcon className="h-5 w-5 text-primary" />)}
            {renderAreaChart(monthlyData, "Monthly Overview", <Calendar className="h-5 w-5 text-primary" />)}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {renderAreaChart(dailyData, "Daily Trends (Last 7 Days)", <Calendar className="h-5 w-5 text-primary" />)}
          </div>
        </TabsContent>

        <TabsContent value="weekly" className="mt-6">
          <div className="grid grid-cols-1 gap-6">
            {renderAreaChart(weeklyData, "Weekly Analysis (Last 4 Weeks)", <TrendingUp className="h-5 w-5 text-primary" />)}
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderAreaChart(monthlyData, "Monthly Performance", <Target className="h-5 w-5 text-primary" />)}
            {renderPieChart(categoryData, "Monthly Categories", <PieChartIcon className="h-5 w-5 text-primary" />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};