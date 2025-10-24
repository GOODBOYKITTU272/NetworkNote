import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 animate-fade-up">
        <h1 className="text-5xl font-semibold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          NetworkNote
        </h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Generate LinkedIn notes, cold emails, and discover HR contacts—all in one beautiful dashboard
        </p>
        <Button
          onClick={() => navigate("/auth")}
          className="bg-primary hover:bg-primary/90 text-foreground px-8 py-6 text-lg hover-scale"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
