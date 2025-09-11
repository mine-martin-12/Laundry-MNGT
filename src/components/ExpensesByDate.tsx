import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
}

interface ExpensesByDateProps {
  expenses: Expense[];
  onDelete: (expenseId: string) => void;
  userRole?: string;
}

export const ExpensesByDate = ({
  expenses,
  onDelete,
  userRole,
}: ExpensesByDateProps) => {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = expense.expense_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  // Sort dates in descending order (most recent first)
  const sortedDates = Object.keys(groupedExpenses).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return "Today";
    } else if (date.getTime() === yesterday.getTime()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const getDayTotal = (dayExpenses: Expense[]) => {
    return dayExpenses.reduce(
      (sum, expense) => sum + parseFloat(String(expense.amount)),
      0
    );
  };

  const getCategoryBreakdown = (dayExpenses: Expense[]) => {
    const breakdown = dayExpenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = { count: 0, total: 0 };
      }
      acc[category].count += 1;
      acc[category].total += parseFloat(String(expense.amount));
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    return Object.entries(breakdown)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 3); // Show top 3 categories
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Supplies: "bg-blue-100 text-blue-800 border-blue-200",
      Transportation: "bg-green-100 text-green-800 border-green-200",
      Equipment: "bg-purple-100 text-purple-800 border-purple-200",
      Utilities: "bg-yellow-100 text-yellow-800 border-yellow-200",
      Rent: "bg-red-100 text-red-800 border-red-200",
      Marketing: "bg-pink-100 text-pink-800 border-pink-200",
      Insurance: "bg-indigo-100 text-indigo-800 border-indigo-200",
      Maintenance: "bg-orange-100 text-orange-800 border-orange-200",
      Repairs: "bg-teal-100 text-teal-800 border-teal-200",
      Other: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[category] || colors["Other"];
  };

  const toggleDateExpansion = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  if (sortedDates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => {
        const dayExpenses = groupedExpenses[date];
        const dayTotal = getDayTotal(dayExpenses);
        const categoryBreakdown = getCategoryBreakdown(dayExpenses);
        const isExpanded = expandedDates.has(date);

        return (
          <Card key={date} className="shadow-sm border border-border">
            <Collapsible
              open={isExpanded}
              onOpenChange={() => toggleDateExpansion(date)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="pb-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          {formatDate(date)}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {categoryBreakdown.map(([category, data]) => (
                            <Badge
                              key={category}
                              variant="outline"
                              className={`${getCategoryColor(category)} text-xs`}
                            >
                              {category}: {formatCurrency(data.total)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-destructive">
                          -{formatCurrency(dayTotal)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {dayExpenses.length}{" "}
                          {dayExpenses.length === 1 ? "expense" : "expenses"}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {dayExpenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium text-foreground truncate">
                              {expense.description}
                            </h4>
                            <Badge
                              variant="outline"
                              className={`${getCategoryColor(
                                expense.category
                              )} text-xs`}
                            >
                              {expense.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Added:{" "}
                            {new Date(expense.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <p className="text-lg font-semibold text-destructive">
                              -{formatCurrency(parseFloat(String(expense.amount)))}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Link to={`/expenses/edit/${expense.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {userRole === "admin" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                                onClick={() => onDelete(expense.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};