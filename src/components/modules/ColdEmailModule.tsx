import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, RefreshCw, Mail, Upload } from "lucide-react";

const ColdEmailModule = () => {
  const [keyPoints, setKeyPoints] = useState("");
  const [resume, setResume] = useState("");
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!keyPoints.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter key points",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-cold-email", {
        body: { keyPoints, resume },
      });

      if (error) throw error;

      setGeneratedEmail(data.email);
      toast({
        title: "Success!",
        description: "Cold email generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate email",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    });
  };

  const handleSendEmail = () => {
    const emailLines = generatedEmail.split('\n');
    const subject = emailLines[0].replace('Subject: ', '');
    const body = emailLines.slice(2).join('\n');
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="grid lg:grid-cols-[60%,40%] gap-8">
      <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
        <h2 className="text-2xl font-semibold mb-2">Cold Emailing</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Fill in your information to generate your cold email
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="resume">Select a Resume (optional)</Label>
            <div className="relative">
              <Textarea
                id="resume"
                placeholder="Paste your resume content here..."
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                className="glass border-border/50 focus:border-primary min-h-[120px]"
              />
              <Upload className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyPoints">Key Points *</Label>
            <Textarea
              id="keyPoints"
              placeholder="Ask for referral / project collaboration / role fit..."
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              className="glass border-border/50 focus:border-primary min-h-[150px] focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !keyPoints.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-foreground hover-scale"
          >
            {loading ? "Generating..." : "Generate Email"}
          </Button>
        </div>
      </div>

      <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
        <h3 className="text-xl font-semibold mb-4">Email Preview</h3>

        {!generatedEmail ? (
          <p className="text-muted-foreground text-sm">
            No results yet. Fill in the required fields and hit 'Generate Email.'
          </p>
        ) : (
          <div className="space-y-4 animate-fade-up">
            <div className="glass rounded-xl p-4 border border-border/50">
              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {generatedEmail}
              </pre>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="glass hover:bg-accent hover-scale"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="glass hover:bg-accent hover-scale"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                className="glass hover:bg-secondary/20 hover-scale"
              >
                <Mail className="h-4 w-4 mr-2" />
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColdEmailModule;
