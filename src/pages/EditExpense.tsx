import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  expense_date: string;
}

const EditExpense = () => {
  const { user, userProfile, loading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ExpenseFormData>({
    category: "",
    description: "",
    amount: "",
    expense_date: "",
  });
  const [loadingExpense, setLoadingExpense] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = [
    "Supplies",
    "Transportation",
    "Equipment",
    "Utilities",
    "Rent",
    "Marketing",
    "Insurance",
    "Maintenance",
    "Repairs",
    "Other",
  ];

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userProfile?.business_id && id) {
      fetchExpense();
    }
  }, [userProfile?.business_id, id]);

  const fetchExpense = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("id", id)
        .eq("business_id", userProfile.business_id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          category: data.category,
          description: data.description,
          amount: data.amount.toString(),
          expense_date: data.expense_date,
        });
      }
    } catch (error) {
      console.error("Error fetching expense:", error);
      toast.error("Failed to load expense data");
      navigate("/expenses");
    } finally {
      setLoadingExpense(false);
    }
  };

  const handleInputChange = (field: keyof ExpenseFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.description || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          expense_date: formData.expense_date,
        })
        .eq("id", id)
        .eq("business_id", userProfile.business_id);

      if (error) throw error;

      toast.success("Expense updated successfully!");
      navigate("/expenses");
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingExpense) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/expenses">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Expense</h1>
            <p className="text-muted-foreground">Update expense information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (KES) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="expense_date">Expense Date *</Label>
                  <Input
                    id="expense_date"
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) =>
                      handleInputChange("expense_date", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe the expense..."
                  rows={3}
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Updating..." : "Update Expense"}
                </Button>
                <Link to="/expenses" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditExpense;
