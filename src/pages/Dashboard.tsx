import React, { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShirtIcon,
  DollarSign,
  TrendingUp,
  Users,
  Package,
  AlertCircle,
  Plus,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/currency";
import { DateRangeFilter, DateRange } from "@/components/DateRangeFilter";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EnhancedAnalytics } from "@/components/EnhancedAnalytics";
import {
  startOfDay,
  endOfDay,
  format,
  startOfMonth,
  endOfMonth,
} from "date-fns";

interface DashboardStats {
  totalServices: number;
  todayServices: number;
  periodServices: number;
  pendingPayments: number;
  pendingRevenue: number;
  periodRevenue: number;
  totalRevenue: number;
  totalExpenses: number;
  recentServices: any[];
  unpaidServices: any[];
  partialServices: any[];
}

const Dashboard = () => {
  const { user, userProfile, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalServices: 0,
    todayServices: 0,
    periodServices: 0,
    pendingPayments: 0,
    pendingRevenue: 0,
    periodRevenue: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    recentServices: [],
    unpaidServices: [],
    partialServices: [],
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [allExpenses, setAllExpenses] = useState<any[]>([]);

  useEffect(() => {
    if (userProfile?.business_id) {
      fetchDashboardStats();
    }
  }, [userProfile, dateRange]);

  const fetchDashboardStats = async () => {
    try {
      const businessId = userProfile.business_id;
      const today = new Date();
      const todayStart = startOfDay(today);
      const todayEnd = endOfDay(today);

      // Current month boundaries
      const currentMonthStart = startOfMonth(today);
      const currentMonthEnd = endOfMonth(today);

      // Fetch ALL services for all-time calculations
      const { data: allServices, error: allServicesError } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .order("service_date", { ascending: false });

      if (allServicesError) {
        console.error("Error fetching all services:", allServicesError);
        throw allServicesError;
      }

      // Fetch TODAY'S services based on service_date
      const { data: todayServices, error: todayError } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .gte("service_date", format(todayStart, "yyyy-MM-dd"))
        .lte("service_date", format(todayEnd, "yyyy-MM-dd"))
        .order("service_date", { ascending: false });

      if (todayError) {
        console.error("Error fetching today services:", todayError);
        throw todayError;
      }

      // Fetch CURRENT MONTH services for month-based calculations
      const { data: currentMonthServices, error: monthError } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .gte("service_date", format(currentMonthStart, "yyyy-MM-dd"))
        .lte("service_date", format(currentMonthEnd, "yyyy-MM-dd"))
        .order("service_date", { ascending: false });

      if (monthError) {
        console.error("Error fetching current month services:", monthError);
        throw monthError;
      }

      // Fetch services data filtered by date range for period calculations
      const { data: periodServices, error: periodError } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", businessId)
        .gte("service_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("service_date", format(dateRange.to, "yyyy-MM-dd"))
        .order("service_date", { ascending: false });

      if (periodError) {
        console.error("Error fetching period services:", periodError);
        throw periodError;
      }

      // Fetch expenses data filtered by date range
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("business_id", businessId)
        .gte("expense_date", format(dateRange.from, "yyyy-MM-dd"))
        .lte("expense_date", format(dateRange.to, "yyyy-MM-dd"));

      if (expensesError) {
        console.error("Error fetching expenses:", expensesError);
        throw expensesError;
      }

      // Fetch credits data (current month for pending calculations)
      const { data: credits, error: creditsError } = await supabase
        .from("credits")
        .select("*")
        .eq("business_id", businessId)
        .gte("created_at", currentMonthStart.toISOString())
        .lte("created_at", currentMonthEnd.toISOString());

      if (creditsError) {
        console.error("Error fetching credits:", creditsError);
        // Don't throw here, credits might not exist
      }

      if (
        allServices &&
        todayServices &&
        currentMonthServices &&
        periodServices
      ) {
        // ALL-TIME calculations (for Total Services only)
        const allFullyPaidServices = allServices.filter(
          (s) => s.payment_status === "fully_paid"
        );
        const allPartiallyPaidServices = allServices.filter(
          (s) => s.payment_status === "partially_paid"
        );
        const allUnpaidServices = allServices.filter(
          (s) => s.payment_status === "not_paid"
        );

        // CURRENT MONTH calculations for revenue and pending amounts
        const monthFullyPaidServices = currentMonthServices.filter(
          (s) => s.payment_status === "fully_paid"
        );
        const monthPartiallyPaidServices = currentMonthServices.filter(
          (s) => s.payment_status === "partially_paid"
        );
        const monthUnpaidServices = currentMonthServices.filter(
          (s) => s.payment_status === "not_paid"
        );

        // Total revenue (CURRENT MONTH ONLY) - actual money received this month
        const totalRevenue =
          monthFullyPaidServices.reduce(
            (sum, s) => sum + parseFloat(String(s.amount || 0)),
            0
          ) +
          monthPartiallyPaidServices.reduce(
            (sum, s) => sum + parseFloat(String(s.deposit_amount || 0)),
            0
          );

        // Pending revenue (CURRENT MONTH ONLY) - money still owed for this month's services
        const monthUnpaidAmounts = monthUnpaidServices.reduce(
          (sum, s) => sum + parseFloat(String(s.amount || 0)),
          0
        );
        const monthRemainingBalances = monthPartiallyPaidServices.reduce(
          (sum, s) =>
            sum +
            (parseFloat(String(s.amount || 0)) -
              parseFloat(String(s.deposit_amount || 0))),
          0
        );
        const creditAmounts = credits
          ? credits.reduce(
              (sum, c) => sum + parseFloat(String(c.amount || 0)),
              0
            )
          : 0;
        const pendingRevenue =
          monthUnpaidAmounts + monthRemainingBalances + creditAmounts;

        // PERIOD calculations
        const periodFullyPaidServices = periodServices.filter(
          (s) => s.payment_status === "fully_paid"
        );
        const periodPartiallyPaidServices = periodServices.filter(
          (s) => s.payment_status === "partially_paid"
        );

        // Period revenue - money received in selected period
        const periodRevenue =
          periodFullyPaidServices.reduce(
            (sum, s) => sum + parseFloat(String(s.amount || 0)),
            0
          ) +
          periodPartiallyPaidServices.reduce(
            (sum, s) => sum + parseFloat(String(s.deposit_amount || 0)),
            0
          );

        const totalExpenses = expenses
          ? expenses.reduce(
              (sum, e) => sum + parseFloat(String(e.amount || 0)),
              0
            )
          : 0;

        console.log("Dashboard Stats Debug:", {
          allServicesCount: allServices.length,
          todayServicesCount: todayServices.length,
          currentMonthServicesCount: currentMonthServices.length,
          periodServicesCount: periodServices.length,
          todayDate: format(todayStart, "yyyy-MM-dd"),
          currentMonthStart: format(currentMonthStart, "yyyy-MM-dd"),
          currentMonthEnd: format(currentMonthEnd, "yyyy-MM-dd"),
          dateRangeFrom: format(dateRange.from, "yyyy-MM-dd"),
          dateRangeTo: format(dateRange.to, "yyyy-MM-dd"),
          monthlyTotalRevenue: totalRevenue,
          monthlyPendingRevenue: pendingRevenue,
        });

        setStats({
          totalServices: allServices.length,
          todayServices: todayServices.length,
          periodServices: periodServices.length,
          pendingPayments:
            monthUnpaidServices.length + monthPartiallyPaidServices.length, // Current month pending payments
          pendingRevenue, // Current month pending revenue
          periodRevenue,
          totalRevenue, // Current month total revenue
          totalExpenses,
          recentServices: periodServices.slice(0, 5),
          unpaidServices: allUnpaidServices.slice(0, 5), // Show 5 unpaid for action items
          partialServices: allPartiallyPaidServices.slice(0, 2), // Show all partial for action items
        });

        // Store all services and expenses for analytics
        setAllServices(allServices);
        setAllExpenses(expenses || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to load dashboard data");
    }

    setLoadingStats(false);
  };

  const markServiceAsPaid = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ payment_status: "fully_paid" })
        .eq("id", serviceId);

      if (error) throw error;

      toast.success("Service marked as paid");
      fetchDashboardStats();
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service");
    }
  };

  // Redirect if not authenticated (after hooks are declared)
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  if (loading || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner variant="tetris" size="lg" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isToday =
    dateRange.from.toDateString() === dateRange.to.toDateString() &&
    dateRange.from.toDateString() === new Date().toDateString();

  const currentMonth = format(new Date(), "MMMM yyyy");

  return (
    <div className="bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {userProfile?.first_name}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your laundry business.
            </p>
          </div>
          <DateRangeFilter onDateRangeChange={setDateRange} />
        </div>
      </div>

      {/* Welcome Message */}
      {/*<div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          Welcome back, {userProfile?.first_name}!
        </h2>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your laundry business today.
        </p>
      </div>*/}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isToday ? "Today's Services" : "Period Services"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {isToday ? stats.todayServices : stats.periodServices}
            </div>
            <p className="text-xs text-muted-foreground">
              {isToday
                ? "Services scheduled for today"
                : "Services in selected period"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentMonth} Pending Revenue
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {formatCurrency(stats.pendingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Unpaid + remaining balances this month
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Period Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success">
              {formatCurrency(stats.periodRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue in selected period
            </p>
          </CardContent>
        </Card>

        {userProfile?.role === 'admin' && (
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {currentMonth} Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Revenue collected this month
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Services
            </CardTitle>
            <ShirtIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {stats.totalServices}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time services processed
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-medium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {currentMonth} Pending Payments
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-warning">
              {stats.pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">
              Services awaiting payment this month
            </p>
          </CardContent>
        </Card>

        {userProfile?.role === 'admin' && (
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Period Expenses
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-destructive">
                {formatCurrency(stats.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                Expenses in selected period
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Link to="/services/new" className="w-full sm:w-auto">
          <Button className="shadow-medium w-full sm:w-auto h-10">
            <Plus className="h-4 w-4 mr-2" />
            Add New Service
          </Button>
        </Link>
        <Link to="/expenses/new" className="w-full sm:w-auto">
          <Button
            variant="outline"
            className="shadow-soft w-full sm:w-auto h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Record Expense
          </Button>
        </Link>
        {userProfile?.role === "admin" && (
          <Link to="/users/new" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="shadow-soft w-full sm:w-auto h-10"
            >
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Services */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Recent Services</CardTitle>
            <CardDescription>Latest laundry services processed</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentServices.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.recentServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-2 sm:gap-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {service.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.service_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Service:{" "}
                        {new Date(service.service_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="font-medium">
                        {formatCurrency(
                          parseFloat(String(service.amount || 0))
                        )}
                      </p>
                      <Badge
                        variant={
                          service.payment_status === "fully_paid"
                            ? "default"
                            : service.payment_status === "partially_paid"
                            ? "secondary"
                            : "outline"
                        }
                        className="w-fit"
                      >
                        {service.payment_status === "fully_paid"
                          ? "Paid"
                          : service.payment_status === "partially_paid"
                          ? "Partial"
                          : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p>No services yet</p>
                <p className="text-sm">Start by adding your first service</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Outstanding Payments
            </CardTitle>
            <CardDescription>
              Services requiring payment collection
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.unpaidServices.length > 0 ||
            stats.partialServices.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Unpaid Services */}
                {stats.unpaidServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {service.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.service_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Service:{" "}
                        {new Date(service.service_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-left sm:text-right">
                        <p className="font-medium">
                          {formatCurrency(
                            parseFloat(String(service.amount || 0))
                          )}
                        </p>
                        <Badge
                          variant="outline"
                          className="w-fit border-destructive text-destructive"
                        >
                          Unpaid
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => markServiceAsPaid(service.id)}
                        className="bg-success hover:bg-success/90 w-full sm:w-auto h-9"
                      >
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Partially Paid Services */}
                {stats.partialServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-warning/10 border border-warning/20 rounded-lg gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {service.customer_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {service.service_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Service:{" "}
                        {new Date(service.service_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-warning">
                        Paid:{" "}
                        {formatCurrency(
                          parseFloat(String(service.deposit_amount || 0))
                        )}{" "}
                        • Remaining:{" "}
                        {formatCurrency(
                          parseFloat(String(service.amount || 0)) -
                            parseFloat(String(service.deposit_amount || 0))
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-left sm:text-right">
                        <p className="font-medium">
                          {formatCurrency(
                            parseFloat(String(service.amount || 0))
                          )}
                        </p>
                        <Badge
                          variant="secondary"
                          className="w-fit bg-warning text-warning-foreground"
                        >
                          Partial
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => markServiceAsPaid(service.id)}
                        className="bg-success hover:bg-success/90 w-full sm:w-auto h-9"
                      >
                        Complete Payment
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50 text-success" />
                <p>All caught up!</p>
                <p className="text-sm">No outstanding payments</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics */}
      {userProfile?.role === 'admin' && (
        <div className="mb-8">
          <EnhancedAnalytics services={allServices} expenses={allExpenses} />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
