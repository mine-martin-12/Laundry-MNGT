import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Bell, Plus, Clock, AlertTriangle, Calendar, DollarSign, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface NotificationTrigger {
  id?: string;
  name: string;
  trigger_type: 'overdue_payment' | 'service_reminder' | 'payment_reminder' | 'service_due';
  conditions: {
    days_before?: number;
    days_after?: number;
    amount_threshold?: number;
  };
  message_template: string;
  is_active: boolean;
  business_id: string;
}

export function NotificationTriggers() {
  const { userProfile } = useAuth();
  const [triggers, setTriggers] = useState<NotificationTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrigger, setEditingTrigger] = useState<NotificationTrigger | null>(null);

  const [formData, setFormData] = useState<NotificationTrigger>({
    name: '',
    trigger_type: 'payment_reminder',
    conditions: {},
    message_template: '',
    is_active: true,
    business_id: userProfile?.business_id || ''
  });

  useEffect(() => {
    if (userProfile?.business_id) {
      fetchTriggers();
    }
  }, [userProfile]);

  const fetchTriggers = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_triggers' as any)
        .select('*')
        .eq('business_id', userProfile?.business_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTriggers((data as unknown as NotificationTrigger[]) || []);
    } catch (error) {
      console.error('Error fetching triggers:', error);
      toast.error('Failed to load notification triggers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const triggerData = {
        ...formData,
        business_id: userProfile?.business_id
      };

      if (editingTrigger?.id) {
        const { error } = await supabase
          .from('notification_triggers' as any)
          .update(triggerData)
          .eq('id', editingTrigger.id);
        
        if (error) throw error;
        toast.success('Trigger updated successfully');
      } else {
        const { error } = await supabase
          .from('notification_triggers' as any)
          .insert(triggerData);
        
        if (error) throw error;
        toast.success('Trigger created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTriggers();
    } catch (error) {
      console.error('Error saving trigger:', error);
      toast.error('Failed to save trigger');
    }
  };

  const toggleTrigger = async (triggerId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('notification_triggers' as any)
        .update({ is_active: isActive })
        .eq('id', triggerId);

      if (error) throw error;
      
      toast.success(`Trigger ${isActive ? 'activated' : 'deactivated'}`);
      fetchTriggers();
    } catch (error) {
      console.error('Error toggling trigger:', error);
      toast.error('Failed to update trigger');
    }
  };

  const deleteTrigger = async (triggerId: string) => {
    try {
      const { error } = await supabase
        .from('notification_triggers' as any)
        .delete()
        .eq('id', triggerId);

      if (error) throw error;
      
      toast.success('Trigger deleted successfully');
      fetchTriggers();
    } catch (error) {
      console.error('Error deleting trigger:', error);
      toast.error('Failed to delete trigger');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'payment_reminder',
      conditions: {},
      message_template: '',
      is_active: true,
      business_id: userProfile?.business_id || ''
    });
    setEditingTrigger(null);
  };

  const openEditDialog = (trigger: NotificationTrigger) => {
    setFormData(trigger);
    setEditingTrigger(trigger);
    setIsDialogOpen(true);
  };

  const getTriggerIcon = (type: string) => {
    switch (type) {
      case 'overdue_payment': return <DollarSign className="h-4 w-4" />;
      case 'service_reminder': return <Calendar className="h-4 w-4" />;
      case 'payment_reminder': return <AlertTriangle className="h-4 w-4" />;
      case 'service_due': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'overdue_payment': return 'Overdue Payment';
      case 'service_reminder': return 'Service Reminder';
      case 'payment_reminder': return 'Payment Reminder';
      case 'service_due': return 'Service Due';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Triggers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-6">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Triggers
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="h-8">
                <Plus className="h-4 w-4 mr-2" />
                Add Trigger
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingTrigger ? 'Edit Trigger' : 'Create New Trigger'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Trigger Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Payment Overdue Alert"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trigger_type">Trigger Type</Label>
                    <Select
                      value={formData.trigger_type}
                      onValueChange={(value: any) => setFormData({ ...formData, trigger_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                        <SelectItem value="overdue_payment">Overdue Payment</SelectItem>
                        <SelectItem value="service_reminder">Service Reminder</SelectItem>
                        <SelectItem value="service_due">Service Due</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(formData.trigger_type === 'service_reminder' || formData.trigger_type === 'payment_reminder') && (
                  <div className="space-y-2">
                    <Label htmlFor="days_before">Days Before (Reminder)</Label>
                    <Input
                      id="days_before"
                      type="number"
                      value={formData.conditions.days_before || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        conditions: { ...formData.conditions, days_before: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="e.g., 1 (send 1 day before due date)"
                    />
                  </div>
                )}

                {formData.trigger_type === 'overdue_payment' && (
                  <div className="space-y-2">
                    <Label htmlFor="days_after">Days After (Overdue)</Label>
                    <Input
                      id="days_after"
                      type="number"
                      value={formData.conditions.days_after || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        conditions: { ...formData.conditions, days_after: parseInt(e.target.value) || 0 }
                      })}
                      placeholder="e.g., 3 (send 3 days after due date)"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message_template">Message Template</Label>
                  <textarea
                    id="message_template"
                    className="w-full min-h-20 px-3 py-2 border border-input rounded-md bg-background text-sm"
                    value={formData.message_template}
                    onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                    placeholder="Hello {customer_name}, this is a reminder about your {service_type} service..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Available variables: {'{customer_name}'}, {'{service_type}'}, {'{amount}'}, {'{due_date}'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTrigger ? 'Update' : 'Create'} Trigger
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {triggers.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notification triggers configured</p>
            <p className="text-sm text-muted-foreground">Create triggers to automate customer notifications</p>
          </div>
        ) : (
          <div className="space-y-4">
            {triggers.map((trigger) => (
              <div key={trigger.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  {getTriggerIcon(trigger.trigger_type)}
                  <div>
                    <h3 className="font-medium">{trigger.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{getTriggerTypeLabel(trigger.trigger_type)}</Badge>
                      {trigger.conditions.days_before && (
                        <Badge variant="secondary">{trigger.conditions.days_before} days before</Badge>
                      )}
                      {trigger.conditions.days_after && (
                        <Badge variant="secondary">{trigger.conditions.days_after} days after</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={trigger.is_active}
                    onCheckedChange={(checked) => toggleTrigger(trigger.id!, checked)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(trigger)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteTrigger(trigger.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}