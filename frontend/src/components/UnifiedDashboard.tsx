import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  User,
  PieChart,
  Activity
} from "lucide-react";
import { useUnifiedExpenses } from "@/hooks/useUnifiedExpenses";
import { formatCurrency } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";

const COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export const UnifiedDashboard = () => {
  const { allExpenses, metrics } = useUnifiedExpenses();

  // Personal spending trend (last 7 days)
  const personalTrendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayExpenses = allExpenses.filter(
        exp => exp.date === date && exp.expenseType === 'personal' && exp.type === 'expense'
      );
      const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        amount: total
      };
    });
  }, [allExpenses]);

  // Group spending by trip
  const groupSpendingData = useMemo(() => {
    const groupedByTrip = allExpenses
      .filter(exp => exp.expenseType === 'group')
      .reduce((acc, exp) => {
        const tripName = exp.groupName || 'Unknown';
        acc[tripName] = (acc[tripName] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(groupedByTrip).map(([name, amount]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '...' : name,
      amount
    }));
  }, [allExpenses]);

  // Category distribution (combined)
  const categoryData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const categoryTotals = allExpenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return exp.type === 'expense' &&
               expDate.getMonth() === currentMonth &&
               expDate.getFullYear() === currentYear;
      })
      .reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allExpenses]);

  const isOverBudget = metrics.remainingBudget < 0;

  return (
    <div className="space-y-6">
      {/* Budget Alert */}
      {isOverBudget && (
        <Alert variant="destructive" className="animate-fade-in">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget Exceeded!</AlertTitle>
          <AlertDescription>
            You've exceeded your monthly budget by {formatCurrency(Math.abs(metrics.remainingBudget))}. Consider reviewing your expenses.
          </AlertDescription>
        </Alert>
      )}

      {/* Unified Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-expense">{formatCurrency(metrics.totalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </div>
              <div className="p-3 bg-expense/10 rounded-full">
                <TrendingDown className="h-6 w-6 text-expense" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personal</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(metrics.personalSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">Individual expenses</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Group</p>
                <p className="text-2xl font-bold text-accent">{formatCurrency(metrics.groupSpent)}</p>
                <p className="text-xs text-muted-foreground mt-1">Trip expenses</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <Users className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-card hover-lift">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Budget</p>
                <p className={`text-2xl font-bold ${metrics.remainingBudget >= 0 ? 'text-success' : 'text-expense'}`}>
                  {formatCurrency(Math.abs(metrics.remainingBudget))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.remainingBudget >= 0 ? 'Left to spend' : 'Over budget'}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Spending Trend */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Personal Spending Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={personalTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Spent']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Group Spending Overview */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Group Spending by Trip
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupSpendingData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No group expenses yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={groupSpendingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Spent']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Combined Category Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              <p>No expenses this month</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ₹${entry.value.toFixed(0)}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`₹${value.toFixed(0)}`, 'Spent']}
                  />
                </RechartsPie>
              </ResponsiveContainer>

              <div className="flex flex-col justify-center space-y-3">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
