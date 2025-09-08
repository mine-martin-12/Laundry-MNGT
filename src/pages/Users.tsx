import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Users as UsersIcon,
  Trash2,
  Shield,
  User,
  Edit,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  role: "admin" | "user";
  created_at: string;
}

const Users = () => {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user && !loading) {
      navigate("/auth");
    }
    if (userProfile && userProfile.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [user, userProfile, loading, navigate]);

  useEffect(() => {
    if (userProfile?.business_id && userProfile?.role === "admin") {
      fetchUsers();
    }
  }, [userProfile?.business_id, userProfile?.role]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("business_id", userProfile.business_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter((user) =>
        `${user.first_name || ""} ${user.last_name || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const deleteUser = async (userId: string, profileId: string) => {
    try {
      // First delete the profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (profileError) throw profileError;

      // Then delete the auth user (this might fail if we don't have permission, which is okay)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(
          userId
        );
        if (authError) {
          console.warn("Could not delete auth user:", authError);
        }
      } catch (authError) {
        console.warn("Could not delete auth user:", authError);
      }

      await fetchUsers();
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    }
  };

  if (loading || !user || userProfile?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner variant="tetris" size="lg" />
        <p className="text-muted-foreground">Loading your users...</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              User Management
            </h1>
            <p className="text-muted-foreground">
              Manage your team members and their access
            </p>
          </div>
          <div className="flex gap-4">
            <Link to="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Link to="/users/new">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Team Overview</h3>
                <p className="text-muted-foreground">
                  {filteredUsers.length} team member
                  {filteredUsers.length !== 1 ? "s" : ""}
                  {searchTerm && ` matching "${searchTerm}"`}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {filteredUsers.filter((u) => u.role === "admin").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-muted-foreground">
                    {filteredUsers.filter((u) => u.role === "user").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Users</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        {loadingUsers ? (
          <div className="text-center py-8">
            <LoadingSpinner variant="tetris" size="md" />
            <p className="text-muted-foreground">Loading your users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid gap-4">
            {filteredUsers.map((userItem) => (
              <Card key={userItem.id} className="shadow-medium">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {userItem.role === "admin" ? (
                          <Shield className="h-6 w-6 text-primary" />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {userItem.first_name && userItem.last_name
                            ? `${userItem.first_name} ${userItem.last_name}`
                            : "No name provided"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          User ID: {userItem.user_id}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Joined:{" "}
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          userItem.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {userItem.role === "admin" ? "Admin" : "User"}
                      </Badge>
                      <div className="flex gap-2">
                        <Link to={`/users/edit/${userItem.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {userItem.user_id !== user.id && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this user?
                                  This action cannot be undone. The user will
                                  lose access to the system immediately.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteUser(userItem.user_id, userItem.id)
                                  }
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Get started by adding your first team member"}
              </p>
              <Link to="/users/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First User
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Users;
