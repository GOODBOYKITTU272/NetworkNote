import { Button } from "@/components/ui/button";
import { Copy, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { HRContact } from "./HRDetails";

interface GeneratedEmailPanelProps {
  selectedHR: HRContact | null;
  generatedEmail: string;
}

const GeneratedEmailPanel = ({ selectedHR, generatedEmail }: GeneratedEmailPanelProps) => {
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast({
      title: "Copied!",
      description: "Email copied to clipboard",
    });
  };

  const handleSendEmail = () => {
    if (!selectedHR) return;
    
    const emailLines = generatedEmail.split("\n");
    const subjectLine = emailLines.find((line) => /^subject:/i.test(line.trim()));
    const subject = subjectLine
      ? subjectLine.replace(/^subject:\s*/i, "")
      : "Following up on my application";
    const startIndex = subjectLine ? emailLines.indexOf(subjectLine) + 1 : 0;
    const body = emailLines.slice(startIndex).join("\n").trim();

    const gmailUrl = new URL("https://mail.google.com/mail/");
    gmailUrl.searchParams.set("view", "cm");
    gmailUrl.searchParams.set("fs", "1");
    gmailUrl.searchParams.set("to", selectedHR.email);
    gmailUrl.searchParams.set("su", subject);
    if (body) {
      gmailUrl.searchParams.set("body", body);
    }

    const newWindow = window.open(gmailUrl.toString(), "_blank");

    if (!newWindow) {
      // Fallback to default mail client if pop-up blocked
      window.location.href = `mailto:${selectedHR.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
      <h3 className="text-xl font-semibold mb-4">Email Preview</h3>

      {!generatedEmail ? (
        <p className="text-muted-foreground text-sm">
          Select an HR contact and generate an email to see the preview here.
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
              Copy Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              className="glass hover:bg-secondary/20 hover-scale"
            >
              <Mail className="h-4 w-4 mr-2" />
              Open in Email
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeneratedEmailPanel;
