import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Archive, Trash2 } from "lucide-react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { useNotifications } from "@/contexts/NotificationContext";
import { formatDistanceToNow } from "date-fns";

interface NotificationHistoryItem {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
}

const NotificationHistory = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { notifications: currentNotifications } = useNotifications();
  const [historyNotifications, setHistoryNotifications] = useState<NotificationHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && userProfile?.business_id) {
      fetchNotificationHistory();
    }
  }, [user, userProfile?.business_id]);

  const fetchNotificationHistory = async () => {
    try {
      setLoadingHistory(true);
      
      // Fetch from notification_history table
      const { data: historyData, error: historyError } = await supabase
        .from("notification_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_id", userProfile.business_id)
        .order("created_at", { ascending: false });

      if (historyError) throw historyError;

      setHistoryNotifications(historyData || []);
    } catch (error) {
      console.error("Error fetching notification history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleArchiveNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notification_history")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      
      setHistoryNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, archived_at: new Date().toISOString() } : notif
        )
      );
    } catch (error) {
      console.error("Error archiving notification:", error);
    }
  };

  // Combine current notifications with history
  const allNotifications = [
    ...currentNotifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      read_at: n.read_at,
      archived_at: null,
      created_at: n.created_at,
      isFromHistory: false,
    })),
    ...historyNotifications.map(n => ({
      ...n,
      isFromHistory: true,
    }))
  ];

  const filteredNotifications = allNotifications.filter(notification => {
    if (filter === 'unread') return !notification.read_at;
    if (filter === 'archived') return notification.archived_at;
    if (filter === 'all') return !notification.archived_at;
    return true;
  });

  if (loading || loadingHistory) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading notifications...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notification History</h1>
            <p className="text-muted-foreground">View all your notifications and activity</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Notifications</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
                <Button
                  variant={filter === 'archived' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('archived')}
                >
                  Archived
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] w-full">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No notifications found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className="flex items-start justify-between p-4 rounded-lg border hover:bg-accent/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            {!notification.read_at && (
                              <Badge variant="default" className="text-xs">
                                Unread
                              </Badge>
                            )}
                            {notification.archived_at && (
                              <Badge variant="secondary" className="text-xs">
                                <Archive className="w-3 h-3 mr-1" />
                                Archived
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-medium text-foreground mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {!notification.archived_at && notification.isFromHistory && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleArchiveNotification(notification.id)}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {index < filteredNotifications.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationHistory;