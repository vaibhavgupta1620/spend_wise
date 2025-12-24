import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Trip {
  id: string;
  name: string;
  budget: number;
  total_spent: number;
  currency: string;
}

export const useBudgetAlerts = (trip: Trip | null) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!trip) return;

    // Check alert preferences from localStorage
    const alertSettings = localStorage.getItem('alertSettings');
    const settings = alertSettings ? JSON.parse(alertSettings) : { overspendingAlerts: true };

    if (!settings.overspendingAlerts) return;

    const percentage = (trip.total_spent / trip.budget) * 100;

    // Alert at 80%, 90%, and 100%
    if (percentage >= 100) {
      const overspent = trip.total_spent - trip.budget;
      toast({
        title: "Budget Exceeded!",
        description: `${trip.name} has exceeded budget by ${trip.currency} ${overspent.toFixed(2)}`,
        variant: "destructive",
      });
    } else if (percentage >= 90) {
      const remaining = trip.budget - trip.total_spent;
      toast({
        title: "Budget Warning",
        description: `${trip.name} has only ${trip.currency} ${remaining.toFixed(2)} remaining (${(100 - percentage).toFixed(0)}% left)`,
      });
    } else if (percentage >= 80) {
      toast({
        title: "Budget Notice",
        description: `${trip.name} has used ${percentage.toFixed(0)}% of the budget`,
      });
    }
  }, [trip?.total_spent, trip?.budget]);
};
