import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AddService = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    service_type: "",
    amount: "",
    service_date: new Date().toISOString().split("T")[0],
    payment_status: "not_paid",
    payment_method: "cash",
    deposit_amount: "",
    due_date: "",
    description: "",
  });

  const serviceTypes = [
    "Wash, Dry & Fold",
    "Duvet Cleaning",
    "Beddings Cleaning",
    "Shoe Cleaning",
    "Dry Cleaning",
    "Ironing",
    "Wash & Iron",
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.service_type || !formData.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("services").insert({
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
        business_id: userProfile.business_id,
        created_by: user.id,
      });

      if (error) throw error;

      // If payment method is credit, create a credit record
      if (formData.payment_method === "credit" && formData.due_date) {
        const { error: creditError } = await supabase.from("credits").insert({
          customer_name: formData.customer_name,
          service_id: "", // We'll need to get the inserted service ID
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          business_id: userProfile.business_id,
        });

        if (creditError)
          console.error("Error creating credit record:", creditError);
      }

      toast.success("Service added successfully!");
      navigate("/services");
    } catch (error) {
      console.error("Error adding service:", error);
      toast.error("Failed to add service");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner variant="tetris" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center py-4 sm:py-6 gap-4">
            <Link to="/services" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto h-10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Services
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                Add New Service
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Create a new service record
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) =>
                      handleInputChange("customer_name", e.target.value)
                    }
                    placeholder="Enter customer name"
                    className="h-10"
                    required
                  />
                </div>

                {/* Service Type */}
                <div className="space-y-2">
                  <Label htmlFor="service_type">Service Type *</Label>
                  <Select
                    value={formData.service_type}
                    onValueChange={(value) =>
                      handleInputChange("service_type", value)
                    }
                  >
                    <SelectTrigger className="h-10">
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

                {/* Amount */}
                <div className="space-y-2">
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
                    className="h-10"
                    required
                  />
                </div>

                {/* Service Date */}
                <div className="space-y-2">
                  <Label htmlFor="service_date">Service Date</Label>
                  <Input
                    id="service_date"
                    type="date"
                    value={formData.service_date}
                    onChange={(e) =>
                      handleInputChange("service_date", e.target.value)
                    }
                    className="h-10"
                  />
                </div>

                {/* Payment Method */}
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method *</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) =>
                      handleInputChange("payment_method", value)
                    }
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank_cheque">Bank/Cheque</SelectItem>
                      <SelectItem value="credit">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status */}
                <div className="space-y-2">
                  <Label htmlFor="payment_status">Payment Status</Label>
                  <Select
                    value={formData.payment_status}
                    onValueChange={(value) =>
                      handleInputChange("payment_status", value)
                    }
                  >
                    <SelectTrigger className="h-10">
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

                {/* Conditional Fields */}
                {formData.payment_status === "partially_paid" && (
                  <div className="space-y-2">
                    <Label htmlFor="deposit_amount">
                      Deposit Amount (KES) *
                    </Label>
                    <Input
                      id="deposit_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.deposit_amount}
                      onChange={(e) =>
                        handleInputChange("deposit_amount", e.target.value)
                      }
                      placeholder="0.00"
                      className="h-10"
                      required
                    />
                  </div>
                )}

                {formData.payment_method === "credit" && (
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) =>
                        handleInputChange("due_date", e.target.value)
                      }
                      className="h-10"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
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

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-4">
                <Link to="/services" className="order-2 sm:order-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto h-10"
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="order-1 sm:order-2 w-full sm:w-auto h-10"
                >
                  {submitting ? "Adding Service..." : "Add Service"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddService;
