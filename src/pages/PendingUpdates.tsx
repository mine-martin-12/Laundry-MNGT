import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "@/components/ui/use-toast";
import { ArrowLeft, RefreshCw } from "lucide-react";
import PendingUpdateCard from "@/components/PendingUpdateCard";

interface PendingUpdate {
  id: string;
  table_name: string;
  record_id: string;
  user_id: string;
  business_id: string;
  old_values: any;
  new_values: any;
  status: "pending" | "approved" | "sent_back_for_review" | "rejected";
  reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

const PendingUpdates = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [updates, setUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchUpdates();
  }, [user, navigate]);

  const fetchUpdates = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      let query = supabase
        .from("pending_updates")
        .select("*")
        .order("created_at", { ascending: false });

      // If user is not admin, only show their own updates
      if (userProfile.role !== "admin") {
        query = query.eq("user_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error("Error fetching updates:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending updates.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUpdates = (status?: string) => {
    if (!status || status === "all") return updates;
    return updates.filter((update) => update.status === status);
  };

  const getStatusCount = (status: string) => {
    return updates.filter((update) => update.status === status).length;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {userProfile?.role === "admin"
              ? "Manage Updates"
              : "My Update Requests"}
          </h1>
          <p className="text-muted-foreground">
            {userProfile?.role === "admin"
              ? "Review and approve pending updates from users"
              : "Track the status of your update requests"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUpdates}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All
            <Badge variant="outline" className="ml-2">
              {updates.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            <Badge variant="outline" className="ml-2">
              {getStatusCount("pending")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved
            <Badge variant="outline" className="ml-2">
              {getStatusCount("approved")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sent_back_for_review">
            Sent Back
            <Badge variant="outline" className="ml-2">
              {getStatusCount("sent_back_for_review")}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected
            <Badge variant="outline" className="ml-2">
              {getStatusCount("rejected")}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {getFilteredUpdates().length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <p className="text-muted-foreground">
                    No update requests found.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredUpdates().map((update) => (
                <PendingUpdateCard
                  key={update.id}
                  update={update}
                  onStatusChange={fetchUpdates}
                  showActions={userProfile?.role === "admin"}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="mt-6">
          <div className="space-y-4">
            {getFilteredUpdates("pending").length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <p className="text-muted-foreground">No pending updates.</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredUpdates("pending").map((update) => (
                <PendingUpdateCard
                  key={update.id}
                  update={update}
                  onStatusChange={fetchUpdates}
                  showActions={userProfile?.role === "admin"}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="space-y-4">
            {getFilteredUpdates("approved").length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <p className="text-muted-foreground">No approved updates.</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredUpdates("approved").map((update) => (
                <PendingUpdateCard
                  key={update.id}
                  update={update}
                  onStatusChange={fetchUpdates}
                  showActions={false}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="sent_back_for_review" className="mt-6">
          <div className="space-y-4">
            {getFilteredUpdates("sent_back_for_review").length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <p className="text-muted-foreground">
                    No updates sent back for review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              getFilteredUpdates("sent_back_for_review").map((update) => (
                <PendingUpdateCard
                  key={update.id}
                  update={update}
                  onStatusChange={fetchUpdates}
                  showActions={false}
                />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="space-y-4">
            {getFilteredUpdates("rejected").length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                  <p className="text-muted-foreground">No rejected updates.</p>
                </CardContent>
              </Card>
            ) : (
              getFilteredUpdates("rejected").map((update) => (
                <PendingUpdateCard
                  key={update.id}
                  update={update}
                  onStatusChange={fetchUpdates}
                  showActions={false}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PendingUpdates;
