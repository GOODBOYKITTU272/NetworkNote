import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import LinkedInModule from "@/components/modules/LinkedInModule";
import ColdEmailModule from "@/components/modules/ColdEmailModule";
import HRMailModule from "@/components/modules/HRMailModule";
import AdminModule from "@/components/modules/AdminModule";

type TabType = "linkedin" | "cold-email" | "hr-mail" | "admin";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("linkedin");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [overrideAdmin, setOverrideAdmin] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const navigate = useNavigate();

  const adminEmails = useMemo(() => {
    const raw = import.meta.env.VITE_ADMIN_EMAILS as string | undefined;
    return raw
      ? raw
          .split(",")
          .map((email) => email.trim().toLowerCase())
          .filter(Boolean)
      : [];
  }, []);

  const evaluateAdmin = useCallback((currentUser: User | null) => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase() ?? "";
    const metadataRole =
      (currentUser.user_metadata?.role ??
        currentUser.user_metadata?.Role ??
        currentUser.app_metadata?.role ??
        currentUser.app_metadata?.Role) ?? "";

    return (
      (typeof metadataRole === "string" &&
        metadataRole.toLowerCase() === "admin") ||
      (!!email && adminEmails.includes(email))
    );
  }, [adminEmails]);

  const evaluateManager = useCallback((currentUser: User | null) => {
    if (!currentUser) return false;
    const email = currentUser.email?.toLowerCase() ?? "";
    const metadataRole =
      (currentUser.user_metadata?.role ??
        currentUser.user_metadata?.Role ??
        currentUser.app_metadata?.role ??
        currentUser.app_metadata?.Role) ?? "";

    return (
      (typeof metadataRole === "string" &&
        metadataRole.toLowerCase() === "manager") ||
      email === "manager@example.com"
    );
  }, []);

  useEffect(() => {
    const overrideEmail = localStorage.getItem("admin_override_email");
    const managerOverrideEmail = localStorage.getItem("manager_override_email");

    if (overrideEmail) {
      setOverrideAdmin(true);
      setIsAdmin(true);
      setActiveTab("admin");
      setInitComplete(true);
      return;
    }
    
    if (managerOverrideEmail) {
      setIsManager(true);
      setInitComplete(true);
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user);
          const isUserAdmin = evaluateAdmin(session.user);
          const isUserManager = evaluateManager(session.user);
          setIsAdmin(isUserAdmin);
          setIsManager(isUserManager);
          if (isUserAdmin) {
            setActiveTab("admin");
          }
        } else {
          navigate("/auth");
        }
        setInitComplete(true);
      })
      .catch(() => {
        setInitComplete(true);
        navigate("/auth");
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsAdmin(evaluateAdmin(session.user));
        setIsManager(evaluateManager(session.user));
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [evaluateAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin && activeTab === "admin") {
      setActiveTab("linkedin");
    }
  }, [activeTab, isAdmin]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsManager(false);
    setOverrideAdmin(false);
    localStorage.removeItem("admin_override_email");
    localStorage.removeItem("manager_override_email");
    navigate("/auth");
  };

  if (!initComplete) {
    return null;
  }

  if (!user && !overrideAdmin && !isManager) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <header className="glass border-b border-border/50 sticky top-0 z-50 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NetworkNote
            </h1>
            
            <nav className="flex items-center gap-2">
              {!isAdmin && !isManager && (
                <>
                  <Button
                    variant={activeTab === "linkedin" ? "default" : "ghost"}
                    onClick={() => setActiveTab("linkedin")}
                    className={activeTab === "linkedin" ? "bg-primary text-foreground" : ""}
                  >
                    LinkedIn Networking
                  </Button>
                  <Button
                    variant={activeTab === "cold-email" ? "default" : "ghost"}
                    onClick={() => setActiveTab("cold-email")}
                    className={activeTab === "cold-email" ? "bg-primary text-foreground" : ""}
                  >
                    Cold Emailing
                  </Button>
                  <Button
                    variant={activeTab === "hr-mail" ? "default" : "ghost"}
                    onClick={() => setActiveTab("hr-mail")}
                    className={activeTab === "hr-mail" ? "bg-primary text-foreground" : ""}
                  >
                    HR Mail IDs
                  </Button>
                </>
              )}
            </nav>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="hover:bg-accent"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="animate-fade-in">
          {isAdmin || isManager ? (
            <AdminModule isManager={isManager && !isAdmin} />
          ) : (
            <>
              {activeTab === "linkedin" && <LinkedInModule />}
              {activeTab === "cold-email" && <ColdEmailModule />}
              {activeTab === "hr-mail" && <HRMailModule />}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
