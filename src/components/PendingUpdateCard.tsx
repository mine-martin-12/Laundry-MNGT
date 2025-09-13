import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { notifyUserOfStatusChange } from "@/lib/notifications";
import { CheckCircle, XCircle, RotateCcw, Clock, User, DollarSign, Calendar } from "lucide-react";

export interface PendingUpdate {
  id: string;
  table_name: string;
  record_id: string;
  user_id: string;
  business_id: string;
  old_values: any;
  new_values: any;
  status: "pending" | "approved" | "sent_back_for_review" | "rejected";
  reason?: string;
  user_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

interface PendingUpdateCardProps {
  update: PendingUpdate;
  onStatusChange: () => void;
  showActions?: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "outline";
    case "approved":
      return "default";
    case "rejected":
      return "destructive";
    case "sent_back_for_review":
      return "secondary";
    default:
      return "outline";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "approved":
      return <CheckCircle className="h-4 w-4" />;
    case "rejected":
      return <XCircle className="h-4 w-4" />;
    case "sent_back_for_review":
      return <RotateCcw className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatFieldName = (field: string) => {
  return field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
};

const getFieldIcon = (field: string) => {
  if (field.includes("name")) return <User className="h-4 w-4" />;
  if (field.includes("amount") || field.includes("price")) return <DollarSign className="h-4 w-4" />;
  if (field.includes("date")) return <Calendar className="h-4 w-4" />;
  return null;
};

const PendingUpdateCard = ({ update, onStatusChange, showActions = false }: PendingUpdateCardProps) => {
  const { userProfile } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStatusUpdate = async (newStatus: string, actionReason?: string) => {
    if (!userProfile || userProfile.role !== "admin") {
      toast.error("Only administrators can manage pending updates.");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        status: newStatus,
        reviewed_by: userProfile.user_id,
        reviewed_at: new Date().toISOString(),
      };

      if (actionReason) {
        updateData.reason = actionReason;
      }

      const { error } = await supabase
        .from("pending_updates")
        .update(updateData)
        .eq("id", update.id);

      if (error) throw error;

      // If approved, apply the update using the database function
      if (newStatus === "approved") {
        const { error: applyError } = await supabase.rpc("apply_pending_update", {
          update_id: update.id,
        });

        if (applyError) {
          console.error("Error applying update:", applyError);
          toast.error("Failed to apply the approved update.");
          return;
        }
      }

      // Create notification for the user who requested the update
      await notifyUserOfStatusChange(
        update.user_id,
        update.business_id,
        {
          status: newStatus,
          tableName: update.table_name,
          recordId: update.record_id,
          reason: actionReason
        }
      );

      toast.success(`Update ${newStatus.replace("_", " ")} successfully.`);

      onStatusChange();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status.");
    } finally {
      setLoading(false);
      setReason("");
    }
  };

  const getChangedFields = () => {
    const changed = [];
    for (const [key, newValue] of Object.entries(update.new_values)) {
      const oldValue = update.old_values[key];
      if (oldValue !== newValue) {
        changed.push({ field: key, oldValue, newValue });
      }
    }
    return changed;
  };

  const changedFields = getChangedFields();

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(update.status)}
            {formatFieldName(update.table_name)} Update
          </CardTitle>
          <Badge variant={getStatusColor(update.status)}>
            {update.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Submitted on {new Date(update.created_at).toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium">Changes Requested:</h4>
          {changedFields.map(({ field, oldValue, newValue }) => (
            <div key={field} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {getFieldIcon(field)}
                <span className="font-medium">{formatFieldName(field)}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Current Value:</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {oldValue || "Not set"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Requested Value:</Label>
                  <div className="mt-1 p-2 bg-primary/10 rounded">
                    {newValue || "Not set"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {update.reason && (
          <div>
            <Label className="text-muted-foreground">Admin Note:</Label>
            <div className="mt-1 p-2 bg-muted rounded">
              {update.reason}
            </div>
          </div>
        )}

        {showActions && update.status === "pending" && userProfile?.role === "admin" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional):</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note about this decision..."
                className="min-h-[80px]"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => handleStatusUpdate("approved", reason)}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleStatusUpdate("sent_back_for_review", reason)}
                disabled={loading}
                variant="outline"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Send Back for Review
              </Button>
              <Button
                onClick={() => handleStatusUpdate("rejected", reason)}
                disabled={loading}
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingUpdateCard;