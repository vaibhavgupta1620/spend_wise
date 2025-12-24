import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Download } from "lucide-react";
import { UnifiedExpenseForm } from "@/components/UnifiedExpenseForm";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { useUnifiedExpenses } from "@/hooks/useUnifiedExpenses";
import { ExpenseList } from "@/components/ExpenseList";
import { useToast } from "@/hooks/use-toast";
import { useExpenses } from "@/hooks/useExpenses";

const categories = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Entertainment",
  "Health & Fitness",
  "Travel",
  "Other"
];

export const UnifiedExpenses = () => {
  const {
    allExpenses,
    personalExpenses,
    groupExpenses,
    metrics,
    loading,
    addExpense
  } = useUnifiedExpenses();
  const { deleteExpense } = useExpenses();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'group'>('all');
  const { toast } = useToast();

  const handleAddExpense = (expense: any) => {
    addExpense(expense);
    setIsFormOpen(false);
    toast({
      title: "Expense Added",
      description: `${expense.expenseType === 'personal' ? 'Personal' : 'Group'} expense added successfully`,
    });
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Amount', 'Description', 'Paid By', 'Group'].join(','),
      ...allExpenses.map(exp => [
        exp.date,
        exp.expenseType,
        exp.category,
        exp.amount,
        exp.description,
        exp.paidBy || '-',
        exp.groupName || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Export Complete",
      description: "Your expenses have been exported to CSV",
    });
  };

  const getFilteredExpenses = () => {
    switch (activeTab) {
      case 'personal':
        return personalExpenses;
      case 'group':
        return groupExpenses;
      default:
        return allExpenses;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4  mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Expenses</h1>
          <p className="text-muted-foreground">Unified view of personal and group expenses</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div></div><div></div>
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="hover:bg-muted"
          >
            <Download size={20} className="mr-2" />
            Export CSV
          </Button>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="bg-primary hover:bg-primary-hover"
          >
            <Plus size={20} className="mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Unified Dashboard with Charts */}
      <div className="mb-6">
        <UnifiedDashboard />
      </div>

      {/* Expense Tabs */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                All Expenses
                <Badge variant="secondary" className="ml-2">{allExpenses.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="personal">
                Personal
                <Badge variant="secondary" className="ml-2">{personalExpenses.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="group">
                Group
                <Badge variant="secondary" className="ml-2">{groupExpenses.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {allExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No transactions yet — start tracking your expenses or create your first group.</p>
                  <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary-hover">
                    <Plus size={20} className="mr-2" />
                    Add First Expense
                  </Button>
                </div>
              ) : (
                <ExpenseList expenses={allExpenses} onDelete={deleteExpense} showAll />
              )}
            </TabsContent>

            <TabsContent value="personal">
              {personalExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No personal expenses yet.</p>
                  <Button onClick={() => setIsFormOpen(true)}>Add Personal Expense</Button>
                </div>
              ) : (
                <ExpenseList expenses={personalExpenses} onDelete={deleteExpense} showAll />
              )}
            </TabsContent>

            <TabsContent value="group">
              {groupExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No group expenses yet.</p>
                  <Button onClick={() => setIsFormOpen(true)}>Add Group Expense</Button>
                </div>
              ) : (
                <ExpenseList expenses={groupExpenses} onDelete={deleteExpense} showAll />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <UnifiedExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleAddExpense}
        categories={categories}
      />
    </div>
  );
};
