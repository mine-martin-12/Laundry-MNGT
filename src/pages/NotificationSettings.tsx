import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Settings } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { toast } from "sonner";

const NotificationSettings = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { markAllAsRead } = useNotifications();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    updateNotifications: true,
    systemNotifications: true,
    marketingNotifications: false,
  });

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSettingChange = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    // Here you would typically save to backend
    toast.success("Settings updated successfully");
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    toast.success("All notifications marked as read");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/notifications">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notification Settings</h1>
            <p className="text-muted-foreground">Manage your notification preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={handleMarkAllAsRead} className="w-full">
                  Mark All Notifications as Read
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="update-notifications">Update Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications about update requests and approvals
                    </p>
                  </div>
                  <Switch
                    id="update-notifications"
                    checked={settings.updateNotifications}
                    onCheckedChange={() => handleSettingChange('updateNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="system-notifications">System Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Important system messages and alerts
                    </p>
                  </div>
                  <Switch
                    id="system-notifications"
                    checked={settings.systemNotifications}
                    onCheckedChange={() => handleSettingChange('systemNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onCheckedChange={() => handleSettingChange('emailNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push-notifications">Browser Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications in your browser
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={settings.pushNotifications}
                    onCheckedChange={() => handleSettingChange('pushNotifications')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="marketing-notifications">Marketing Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Tips, feature updates, and promotional content
                    </p>
                  </div>
                  <Switch
                    id="marketing-notifications"
                    checked={settings.marketingNotifications}
                    onCheckedChange={() => handleSettingChange('marketingNotifications')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;