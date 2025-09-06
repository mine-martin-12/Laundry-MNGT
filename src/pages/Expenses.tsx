import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Edit, Trash2, Receipt } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { DateRangeFilter, DateRange } from "@/components/DateRangeFilter";
import { ExpenseReports } from "@/components/ExpenseReports";
import { ExpensesByDate } from "@/components/ExpensesByDate";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
}

const Expenses = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });
  const [showReports, setShowReports] = useState(false);

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
    if (userProfile?.business_id) {
      fetchExpenses();
    }
  }, [userProfile?.business_id, dateRange]);

  useEffect(() => {
    filterExpenses();
  }, [expenses, searchTerm, categoryFilter]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("business_id", userProfile.business_id)
        .gte("expense_date", dateRange.from.toISOString().split("T")[0])
        .lte("expense_date", dateRange.to.toISOString().split("T")[0])
        .order("expense_date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoadingExpenses(false);
    }
  };

  const filterExpenses = () => {
    let filtered = expenses;

    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          expense.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.category === categoryFilter
      );
    }

    setFilteredExpenses(filtered);
  };

  const deleteExpense = async (expenseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this expense? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      await fetchExpenses();
      toast.success("Expense deleted successfully");
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const totalExpenses = filteredExpenses.reduce(
    (sum, expense) => sum + parseFloat(String(expense.amount)),
    0
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Expenses Management
            </h1>
            <p className="text-muted-foreground">
              Track and manage your business expenses
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <DateRangeFilter onDateRangeChange={setDateRange} />
            <div className="flex gap-2">
              <Button
                variant={showReports ? "default" : "outline"}
                onClick={() => setShowReports(!showReports)}
              >
                {showReports ? "Hide Reports" : "Show Reports"}
              </Button>
              <Link to="/">
                <Button variant="outline">Back to Dashboard</Button>
              </Link>
              <Link to="/expenses/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      {showReports && (
        <div className="mb-6">
          <ExpenseReports expenses={expenses} />
        </div>
      )}

      {/* Main Content */}
      <div>
        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Total Expenses</h3>
                <p className="text-muted-foreground">
                  {categoryFilter !== "all"
                    ? `${categoryFilter} expenses`
                    : "All categories"}
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {filteredExpenses.length} items
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by description or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        {loadingExpenses ? (
          <div className="text-center py-8">Loading expenses...</div>
        ) : filteredExpenses.length > 0 ? (
          <ExpensesByDate
            expenses={filteredExpenses}
            onDelete={deleteExpense}
            userRole={userProfile?.role}
          />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No expenses found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first expense"}
              </p>
              <Link to="/expenses/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Expenses;
