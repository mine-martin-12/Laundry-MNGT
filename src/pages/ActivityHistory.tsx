import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Calendar, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";

interface ActivityLog {
  id: string;
  action_type: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
  reason: string;
  created_at: string;
  user_id: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
}

const ActivityHistory = () => {
  const { user, userProfile, loading } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTable, setFilterTable] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userProfile?.business_id && userProfile?.role === 'admin') {
      fetchActivityLogs();
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [logs, filterAction, filterTable, searchTerm]);

  const fetchActivityLogs = async () => {
    try {
      setLoadingLogs(true);
      
      // First get activity logs
      const { data: logData, error: logError } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("business_id", userProfile.business_id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (logError) {
        console.error("Error fetching activity logs:", logError);
        toast.error("Failed to load activity logs");
        return;
      }

      // Get unique user IDs
      const userIds = [...new Set(logData?.map(log => log.user_id) || [])];
      
      // Fetch user profiles separately
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      if (profileError) {
        console.error("Error fetching profiles:", profileError);
        // Continue without profile data
      }

      // Merge the data
      const enrichedLogs = (logData || []).map(log => ({
        ...log,
        profile: profileData?.find(p => p.user_id === log.user_id)
      }));

      setLogs(enrichedLogs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast.error("Failed to load activity logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filterAction !== "all") {
      filtered = filtered.filter(log => log.action_type === filterAction);
    }

    if (filterTable !== "all") {
      filtered = filtered.filter(log => log.table_name === filterTable);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.reason.toLowerCase().includes(term) ||
        log.record_id.toLowerCase().includes(term) ||
        (log.profile?.first_name && log.profile.first_name.toLowerCase().includes(term)) ||
        (log.profile?.last_name && log.profile.last_name.toLowerCase().includes(term))
      );
    }

    setFilteredLogs(filtered);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getTableDisplayName = (tableName: string) => {
    switch (tableName) {
      case "services":
        return "Services";
      case "expenses":
        return "Expenses";
      case "profiles":
        return "Users";
      default:
        return tableName;
    }
  };

  const getUserDisplayName = (log: ActivityLog) => {
    if (log.profile?.first_name && log.profile?.last_name) {
      return `${log.profile.first_name} ${log.profile.last_name}`;
    }
    return "Unknown User";
  };

  // Redirect if not authenticated or not admin
  if (!user && !loading) {
    return <Navigate to="/auth" replace />;
  }

  if (userProfile && userProfile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (loading || loadingLogs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner variant="tetris" size="lg" />
          <p className="text-muted-foreground">Loading activity history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity History</h1>
              <p className="text-muted-foreground">
                Track all changes and actions performed by users in your business.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter activity logs by action type, table, or search for specific entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Action Type</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select value={filterTable} onValueChange={setFilterTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tables" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    <SelectItem value="services">Services</SelectItem>
                    <SelectItem value="expenses">Expenses</SelectItem>
                    <SelectItem value="profiles">Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reason, user, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Logs ({filteredLogs.length} entries)</CardTitle>
            <CardDescription>
              Showing the most recent activity across your business.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No activity logs found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div>{format(new Date(log.created_at), "MMM dd, yyyy")}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "HH:mm:ss")}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getUserDisplayName(log)}</TableCell>
                        <TableCell>
                          <Badge variant={getActionBadgeVariant(log.action_type)}>
                            {log.action_type.charAt(0).toUpperCase() + log.action_type.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTableDisplayName(log.table_name)}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {log.record_id.substring(0, 8)}...
                          </code>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={log.reason}>
                            {log.reason}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityHistory;