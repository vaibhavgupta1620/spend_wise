import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget: number;
  total_spent: number;
  currency: string;
  status: string;
  created_by: string;
  created_at: string;
  member_count?: number;
  user_role?: string;
  members?: string[];
}

export const useTrips = () => {
  const [trips, setTrips] = useState<Trip[]>(() => {
    const stored = localStorage.getItem('trips');
    return stored ? JSON.parse(stored) : [];
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  const fetchTrips = async () => {
    setLoading(true);
    // Simulate async operation
    setTimeout(() => {
      const stored = localStorage.getItem('trips');
      setTrips(stored ? JSON.parse(stored) : []);
      setLoading(false);
    }, 100);
  };

  const createTrip = async (tripData: any) => {
    try {
      const newTrip: Trip = {
        ...tripData,
        id: Date.now().toString(),
        created_by: 'current-user',
        created_at: new Date().toISOString(),
        total_spent: 0,
        status: 'active',
        member_count: (tripData.members?.length || 0) + 1,
        user_role: 'admin'
      };

      setTrips(prev => [newTrip, ...prev]);

      toast({
        title: "Trip Created",
        description: `${tripData.name} has been created successfully`,
      });

      return newTrip;
    } catch (error) {
      console.error('Error creating trip:', error);
      toast({
        title: "Error",
        description: "Failed to create trip",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateTrip = async (tripId: string, updates: Partial<Trip>) => {
    try {
      setTrips(prev => prev.map(trip =>
        trip.id === tripId ? { ...trip, ...updates } : trip
      ));

      toast({
        title: "Trip Updated",
        description: "Trip details have been updated",
      });
    } catch (error) {
      console.error('Error updating trip:', error);
      toast({
        title: "Error",
        description: "Failed to update trip",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteTrip = async (tripId: string) => {
    try {
      setTrips(prev => prev.map(trip =>
        trip.id === tripId ? { ...trip, status: 'cancelled' } : trip
      ).filter(trip => trip.status !== 'cancelled'));

      toast({
        title: "Trip Deleted",
        description: "Trip has been removed",
      });
    } catch (error) {
      console.error('Error deleting trip:', error);
      toast({
        title: "Error",
        description: "Failed to delete trip",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  return {
    trips,
    loading,
    fetchTrips,
    createTrip,
    updateTrip,
    deleteTrip
  };
};
