import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface UserFormData {
  first_name: string;
  last_name: string;
  role: 'admin' | 'user';
}

const EditUser = () => {
  const { user, userProfile, loading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<UserFormData>({
    first_name: '',
    last_name: '',
    role: 'user'
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
      return;
    }
    
    if (userProfile && userProfile.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [user, loading, userProfile, navigate]);

  useEffect(() => {
    if (userProfile?.business_id && id) {
      fetchUser();
    }
  }, [userProfile?.business_id, id]);

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('business_id', userProfile.business_id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          role: data.role
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      toast.error('Failed to load user data');
      navigate('/users');
    } finally {
      setLoadingUser(false);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
        })
        .eq('id', id)
        .eq('business_id', userProfile.business_id);

      if (error) throw error;

      toast.success('User updated successfully!');
      navigate('/users');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || userProfile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
            <p className="text-muted-foreground">Update user information</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value: 'admin' | 'user') => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {submitting ? 'Updating...' : 'Update User'}
                </Button>
                <Link to="/users" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditUser;