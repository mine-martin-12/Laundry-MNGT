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

interface ServiceFormData {
  customer_name: string;
  service_type: string;
  amount: string;
  service_date: string;
  payment_status: string;
  payment_method: string;
  deposit_amount: string;
  due_date: string;
  description: string;
}

const EditService = () => {
  const { user, userProfile, loading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ServiceFormData>({
    customer_name: "",
    service_type: "",
    amount: "",
    service_date: "",
    payment_status: "not_paid",
    payment_method: "cash",
    deposit_amount: "",
    due_date: "",
    description: "",
  });
  const [loadingService, setLoadingService] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const serviceTypes = [
    "Wash, Dry & Fold",
    "Duvet Cleaning",
    "Shoe Cleaning",
    "Dry Cleaning",
    "Ironing",
    "Wash & Iron",
    "Comforter Cleaning",
    "Curtain Cleaning",
    "Alterations",
    "Stain Removal",
    "Other",
  ];

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userProfile?.business_id && id) {
      fetchService();
    }
  }, [userProfile?.business_id, id]);

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("id", id)
        .eq("business_id", userProfile.business_id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          customer_name: data.customer_name,
          service_type: data.service_type,
          amount: data.amount.toString(),
          service_date: data.service_date,
          payment_status: data.payment_status,
          payment_method: data.payment_method || "cash",
          deposit_amount: data.deposit_amount
            ? data.deposit_amount.toString()
            : "",
          due_date: data.due_date || "",
          description: data.description || "",
        });
      }
    } catch (error) {
      console.error("Error fetching service:", error);
      toast.error("Failed to load service data");
      navigate("/services");
    } finally {
      setLoadingService(false);
    }
  };

  const handleInputChange = (field: keyof ServiceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.service_type || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("services")
        .update({
          customer_name: formData.customer_name,
          service_type: formData.service_type,
          amount: parseFloat(formData.amount),
          service_date: formData.service_date,
          payment_status: formData.payment_status as
            | "not_paid"
            | "partially_paid"
            | "fully_paid",
          payment_method: formData.payment_method as
            | "cash"
            | "mpesa"
            | "bank_cheque"
            | "credit",
          deposit_amount: formData.deposit_amount
            ? parseFloat(formData.deposit_amount)
            : 0,
          due_date: formData.due_date || null,
          description: formData.description || null,
        })
        .eq("id", id)
        .eq("business_id", userProfile.business_id);

      if (error) throw error;

      toast.success("Service updated successfully!");
      navigate("/services");
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("Failed to update service");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingService) {
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
          <Link to="/services">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit Service</h1>
            <p className="text-muted-foreground">Update service information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      handleInputChange("customer_name", e.target.value)
                    }
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) =>
                      handleInputChange("service_type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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

                <div>
                  <Label htmlFor="service_date">Service Date *</Label>
                  <Input
                    id="service_date"
                    type="date"
                    value={formData.service_date}
                    onChange={(e) =>
                      handleInputChange("service_date", e.target.value)
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) =>
                      handleInputChange("payment_status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_paid">Not Paid</SelectItem>
                      <SelectItem value="partially_paid">
                        Partially Paid
                      </SelectItem>
                      <SelectItem value="fully_paid">Fully Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Additional notes about the service..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? "Updating..." : "Update Service"}
                </Button>
                <Link to="/services" className="flex-1">
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

export default EditService;
