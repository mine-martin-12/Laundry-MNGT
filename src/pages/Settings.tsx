import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, User, Building2, Lock, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Settings = () => {
  const { user, userProfile, loading, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: ''
  });

  const [businessData, setBusinessData] = useState({
    name: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || ''
      });
      fetchBusinessData();
    }
  }, [userProfile]);

  const fetchBusinessData = async () => {
    if (!userProfile?.business_id) return;

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', userProfile.business_id)
        .single();

      if (error) throw error;
      setBusinessData({ name: data.name || '' });
    } catch (error) {
      console.error('Error fetching business data:', error);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBusinessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userProfile?.role !== 'admin') {
      toast.error('Only admins can update business settings');
      return;
    }

    setSavingBusiness(true);

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ name: businessData.name })
        .eq('id', userProfile.business_id);

      if (error) throw error;
      toast.success('Business settings updated successfully!');
    } catch (error) {
      console.error('Error updating business:', error);
      toast.error('Failed to update business settings');
    } finally {
      setSavingBusiness(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResettingPassword(true);

    try {
      const { error } = await resetPassword(user.email!);
      if (error) throw error;
      
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link to="/" className="mr-4">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account and business settings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  {savingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Business Settings */}
        {userProfile?.role === 'admin' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBusinessSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    value={businessData.name}
                    onChange={(e) => setBusinessData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your business name"
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={savingBusiness}>
                    <Save className="h-4 w-4 mr-2" />
                    {savingBusiness ? 'Saving...' : 'Save Business Settings'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To change your password, we'll send you a reset link via email.
              </p>
              <div className="flex justify-start">
                <Button onClick={handlePasswordReset} disabled={resettingPassword} variant="outline">
                  <Lock className="h-4 w-4 mr-2" />
                  {resettingPassword ? 'Sending...' : 'Send Password Reset Email'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Role</Label>
                <p className="text-sm text-muted-foreground capitalize">{userProfile?.role}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;