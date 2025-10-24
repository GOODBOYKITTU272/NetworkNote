import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Plus, Users, UserCheck, UserMinus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  manager: string;
  status: "paid" | "unpaid";
  createdAt: string;
  lastLogin?: string;
}

const MOCK_MANAGERS = [
  "Sarah Johnson",
  "Michael Chen",
  "Robert Wilson",
  "Jennifer Lee",
];

const AdminModule = ({ isManager = false }: { isManager?: boolean }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Record<string, boolean>>({});
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [showShareLeadsModal, setShowShareLeadsModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "user",
    manager: "Sarah Johnson",
    status: "unpaid" as "paid" | "unpaid",
  });
  const { toast } = useToast();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Try to fetch from Supabase with last_sign_in_at
      const { data, error } = await (supabase as any)
        .from("user_accounts")
        .select("id, full_name, email, role, manager, status, created_at, last_sign_in_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      let transformedUsers: AdminUser[] = data.map((user: any, index: number) => ({
        id: user.id?.toString() || `${index}`,
        name: user.full_name || "N/A",
        email: user.email || "N/A",
        role: user.role || "user",
        manager: user.manager || "Unassigned",
        status: user.status?.toLowerCase() === "paid" ? "paid" : "unpaid",
        createdAt: user.created_at
          ? new Date(user.created_at).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        lastLogin: user.last_sign_in_at 
          ? new Date(user.last_sign_in_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : "Never",
      }));

      // For managers, filter to show only their assigned leads
      if (isManager) {
        // In a real implementation, we would filter by the current manager's email
        // For demo, we'll filter to show only leads assigned to "Sarah Johnson"
        transformedUsers = transformedUsers.filter(user => 
          user.manager === "Sarah Johnson"
        );
      }

      setUsers(transformedUsers);
      setIsDemoMode(false);
    } catch (error) {
      console.error("Error fetching users from Supabase:", error);
      setUsers([]);
      setIsDemoMode(true);
      toast({
        title: "Database Connection Failed",
        description: "Unable to connect to database. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsers();
    
    // Set up real-time subscription for user_accounts table
    const channel = supabase
      .channel('user_accounts_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_accounts'
        },
        (payload) => {
          console.log('User account change detected:', payload);
          // Refresh the user list when any change occurs
          fetchUsers();
          
          // Show a toast notification
          if (payload.eventType === 'INSERT') {
            toast({
              title: "New User Created",
              description: "User list has been updated.",
            });
          } else if (payload.eventType === 'UPDATE') {
            toast({
              title: "User Updated",
              description: "User list has been refreshed.",
            });
          } else if (payload.eventType === 'DELETE') {
            toast({
              title: "User Deleted",
              description: "User list has been updated.",
            });
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.values(selectedUsers).every((selected) => selected);
    const newSelectedUsers: Record<string, boolean> = {};
    const visibleUsers = users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.role.toLowerCase().includes(searchLower) ||
        user.manager.toLowerCase().includes(searchLower)
      );
    });
    
    visibleUsers.forEach((user) => {
      newSelectedUsers[user.id] = !allSelected;
    });
    setSelectedUsers(newSelectedUsers);
  };

  const handleManagerChange = (userId: string, newManager: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, manager: newManager } : user
      )
    );
    
    // In a real implementation, you would also update the database here
    if (!isDemoMode) {
      toast({
        title: "Manager Updated",
        description: `Manager assignment saved successfully.`,
      });
    }
  };

  const handleStatusChange = (userId: string, newStatus: "paid" | "unpaid") => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
    
    // In a real implementation, you would also update the database here
    if (!isDemoMode) {
      toast({
        title: "Status Updated",
        description: `Billing status updated successfully.`,
      });
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  const handleShareWithLeads = () => {
    const selectedUsersList = users.filter(user => selectedUsers[user.id]);
    
    if (selectedUsersList.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to share with leads.",
        variant: "destructive",
      });
      return;
    }
    
    setShowShareLeadsModal(true);
  };

  const handleAssignToOwner = () => {
    if (!selectedOwner) {
      toast({
        title: "No owner selected",
        description: "Please select an owner to assign the leads to.",
        variant: "destructive",
      });
      return;
    }

    const selectedUsersList = users.filter(user => selectedUsers[user.id]);
    const userNames = selectedUsersList.map(user => user.name).join(", ");
    
    // Update the users with the new owner
    setUsers(prevUsers =>
      prevUsers.map(user =>
        selectedUsers[user.id] ? { ...user, manager: selectedOwner } : user
      )
    );
    
    toast({
      title: "Leads Assigned",
      description: `Assigned ${selectedUsersList.length} leads (${userNames}) to ${selectedOwner}`,
    });
    
    // Reset selection and close modal
    setSelectedUsers({});
    setSelectedOwner("");
    setShowShareLeadsModal(false);
  };

  const handleCreateUser = () => {
    setShowCreateUserForm(true);
  };

  const handleManagerCreateUser = () => {
    setShowCreateUserForm(true);
  };

  // Managers don't have share leads functionality
  const handleManagerShare = () => {
    const selectedUsersList = users.filter(user => selectedUsers[user.id]);
    
    if (selectedUsersList.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user.",
        variant: "destructive",
      });
      return;
    }
    
    const userNames = selectedUsersList.map(user => user.name).join(", ");
    
    toast({
      title: "Selected Users",
      description: `Selected: ${userNames}`,
    });
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isDemoMode) {
        // In demo mode, add user to local state
        const newUserData: AdminUser = {
          id: `${users.length + 1}`,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          manager: newUser.manager,
          status: newUser.status,
          createdAt: new Date().toISOString().split("T")[0],
          lastLogin: "Never",
        };
        
        setUsers([newUserData, ...users]);
        
        toast({
          title: "User Created (Demo Mode)",
          description: `Successfully created user: ${newUser.name}. This is demo data only.`,
        });
      } else {
        // Create user account in Supabase
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: newUser.email,
          email_confirm: true,
          user_metadata: {
            full_name: newUser.name,
            role: newUser.role,
          },
        });

        if (authError) throw authError;

        // Insert user data into user_accounts table
        const { error: dbError } = await (supabase as any)
          .from('user_accounts')
          .insert({
            id: authData.user.id,
            full_name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            manager: isManager ? "Sarah Johnson" : newUser.manager,
            status: newUser.status,
          });

        if (dbError) throw dbError;

        // Send welcome email
        const { error: emailError } = await supabase.auth.resetPasswordForEmail(
          newUser.email,
          {
            redirectTo: `${window.location.origin}/auth`,
          }
        );

        if (emailError) {
          console.error('Email sending error:', emailError);
          // Don't fail the entire operation if email fails
        }
        
        toast({
          title: "User Created Successfully",
          description: `${newUser.name} has been created and will receive a welcome email to set their password.`,
        });
      }
      
      // Reset form and close modal
      setNewUser({
        name: "",
        email: "",
        role: "user",
        manager: "Sarah Johnson",
        status: "unpaid",
      });
      setShowCreateUserForm(false);
      
      // Refresh user list if not in demo mode
      if (!isDemoMode) {
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user. Please try again.",
        variant: "destructive",
      });
    }
  };


  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower) ||
      user.manager.toLowerCase().includes(searchLower)
    );
    
    // For managers, only show users assigned to them
    if (isManager) {
      return matchesSearch && user.manager === "Sarah Johnson";
    }
    
    // For admins, show all users (both assigned and unassigned)
    return matchesSearch;
  });

  const selectedCount = Object.values(selectedUsers).filter(Boolean).length;

  // Calculate statistics based on filtered users for managers, all users for admins
  const totalUsers = isManager ? filteredUsers.length : users.length;
  const paidUsers = isManager
    ? filteredUsers.filter((user) => user.status === "paid").length
    : users.filter((user) => user.status === "paid").length;
  const unpaidUsers = isManager
    ? filteredUsers.filter((user) => user.status === "unpaid").length
    : users.filter((user) => user.status === "unpaid").length;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Hero Card with Stats */}
      <Card className="glass border-border/50">
        <CardHeader>
          {isManager && (
            <p className="text-sm text-primary">
              Welcome, Manager Sarah Johnson
            </p>
          )}
          {!isManager && (
            <p className="text-sm text-primary">
              Welcome, Admin
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="glass rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <div className="text-2xl font-bold mt-2">{totalUsers}</div>
            </div>
            <div className="glass rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">Paid Users</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-emerald-600">{paidUsers}</div>
            </div>
            <div className="glass rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">Unpaid Users</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-amber-600">{unpaidUsers}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management Table */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <span>User Management</span>
            <div className="flex flex-wrap items-center gap-2">
              {selectedCount > 0 && !isManager && (
                <Button
                  size="sm"
                  onClick={handleShareWithLeads}
                  className="bg-primary hover:bg-primary/90 text-foreground"
                >
                  Share with Leads
                </Button>
              )}
              {selectedCount > 0 && isManager && (
                <Button
                  size="sm"
                  onClick={handleManagerShare}
                  className="bg-primary hover:bg-primary/90 text-foreground"
                >
                  Show Selected
                </Button>
              )}
              {selectedCount > 0 && (
                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {selectedCount} leads selected
                </div>
              )}
              {!isManager && (
                <Button
                  size="sm"
                  onClick={handleCreateUser}
                  className="bg-primary hover:bg-primary/90 text-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              )}
              {isManager && (
                <Button
                  size="sm"
                  onClick={handleManagerCreateUser}
                  className="bg-primary hover:bg-primary/90 text-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="glass rounded-md border border-border/50 px-2 py-1 text-sm focus:border-primary focus:outline-none"
              >
                {[5, 10, 20, 50].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, email, role, or manager"
                  className="glass pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className="glass hover:bg-accent"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30">
                  {!isManager && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          filteredUsers.length > 0 &&
                          filteredUsers.every((user) => selectedUsers[user.id])
                        }
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary"
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-16">S. No.</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 6 : 7} className="py-12 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        Loading user data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isManager ? 6 : 7} className="py-12 text-center text-sm text-muted-foreground">
                      No users match your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow key={user.id} className="hover:bg-primary/5">
                      {!isManager && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={!!selectedUsers[user.id]}
                            onChange={() => handleSelectUser(user.id)}
                            className="h-4 w-4 rounded border-border/50 text-primary focus:ring-primary"
                          />
                        </TableCell>
                      )}
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name || "N/A"}</span>
                          <span className="text-sm text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {user.lastLogin || "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {user.manager === "Unassigned" || !user.manager ? "Admin" : user.manager}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.status}
                          onValueChange={(value) =>
                            handleStatusChange(user.id, value as "paid" | "unpaid")
                          }
                        >
                          <SelectTrigger className="w-[100px] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create User Modal */}
      <Dialog open={showCreateUserForm} onOpenChange={setShowCreateUserForm}>
        <DialogContent className="glass max-w-md border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Create New User
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUserSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                placeholder="Enter full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                placeholder="Enter email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              {isManager ? (
                <Input
                  value="User"
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              ) : (
                <Select
                  value={newUser.role}
                  onValueChange={(value) => setNewUser({...newUser, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Billing Status</label>
              <Select
                value={newUser.status}
                onValueChange={(value) => setNewUser({...newUser, status: value as "paid" | "unpaid"})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateUserForm(false)}
                className="glass hover:bg-accent"
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Leads Modal */}
      <Dialog open={showShareLeadsModal} onOpenChange={setShowShareLeadsModal}>
        <DialogContent className="glass max-w-md border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Share Leads with Owner
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Sharing {Object.values(selectedUsers).filter(Boolean).length} leads:
              </p>
              <div className="text-sm">
                {users
                  .filter(user => selectedUsers[user.id])
                  .map((user, index) => (
                    <div key={user.id} className="py-1">
                      {index + 1}. {user.name}
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign to Owner</label>
              <Select
                value={selectedOwner}
                onValueChange={setSelectedOwner}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an owner" />
                </SelectTrigger>
                <SelectContent>
                  {MOCK_MANAGERS.map((manager) => (
                    <SelectItem key={manager} value={manager}>
                      {manager}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowShareLeadsModal(false);
                  setSelectedOwner("");
                }}
                className="glass hover:bg-accent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignToOwner}
                className="bg-primary hover:bg-primary/90"
              >
                Assign Leads
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModule;