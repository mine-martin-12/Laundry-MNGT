import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Edit3, Eye } from "lucide-react";
import type { PendingUpdate } from "@/components/PendingUpdateCard";

interface ResubmitUpdateProps {
  isOpen: boolean;
  onClose: () => void;
  update: PendingUpdate;
}

const ResubmitUpdate = ({ isOpen, onClose, update }: ResubmitUpdateProps) => {
  const navigate = useNavigate();

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'rejected':
        return {
          color: 'destructive' as const,
          icon: AlertCircle,
          title: 'Update Rejected',
          description: 'Your update request has been rejected by an administrator.'
        };
      case 'sent_back_for_review':
        return {
          color: 'secondary' as const,
          icon: Edit3,
          title: 'Sent Back for Review',
          description: 'Your update request needs additional changes before approval.'
        };
      default:
        return {
          color: 'outline' as const,
          icon: Eye,
          title: 'Update Status',
          description: 'Review your update request status.'
        };
    }
  };

  const statusInfo = getStatusInfo(update.status);
  const StatusIcon = statusInfo.icon;

  const handleEditAndResubmit = () => {
    // Navigate to the appropriate edit page with the record data
    const editPath = getEditPath(update.table_name, update.record_id);
    if (editPath) {
      navigate(editPath);
    }
    onClose();
  };

  const getEditPath = (tableName: string, recordId: string) => {
    switch (tableName) {
      case 'services':
        return `/services/edit/${recordId}`;
      case 'expenses':
        return `/expenses/edit/${recordId}`;
      case 'profiles':
        return `/users/edit/${recordId}`;
      default:
        return null;
    }
  };

  const formatFieldName = (field: string) => {
    return field.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getChangedFields = () => {
    if (!update.old_values || !update.new_values) return [];
    
    const changes = [];
    const newValues = update.new_values as Record<string, any>;
    const oldValues = update.old_values as Record<string, any>;
    
    for (const [key, newValue] of Object.entries(newValues)) {
      const oldValue = oldValues[key];
      if (oldValue !== newValue) {
        changes.push({
          field: key,
          oldValue: oldValue,
          newValue: newValue
        });
      }
    }
    
    return changes;
  };

  const changedFields = getChangedFields();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5 text-muted-foreground" />
            {statusInfo.title}
          </DialogTitle>
          <DialogDescription>
            {statusInfo.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">Status</p>
              <Badge variant={statusInfo.color} className="mt-1">
                {update.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-sm font-medium">
                {new Date(update.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {update.reason && (
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Administrator Feedback
              </h4>
              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                "{update.reason}"
              </p>
            </div>
          )}

          {update.user_reason && (
            <div className="p-4 border rounded-lg bg-card">
              <h4 className="font-medium mb-2">Your Original Reason</h4>
              <p className="text-sm text-muted-foreground">
                "{update.user_reason}"
              </p>
            </div>
          )}

          <div className="p-4 border rounded-lg bg-card">
            <h4 className="font-medium mb-3">Proposed Changes</h4>
            <div className="space-y-2">
              {changedFields.map(({ field, oldValue, newValue }) => (
                <div key={field} className="grid grid-cols-3 gap-4 py-2 border-b last:border-b-0">
                  <div className="font-medium text-sm">
                    {formatFieldName(field)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {oldValue?.toString() || 'None'}
                  </div>
                  <div className="text-sm font-medium">
                    {newValue?.toString() || 'None'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(update.status === 'rejected' || update.status === 'sent_back_for_review') && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Edit3 className="h-4 w-4 text-blue-600 mt-1" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Ready to make changes?
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    Click "Edit & Resubmit" to make the requested changes and submit again for approval.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {(update.status === 'rejected' || update.status === 'sent_back_for_review') && (
            <Button onClick={handleEditAndResubmit} className="bg-blue-600 hover:bg-blue-700">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit & Resubmit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ResubmitUpdate };