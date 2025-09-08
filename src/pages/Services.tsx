import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Filter, Edit, Trash2, DollarSign } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/currency";
import { toast } from "sonner";
import { ServicesByDate } from "@/components/ServicesByDate";

interface Service {
  id: string;
  customer_name: string;
  service_type: string;
  amount: number;
  service_date: string;
  payment_status: "not_paid" | "partially_paid" | "fully_paid";
  payment_method?: string;
  deposit_amount?: number;
  description?: string;
  created_at: string;
}

const Services = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "grouped">("grouped");

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userProfile?.business_id) {
      fetchServices();
    }
  }, [userProfile?.business_id]);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, statusFilter]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("business_id", userProfile.business_id)
        .order("service_date", { ascending: false });

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoadingServices(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    if (searchTerm) {
      filtered = filtered.filter(
        (service) =>
          service.customer_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          service.service_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (service) => service.payment_status === statusFilter
      );
    }

    setFilteredServices(filtered);
  };

  const markServiceAsPaid = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("services")
        .update({ payment_status: "fully_paid" })
        .eq("id", serviceId);

      if (error) throw error;

      await fetchServices();
      toast.success("Service marked as paid");
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update payment status");
    }
  };

  const deleteService = async (serviceId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this service? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      await fetchServices();
      toast.success("Service deleted successfully");
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner variant="tetris" size="lg" />
        <p className="text-muted-foreground">Loading your services...</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              Services Management
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your laundry services and track payments
            </p>
          </div>
          <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
            <Link to="/" className="flex-1 sm:flex-none">
              <Button variant="outline" className="w-full sm:w-auto h-10">
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/services/new" className="flex-1 sm:flex-none">
              <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto h-10">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Service</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by customer name or service type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="fully_paid">Fully Paid</SelectItem>
                    <SelectItem value="partially_paid">
                      Partially Paid
                    </SelectItem>
                    <SelectItem value="not_paid">Not Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        {loadingServices ? (
          <div className="text-center py-8">
            <LoadingSpinner variant="tetris" size="md" />
            <p className="text-muted-foreground">Loading your services...</p>
          </div>
        ) : filteredServices.length > 0 ? (
          <ServicesByDate
            services={filteredServices}
            onMarkPaid={markServiceAsPaid}
            onDelete={deleteService}
            userRole={userProfile?.role}
          />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No services found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding your first service"}
              </p>
              <Link to="/services/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Service
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Services;
