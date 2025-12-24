import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, ArrowDownRight, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TripExpense {
  id: string;
  amount: number;
  paidBy: string;
  splitBetween: string[];
}

interface BalanceCalculatorProps {
  tripId: string;
  tripName: string;
  expenses: TripExpense[];
  members: string[];
}

interface MemberBalance {
  name: string;
  paid: number;
  owes: number;
  balance: number;
}

export const BalanceCalculator = ({ tripId, tripName, expenses, members }: BalanceCalculatorProps) => {
  const balances = useMemo((): MemberBalance[] => {
    if (!expenses.length || !members.length) return [];

    // Calculate total amount and shares
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const sharePerPerson = totalExpenses / members.length;

    // Calculate how much each person paid and owes
    const memberBalances = members.map(member => {
      const paid = expenses
        .filter(exp => exp.paidBy === member)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      const owes = sharePerPerson;
      const balance = paid - owes;

      return {
        name: member,
        paid,
        owes,
        balance
      };
    });

    return memberBalances.sort((a, b) => b.balance - a.balance);
  }, [expenses, members]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (balances.length === 0) {
    return null;
  }

  return (
    <Card className="dashboard-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Balance Summary - {tripName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {balances.map((member) => (
            <div 
              key={member.name}
              className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium">{member.name}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                    <span>Paid: {formatCurrency(member.paid)}</span>
                    <span>Share: {formatCurrency(member.owes)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                {member.balance > 0 ? (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <ArrowUpRight className="h-3 w-3 mr-1" />
                    Gets back {formatCurrency(member.balance)}
                  </Badge>
                ) : member.balance < 0 ? (
                  <Badge variant="outline" className="bg-expense/10 text-expense border-expense/20">
                    <ArrowDownRight className="h-3 w-3 mr-1" />
                    Owes {formatCurrency(Math.abs(member.balance))}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    Settled
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Trip Expenses</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-muted-foreground">Share per person</span>
            <span className="text-sm font-semibold">
              {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0) / members.length)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
