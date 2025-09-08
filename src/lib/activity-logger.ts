import { supabase } from "@/integrations/supabase/client";

interface ActivityLogData {
  action_type: 'create' | 'update' | 'delete';
  table_name: 'services' | 'expenses' | 'users' | 'profiles';
  record_id: string;
  old_values?: any;
  new_values?: any;
  reason: string;
  business_id: string;
  user_id: string;
}

export class ActivityLogger {
  static async log(data: ActivityLogData): Promise<void> {
    try {
      const { error } = await supabase
        .from('activity_logs')
        .insert({
          action_type: data.action_type,
          table_name: data.table_name,
          record_id: data.record_id,
          old_values: data.old_values || null,
          new_values: data.new_values || null,
          reason: data.reason,
          business_id: data.business_id,
          user_id: data.user_id,
        });

      if (error) {
        console.error('Failed to log activity:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      // Don't throw here to prevent blocking main operations
    }
  }

  static async logServiceCreate(
    serviceId: string,
    serviceData: any,
    reason: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    await this.log({
      action_type: 'create',
      table_name: 'services',
      record_id: serviceId,
      new_values: serviceData,
      reason,
      business_id: businessId,
      user_id: userId,
    });
  }

  static async logServiceUpdate(
    serviceId: string,
    oldData: any,
    newData: any,
    reason: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    await this.log({
      action_type: 'update',
      table_name: 'services',
      record_id: serviceId,
      old_values: oldData,
      new_values: newData,
      reason,
      business_id: businessId,
      user_id: userId,
    });
  }

  static async logServiceDelete(
    serviceId: string,
    serviceData: any,
    reason: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    await this.log({
      action_type: 'delete',
      table_name: 'services',
      record_id: serviceId,
      old_values: serviceData,
      reason,
      business_id: businessId,
      user_id: userId,
    });
  }

  static async logExpenseCreate(
    expenseId: string,
    expenseData: any,
    reason: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    await this.log({
      action_type: 'create',
      table_name: 'expenses',
      record_id: expenseId,
      new_values: expenseData,
      reason,
      business_id: businessId,
      user_id: userId,
    });
  }

  static async logExpenseUpdate(
    expenseId: string,
    oldData: any,
    newData: any,
    reason: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    await this.log({
      action_type: 'update',
      table_name: 'expenses',
      record_id: expenseId,
      old_values: oldData,
      new_values: newData,
      reason,
      business_id: businessId,
      user_id: userId,
    });
  }

  static async logExpenseDelete(
    expenseId: string,
    expenseData: any,
    reason: string,
    businessId: string,
    userId: string
  ): Promise<void> {
    await this.log({
      action_type: 'delete',
      table_name: 'expenses',
      record_id: expenseId,
      old_values: expenseData,
      reason,
      business_id: businessId,
      user_id: userId,
    });
  }
}