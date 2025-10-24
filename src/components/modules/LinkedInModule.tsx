import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, RefreshCw, Linkedin } from "lucide-react";

type IntentType = "" | "interview" | "connections" | "network" | "followup";

const LinkedInModule = () => {
  const [intent, setIntent] = useState<IntentType>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [generatedNote, setGeneratedNote] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getRequiredFields = () => {
    const fields: { key: string; label: string; placeholder: string; required: boolean }[] = [];
    
    switch (intent) {
      case "interview":
        fields.push(
          { key: "jobFunction", label: "Target Job Function", placeholder: "e.g., Product Designer", required: true },
          { key: "company", label: "Target Company", placeholder: "e.g., Netflix", required: true },
          { key: "resume", label: "Resume (optional)", placeholder: "Paste resume...", required: false }
        );
        break;
      case "connections":
        fields.push(
          { key: "role", label: "Target Role", placeholder: "e.g., Senior Engineer", required: true },
          { key: "company", label: "Target Company", placeholder: "e.g., Google", required: true },
          { key: "currentJob", label: "Current Job", placeholder: "e.g., Software Developer", required: true },
          { key: "resume", label: "Resume (optional)", placeholder: "Paste resume...", required: false }
        );
        break;
      case "network":
        fields.push(
          { key: "currentJob", label: "Current Job", placeholder: "e.g., Data Analyst", required: true },
          { key: "resume", label: "Resume (optional)", placeholder: "Paste resume...", required: false }
        );
        break;
      case "followup":
        fields.push(
          { key: "role", label: "Target Role", placeholder: "e.g., Product Manager", required: true },
          { key: "company", label: "Target Company", placeholder: "e.g., Meta", required: true },
          { key: "firstName", label: "Connection First Name", placeholder: "e.g., Sarah", required: true },
          { key: "jobTitle", label: "Connection Job Title", placeholder: "e.g., VP of Product", required: true },
          { key: "resume", label: "Resume (optional)", placeholder: "Paste resume...", required: false }
        );
        break;
    }
    
    return fields;
  };

  const handleGenerate = async () => {
    const fields = getRequiredFields();
    const requiredFieldsMissing = fields
      .filter(f => f.required && !formData[f.key])
      .length > 0;

    if (requiredFieldsMissing) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-linkedin-note", {
        body: { intent, formData },
      });

      if (error) throw error;

      setGeneratedNote(data.note);
      toast({
        title: "Success!",
        description: "LinkedIn note generated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate note",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedNote);
    toast({
      title: "Copied!",
      description: "Note copied to clipboard",
    });
  };

  const handleLinkedInSearch = () => {
    const role = formData.role || formData.jobFunction || "hiring";
    const company = formData.company || "";
    
    // Enhanced search query with additional relevant keywords for QA positions
    let searchTerms = [];
    
    // Add role-specific keywords based on intent
    if (intent === "interview" || intent === "connections") {
      // For QA positions, add relevant keywords
      if (role.toLowerCase().includes("qa") || role.toLowerCase().includes("quality")) {
        searchTerms = [`"${role}"`, `"${company}"`, '"hiring"', '"talent"', '"acquisition"', '"HR"', '"quality assurance"', '"testing"'];
      } else {
        searchTerms = [`"${role}"`, `"${company}"`, '"hiring"', '"talent"', '"acquisition"', '"HR"'];
      }
    } else {
      // For general networking, focus on company and role
      searchTerms = [`"${role}"`, `"${company}"`];
    }
    
    // Join terms with + for LinkedIn search
    const searchQuery = encodeURIComponent(searchTerms.join(" + "));
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${searchQuery}&origin=GLOBAL_SEARCH_HEADER`;
    
    window.open(searchUrl, "_blank");
  };

  return (
    <div className="grid lg:grid-cols-[60%,40%] gap-8">
      <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
        <h2 className="text-2xl font-semibold mb-6">LinkedIn Networking</h2>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Why are you networking?</Label>
            <Select value={intent} onValueChange={(value) => setIntent(value as IntentType)}>
              <SelectTrigger className="glass">
                <SelectValue placeholder="Select your intent..." />
              </SelectTrigger>
              <SelectContent className="glass border-border bg-background/95">
                <SelectItem value="interview">I want an interview</SelectItem>
                <SelectItem value="connections">I want industry connections</SelectItem>
                <SelectItem value="network">I'm just expanding my network</SelectItem>
                <SelectItem value="followup">I want to send a follow-up message</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {intent && (
            <div className="space-y-4 animate-fade-in">
              {getRequiredFields().map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label>{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="glass border-border/50 focus:border-primary"
                  />
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary/90 text-foreground hover-scale"
                >
                  {loading ? "Generating..." : "Generate Note"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIntent("");
                    setFormData({});
                    setGeneratedNote("");
                  }}
                  className="glass hover:bg-accent"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
        <h3 className="text-xl font-semibold mb-4">Preview</h3>
        
        {!generatedNote ? (
          <p className="text-muted-foreground text-sm">
            No results yet. Fill in the required fields and click 'Generate.'
          </p>
        ) : (
          <div className="space-y-4 animate-fade-up">
            <div className="glass rounded-xl p-4 border border-border/50">
              <p className="text-sm leading-relaxed">{generatedNote}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {generatedNote.length} characters
              </p>
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
                onClick={handleLinkedInSearch}
                className="glass hover:bg-secondary/20 hover-scale"
              >
                <Linkedin className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkedInModule;
