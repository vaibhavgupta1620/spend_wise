import { useState, useEffect } from 'react';

export const usePendingApprovals = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchPendingCount = async () => {
    try {
      const stored = localStorage.getItem('groupExpenses');
      const expenses = stored ? JSON.parse(stored) : [];
      const pendingCount = expenses.filter((exp: any) => exp.status === 'pending').length;
      setCount(pendingCount);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      setCount(0);
    }
  };

  useEffect(() => {
    fetchPendingCount();
  }, []);

  return { count, loading, refresh: fetchPendingCount };
};