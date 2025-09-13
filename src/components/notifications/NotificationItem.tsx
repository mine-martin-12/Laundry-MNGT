import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  FileText,
  DollarSign,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read_at: string | null;
    created_at: string;
  };
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'update_approved':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'update_rejected':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'update_sent_back':
      return <AlertCircle className="w-4 h-4 text-orange-500" />;
    case 'new_update_request':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'service_update':
      return <FileText className="w-4 h-4 text-blue-500" />;
    case 'expense_update':
      return <DollarSign className="w-4 h-4 text-green-500" />;
    case 'profile_update':
      return <User className="w-4 h-4 text-purple-500" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const getNotificationBadge = (type: string) => {
  switch (type) {
    case 'update_approved':
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Approved</Badge>;
    case 'update_rejected':
      return <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">Rejected</Badge>;
    case 'update_sent_back':
      return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Review Needed</Badge>;
    case 'new_update_request':
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">New Request</Badge>;
    default:
      return null;
  }
};

export const NotificationItem = ({ notification, onClose }: NotificationItemProps) => {
  const { markAsRead } = useNotifications();
  const isUnread = !notification.read_at;

  const handleClick = async () => {
    if (isUnread) {
      await markAsRead(notification.id);
    }
    onClose();
  };

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full p-3 h-auto flex items-start gap-3 text-left justify-start hover:bg-muted/50",
        isUnread && "bg-muted/30"
      )}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-sm leading-tight",
            isUnread ? "font-medium text-foreground" : "text-muted-foreground"
          )}>
            {notification.title}
          </p>
          {isUnread && (
            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
          )}
        </div>
        
        <p className="text-xs text-muted-foreground leading-tight line-clamp-2">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
          {getNotificationBadge(notification.type)}
        </div>
      </div>
    </Button>
  );
};