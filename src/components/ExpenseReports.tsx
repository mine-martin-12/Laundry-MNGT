import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_at: string;
}

interface ExpenseReportsProps {
  expenses: Expense[];
}

export function ExpenseReports({ expenses }: ExpenseReportsProps) {
  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    
    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.expense_date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
  };

  const getPreviousMonthExpenses = () => {
    const now = new Date();
    const prevMonth = subMonths(now, 1);
    const monthStart = startOfMonth(prevMonth);
    const monthEnd = endOfMonth(prevMonth);
    
    return expenses.filter(expense => {
      const expenseDate = parseISO(expense.expense_date);
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
  };

  const getCategoryBreakdown = () => {
    const breakdown: { [category: string]: { total: number; count: number } } = {};
    
    expenses.forEach(expense => {
      if (!breakdown[expense.category]) {
        breakdown[expense.category] = { total: 0, count: 0 };
      }
      breakdown[expense.category].total += parseFloat(String(expense.amount));
      breakdown[expense.category].count += 1;
    });

    return Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        total: data.total,
        count: data.count,
        percentage: (data.total / totalExpenses) * 100
      }))
      .sort((a, b) => b.total - a.total);
  };

  const currentMonthExpenses = getCurrentMonthExpenses();
  const previousMonthExpenses = getPreviousMonthExpenses();
  const categoryBreakdown = getCategoryBreakdown();

  const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(String(expense.amount)), 0);
  const currentMonthTotal = currentMonthExpenses.reduce((sum, expense) => sum + parseFloat(String(expense.amount)), 0);
  const previousMonthTotal = previousMonthExpenses.reduce((sum, expense) => sum + parseFloat(String(expense.amount)), 0);

  const monthOverMonthChange = previousMonthTotal === 0 
    ? (currentMonthTotal > 0 ? 100 : 0)
    : ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;

  const averageExpensePerDay = currentMonthExpenses.length > 0 
    ? currentMonthTotal / new Date().getDate()
    : 0;

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-success" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-destructive';
    if (change < 0) return 'text-success';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(currentMonthTotal)}
            </div>
            <p className="text-sm text-muted-foreground">
              {currentMonthExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Month-over-Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon(monthOverMonthChange)}
              <span className={`text-2xl font-bold ${getTrendColor(monthOverMonthChange)}`}>
                {Math.abs(monthOverMonthChange).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              vs. last month ({formatCurrency(previousMonthTotal)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageExpensePerDay)}
            </div>
            <p className="text-sm text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.category}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.count} item{item.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(item.total)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Total Summary */}
      <Card>
        <CardHeader>
          <CardTitle>All-Time Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalExpenses)}
              </div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {expenses.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Records</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {categoryBreakdown.length}
              </div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
              </div>
              <p className="text-sm text-muted-foreground">Average per Record</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}