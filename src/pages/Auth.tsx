import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Auth = () => {
  const { user, signIn, signUp, resetPassword, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    businessName: '',
    role: 'admin'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  // Fetch existing businesses for staff signup
  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('id, name')
        .order('name');
      
      if (data) {
        setBusinesses(data);
      }
    };
    
    fetchBusinesses();
  }, []);

  // Redirect if already authenticated
  if (user && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleSignUp = async (e: React.FormEvent, isAdmin: boolean = true) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare user metadata based on signup type
      const userData = isAdmin 
        ? {
            first_name: formData.firstName,
            last_name: formData.lastName,
            business_name: formData.businessName, // Pass business name for admin signup
            role: 'admin'
          }
        : {
            first_name: formData.firstName,
            last_name: formData.lastName,
            business_id: selectedBusiness, // Pass business ID for staff signup
            role: 'user'
          };

      await signUp(formData.email, formData.password, userData);
    } catch (error) {
      console.error('Signup error:', error);
    }

    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(formData.email, formData.password);
    setIsLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await resetPassword(resetEmail);
    setIsLoading(false);
    setShowPasswordReset(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-3 sm:p-4">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-foreground">WashWise Hub</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Professional laundry business management</p>
        </div>

        {showPasswordReset ? (
          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter your email to receive a password reset link</CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail">Email</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter className="space-y-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send Reset Link
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowPasswordReset(false)}
                >
                  Back to Sign In
                </Button>
              </CardFooter>
            </form>
          </Card>
        ) : (
          <Tabs defaultValue="signin" className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-10">
              <TabsTrigger value="signin" className="text-xs sm:text-sm">Sign In</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs sm:text-sm">New Business</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs sm:text-sm">Join Business</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to your WashWise account</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignIn}>
                  <CardContent className="space-y-4 p-4 sm:p-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="h-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="h-10"
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="space-y-2 p-4 sm:p-6">
                    <Button type="submit" className="w-full h-10" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-10"
                      onClick={() => setShowPasswordReset(true)}
                    >
                      Forgot Password?
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="admin">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Start Your Business
                  </CardTitle>
                  <CardDescription>Create your laundry business account</CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleSignUp(e, true)}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        placeholder="Sparkle Clean Laundry"
                        value={formData.businessName}
                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminEmail">Email</Label>
                      <Input
                        id="adminEmail"
                        type="email"
                        placeholder="owner@business.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminPassword">Password</Label>
                      <Input
                        id="adminPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="adminConfirmPassword">Confirm Password</Label>
                      <Input
                        id="adminConfirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Business Account
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="staff">
              <Card className="shadow-medium">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Join Your Team
                  </CardTitle>
                  <CardDescription>Create an account to join an existing business</CardDescription>
                </CardHeader>
                <form onSubmit={(e) => handleSignUp(e, false)}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="business">Select Business</Label>
                      <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your business" />
                        </SelectTrigger>
                        <SelectContent>
                          {businesses.map((business) => (
                            <SelectItem key={business.id} value={business.id}>
                              {business.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="staffFirstName">First Name</Label>
                        <Input
                          id="staffFirstName"
                          placeholder="Jane"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="staffLastName">Last Name</Label>
                        <Input
                          id="staffLastName"
                          placeholder="Smith"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffEmail">Email</Label>
                      <Input
                        id="staffEmail"
                        type="email"
                        placeholder="jane@business.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffPassword">Password</Label>
                      <Input
                        id="staffPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staffConfirmPassword">Confirm Password</Label>
                      <Input
                        id="staffConfirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" className="w-full" disabled={isLoading || !selectedBusiness}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Join Business
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Secure • Professional • Reliable</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;