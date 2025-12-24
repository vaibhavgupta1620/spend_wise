import { useState, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clock, Plane, FileText, Calendar, DollarSign } from 'lucide-react';

export interface Task {
  id: string;
  icon: string;
  label: string;
  count: number | string;
  color: string;
  completed: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  clock: Clock,
  plane: Plane,
  fileText: FileText,
  calendar: Calendar,
  dollarSign: DollarSign,
};

export const getIconComponent = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || Clock;
};

const DEFAULT_TASKS: Task[] = [
  { id: '1', icon: 'clock', label: 'Pending Approvals', count: 0, color: 'text-purple-400', completed: false },
  { id: '2', icon: 'plane', label: 'New Trips Registered', count: 0, color: 'text-blue-400', completed: false },
  { id: '3', icon: 'fileText', label: 'Unreported Expenses', count: 0, color: 'text-orange-400', completed: false },
  { id: '4', icon: 'calendar', label: 'Upcoming Expenses', count: 0, color: 'text-green-400', completed: false },
  { id: '5', icon: 'dollarSign', label: 'Unreported Advances', count: '₹0.00', color: 'text-pink-400', completed: false },
];

export const usePendingTasks = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem('pendingTasks');
    return stored ? JSON.parse(stored) : DEFAULT_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('pendingTasks', JSON.stringify(tasks));
  }, [tasks]);

  const updateTaskCount = (id: string, count: number | string) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, count } : task
    ));
  };

  const toggleTaskCompleted = (id: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const addTask = (task: Omit<Task, 'id'>) => {
    const newTask = {
      ...task,
      id: Date.now().toString(),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return { tasks, updateTaskCount, toggleTaskCompleted, addTask, deleteTask };
};
