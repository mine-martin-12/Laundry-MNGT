import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/currency";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  subMonths,
  isSameDay,
} from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShirtIcon,
  Calendar,
  Users,
} from "lucide-react";

interface Service {
  id: string;
  service_type: string;
  amount: number;
  service_date: string;
  payment_status: string;
  customer_name: string;
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  expense_date: string;
}

interface AnalyticsProps {
  services: Service[];
  expenses: Expense[];
}

const EnhancedAnalytics = ({ services, expenses }: AnalyticsProps) => {
  // Revenue vs Expenses Chart Data
  const getRevenueVsExpensesData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthRevenue = services
        .filter((service) => {
          const serviceDate = parseISO(service.service_date);
          return (
            serviceDate >= monthStart &&
            serviceDate <= monthEnd &&
            service.payment_status === "fully_paid"
          );
        })
        .reduce((sum, service) => sum + parseFloat(String(service.amount)), 0);

      const monthExpenses = expenses
        .filter((expense) => {
          const expenseDate = parseISO(expense.expense_date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, expense) => sum + parseFloat(String(expense.amount)), 0);

      months.push({
        month: format(date, "MMM"),
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
      });
    }
    return months;
  };

  // Service Types Distribution
  const getServiceTypeData = () => {
    const typeMap: { [key: string]: number } = {};
    services.forEach((service) => {
      typeMap[service.service_type] = (typeMap[service.service_type] || 0) + 1;
    });

    return Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
      percentage: (count / services.length) * 100,
    }));
  };

  // Daily Revenue Trend (Last 30 days)
  const getDailyRevenueTrend = () => {
    const last30Days = eachDayOfInterval({
      start: subMonths(new Date(), 1),
      end: new Date(),
    });

    return last30Days.map((day) => {
      const dayRevenue = services
        .filter((service) => {
          const serviceDate = parseISO(service.service_date);
          return (
            isSameDay(serviceDate, day) &&
            service.payment_status === "fully_paid"
          );
        })
        .reduce((sum, service) => sum + parseFloat(String(service.amount)), 0);

      return {
        date: format(day, "MMM dd"),
        revenue: dayRevenue,
      };
    });
  };

  // Payment Status Distribution
  const getPaymentStatusData = () => {
    const statusMap = {
      fully_paid: { count: 0, amount: 0 },
      partially_paid: { count: 0, amount: 0 },
      not_paid: { count: 0, amount: 0 },
    };

    services.forEach((service) => {
      const status = service.payment_status as keyof typeof statusMap;
      statusMap[status].count += 1;
      statusMap[status].amount += parseFloat(String(service.amount));
    });

    return Object.entries(statusMap).map(([status, data]) => ({
      status: status.replace("_", " ").toUpperCase(),
      count: data.count,
      amount: data.amount,
    }));
  };

  // Top Customers by Revenue
  const getTopCustomers = () => {
    const customerMap: { [key: string]: number } = {};
    services
      .filter((service) => service.payment_status === "fully_paid")
      .forEach((service) => {
        customerMap[service.customer_name] =
          (customerMap[service.customer_name] || 0) +
          parseFloat(String(service.amount));
      });

    return Object.entries(customerMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([customer, revenue]) => ({ customer, revenue }));
  };

  const revenueVsExpensesData = getRevenueVsExpensesData();
  const serviceTypeData = getServiceTypeData();
  const dailyRevenueTrend = getDailyRevenueTrend();
  const paymentStatusData = getPaymentStatusData();
  const topCustomers = getTopCustomers();

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "hsl(var(--primary))",
    },
    expenses: {
      label: "Expenses",
      color: "hsl(var(--destructive))",
    },
    profit: {
      label: "Profit",
      color: "hsl(var(--success))",
    },
  };

  const pieColors = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--warning))",
    "hsl(var(--success))",
  ];

  // Calculate key metrics
  const totalRevenue = services
    .filter((s) => s.payment_status === "fully_paid")
    .reduce((sum, s) => sum + parseFloat(String(s.amount)), 0);

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(String(e.amount)),
    0
  );
  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Revenue
                </p>
                <p className="text-lg sm:text-2xl font-bold text-primary truncate">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <p className="text-lg sm:text-2xl font-bold text-destructive truncate">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-destructive shrink-0" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Profit
                </p>
                <p
                  className={`text-lg sm:text-2xl font-bold truncate ${
                    profit >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {formatCurrency(profit)}
                </p>
              </div>
              {profit >= 0 ? (
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-success shrink-0" />
              ) : (
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-destructive shrink-0" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Profit Margin
                </p>
                <p
                  className={`text-lg sm:text-2xl font-bold ${
                    profitMargin >= 0 ? "text-success" : "text-destructive"
                  }`}
                >
                  {profitMargin.toFixed(1)}%
                </p>
              </div>
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Revenue vs Expenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses (6 Months)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ChartContainer config={chartConfig} className="h-60 sm:h-80">
              <BarChart data={revenueVsExpensesData}>
                <XAxis dataKey="month" fontSize={12} tickMargin={5} />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                <Bar
                  dataKey="expenses"
                  fill="var(--color-expenses)"
                  radius={4}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Service Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Service Types Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="h-60 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={window.innerWidth < 640 ? 60 : 80}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ type, percentage }) =>
                      window.innerWidth >= 640
                        ? `${type}: ${percentage.toFixed(1)}%`
                        : ""
                    }
                  >
                    {serviceTypeData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <ChartContainer config={chartConfig} className="h-60 sm:h-80">
              <AreaChart data={dailyRevenueTrend}>
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickMargin={5}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value) => formatCurrency(value)}
                  fontSize={12}
                  width={60}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              {paymentStatusData.map((status, index) => (
                <div
                  key={status.status}
                  className="flex items-center justify-between p-2 sm:p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shrink-0"
                      style={{ backgroundColor: pieColors[index] }}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {status.status}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {status.count} services
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm sm:text-base">
                      {formatCurrency(status.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.customer}
                className="flex items-center justify-between p-2 sm:p-3 border border-border rounded-lg"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Badge variant="outline" className="shrink-0 text-xs">
                    #{index + 1}
                  </Badge>
                  <span className="font-medium text-sm sm:text-base truncate">
                    {customer.customer}
                  </span>
                </div>
                <span className="font-semibold text-primary text-sm sm:text-base shrink-0">
                  {formatCurrency(customer.revenue)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { EnhancedAnalytics };
