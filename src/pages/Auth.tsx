import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

const authSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Special case for admin login
      if (email === "admin@example.com" && password === "AdminPass123!") {
        // Create a mock admin user session
        localStorage.setItem("admin_override_email", email);
        toast({
          title: "Admin Access Granted",
          description: "Welcome, Administrator!",
        });
        navigate("/dashboard");
        return;
      }
      
      // Special case for manager login
      if (email === "manager@example.com" && password === "ManagerPass123!") {
        // Create a mock manager user session
        localStorage.setItem("manager_override_email", email);
        toast({
          title: "Manager Access Granted",
          description: "Welcome, Manager!",
        });
        navigate("/dashboard");
        return;
      }

      const validated = authSchema.parse({ email, password });
      localStorage.removeItem("admin_override_email");
      
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: validated.email,
          password: validated.password,
        });
        
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged in",
        });
        localStorage.removeItem("admin_override_email");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email: validated.email,
          password: validated.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        
        if (error) throw error;
        
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account",
        });
        localStorage.removeItem("admin_override_email");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = z.object({
        email: z.string().email("Invalid email address").max(255),
      }).parse({ email });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Please check your email for instructions to reset your password",
      });

      // Reset form and return to login
      setIsForgotPassword(false);
      setEmail("");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass rounded-2xl shadow-elegant p-8 animate-fade-up">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              NetworkNote
            </h1>
            <p className="text-muted-foreground text-sm">
              Professional networking made simple
            </p>
          </div>

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass border-border/50 focus:border-primary"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-foreground transition-smooth hover-scale"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Send Reset Link"}
              </Button>

              <div className="mt-4 text-center">
                <Button
                  variant="link"
                  onClick={() => {
                    setIsForgotPassword(false);
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth p-0 h-auto"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="glass border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="glass border-border/50 focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-foreground transition-smooth hover-scale"
                disabled={loading}
              >
                {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
              </Button>

              <div className="mt-2 text-center">
                <Button
                  variant="link"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-smooth p-0 h-auto"
                >
                  Forgot Password?
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
