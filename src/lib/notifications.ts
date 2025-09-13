import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CreateNotificationParams {
  userId: string;
  businessId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export const createNotification = async ({
  userId,
  businessId,
  type,
  title,
  message,
  data = {}
}: CreateNotificationParams) => {
  try {
    const { data: notification, error } = await supabase.rpc(
      'create_app_notification',
      {
        p_user_id: userId,
        p_business_id: businessId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_data: data
      }
    );

    if (error) throw error;

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    toast.error('Failed to create notification');
    return null;
  }
};

// Notification creation helpers for different scenarios
export const notifyAdminOfNewRequest = async (
  adminUserId: string,
  businessId: string,
  requestData: {
    tableName: string;
    recordId: string;
    requestedBy: string;
  }
) => {
  const { requestedBy, tableName } = requestData;
  const title = `New ${tableName} update request`;
  const message = `${requestedBy} has requested changes to a ${tableName} record. Please review and approve or reject.`;

  return createNotification({
    userId: adminUserId,
    businessId,
    type: 'new_update_request',
    title,
    message,
    data: requestData
  });
};

export const notifyUserOfStatusChange = async (
  userId: string,
  businessId: string,
  statusData: {
    status: string;
    tableName: string;
    recordId: string;
    reason?: string;
  }
) => {
  const { status, tableName, reason } = statusData;
  
  let title = '';
  let message = '';
  let type = '';

  switch (status) {
    case 'approved':
      title = `Update request approved`;
      message = `Your ${tableName} update request has been approved and applied.`;
      type = 'update_approved';
      break;
    case 'rejected':
      title = `Update request rejected`;
      message = `Your ${tableName} update request has been rejected.${reason ? ` Reason: ${reason}` : ''}`;
      type = 'update_rejected';
      break;
    case 'sent_back':
      title = `Update request needs review`;
      message = `Your ${tableName} update request has been sent back for review.${reason ? ` Reason: ${reason}` : ''}`;
      type = 'update_sent_back';
      break;
    default:
      return null;
  }

  return createNotification({
    userId,
    businessId,
    type,
    title,
    message,
    data: statusData
  });
};

export const getPendingUpdatesCount = async (businessId: string) => {
  try {
    const { count, error } = await supabase
      .from('pending_updates')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .eq('status', 'pending');

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting pending updates count:', error);
    return 0;
  }
};