import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  notifyAdminOfNewRequest 
} from "@/lib/notifications";

export interface CreatePendingUpdateParams {
  tableName: string;
  recordId: string;
  oldValues: any;
  newValues: any;
  userId?: string;
  businessId?: string;
  userReason?: string;
}

export const createPendingUpdate = async ({
  tableName,
  recordId,
  oldValues,
  newValues,
  userId,
  businessId,
  userReason,
}: CreatePendingUpdateParams) => {
  try {
    // Get current user if not provided
    if (!userId || !businessId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("business_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      userId = user.id;
      businessId = profile.business_id;
    }

    const { data, error } = await supabase
      .from("pending_updates")
      .insert({
        table_name: tableName,
        record_id: recordId,
        user_id: userId,
        business_id: businessId,
        old_values: oldValues,
        new_values: newValues,
        user_reason: userReason,
        status: "pending"
      })
      .select()
      .single();

    if (error) throw error;

    // Get user profile for notification
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .single();

    // Get admin users to notify
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('user_id, first_name, last_name')
      .eq('business_id', businessId)
      .eq('role', 'admin');

    // Create notifications for all admins
    if (adminProfiles && userProfile) {
      const requestedBy = `${userProfile.first_name} ${userProfile.last_name}`.trim();
      
      for (const admin of adminProfiles) {
        await notifyAdminOfNewRequest(
          admin.user_id,
          businessId,
          {
            tableName,
            recordId,
            requestedBy
          }
        );
      }
    }

    toast.success("Update request submitted for approval");

    return { data, error: null };
  } catch (error: any) {
    console.error("Error creating pending update:", error);
    toast.error(error.message || "Failed to submit update request.");
    return { data: null, error };
  }
};

export const getPendingUpdatesCount = async (businessId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("pending_updates")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending");

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error fetching pending updates count:", error);
    return 0;
  }
};