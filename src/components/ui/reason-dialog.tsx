import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface ReasonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  description: string;
  actionType: "update" | "delete";
  loading?: boolean;
}

const ReasonDialog: React.FC<ReasonDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionType,
  loading = false,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onClose();
    } catch (error) {
      console.error("Error in reason dialog:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for {actionType} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Please explain why you are ${actionType}ing this record...`}
              className="min-h-[100px]"
              disabled={isSubmitting || loading}
            />
          </div>
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <strong>Note:</strong> This reason will be logged for audit purposes
            and can be reviewed by administrators.
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason.trim() || isSubmitting || loading}
            variant={actionType === "delete" ? "destructive" : "default"}
          >
            {isSubmitting
              ? "Processing..."
              : `Confirm ${actionType === "delete" ? "Delete" : "Update"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ReasonDialog };