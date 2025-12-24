import { useState } from "react";
import { X, DollarSign, Tag, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Expense } from "./Dashboard";

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  categories: string[];
}

export const ExpenseForm = ({ isOpen, onClose, onSubmit, categories }: ExpenseFormProps) => {
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    type: "expense" as "expense" | "income"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      return;
    }

    onSubmit({
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description,
      date: formData.date,
      type: formData.type,
      expenseType: 'personal'
    });

    // Reset form
    setFormData({
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      type: "expense"
    });
  };

  const handleClose = () => {
    onClose();
    // Reset form when closing
    setFormData({
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      type: "expense"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign size={20} className="text-primary" />
            <span>Add Transaction</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="expense" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="expense"
              onClick={() => setFormData(prev => ({ ...prev, type: "expense" }))}
              className="text-sm"
            >
              Expense
            </TabsTrigger>
            <TabsTrigger
              value="income"
              onClick={() => setFormData(prev => ({ ...prev, type: "income" }))}
              className="text-sm"
            >
              Income
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center space-x-1">
                  <DollarSign size={16} />
                  <span>Amount</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="flex items-center space-x-1">
                  <Tag size={16} />
                  <span>Category</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center space-x-1">
                  <FileText size={16} />
                  <span>Description (Optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add a note about this expense..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Date</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-expense to-red-500 hover:opacity-90"
                >
                  Add Expense
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="income" className="mt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="income-amount" className="flex items-center space-x-1">
                  <DollarSign size={16} />
                  <span>Amount</span>
                </Label>
                <Input
                  id="income-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-category" className="flex items-center space-x-1">
                  <Tag size={16} />
                  <span>Source</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select income source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Salary">Salary</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Gift">Gift</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-description" className="flex items-center space-x-1">
                  <FileText size={16} />
                  <span>Description (Optional)</span>
                </Label>
                <Textarea
                  id="income-description"
                  placeholder="Add a note about this income..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="income-date" className="flex items-center space-x-1">
                  <Calendar size={16} />
                  <span>Date</span>
                </Label>
                <Input
                  id="income-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-success to-green-500 hover:opacity-90"
                >
                  Add Income
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};