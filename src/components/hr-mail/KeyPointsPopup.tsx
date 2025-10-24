import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HRContact } from "./HRDetails";

interface KeyPointsPopupProps {
  open: boolean;
  onClose: () => void;
  contact: HRContact;
  companyName: string;
  onEmailGenerated: (email: string) => void;
}

const generateFallbackEmail = (contact: HRContact, companyName: string, keyPoints: string) => {
  const formattedPoints = keyPoints
    .split(/\r?\n/)
    .map((point) => point.trim())
    .filter(Boolean);

  const intro = formattedPoints.length
    ? formattedPoints[0]
    : `I'm reaching out about potential opportunities with ${companyName} and would appreciate a quick conversation.`;

  const additionalPoints = formattedPoints.slice(1);
  const bulletSection = additionalPoints.length
    ? additionalPoints.map((point) => `- ${point}`).join("\n")
    : "- Experienced professional eager to contribute to your team";

  const firstName = contact.name.split(" ")[0] || contact.name;

  return [
    `Subject: Exploring opportunities with ${companyName}`,
    "",
    `Hi ${firstName},`,
    "",
    intro,
    "",
    "Key highlights:",
    bulletSection,
    "",
    "I would appreciate the chance to discuss how I can support your team.",
    "Please let me know if we could schedule a quick call at your convenience.",
    "",
    "Thank you for your time and consideration.",
    "",
    "Best regards,",
    "[Your Name]",
    "[Your Contact Information]",
  ].join("\n");
};

const KeyPointsPopup = ({ open, onClose, contact, companyName, onEmailGenerated }: KeyPointsPopupProps) => {
  const [keyPoints, setKeyPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleClose = () => {
    setKeyPoints("");
    onClose();
  };

  const handleSuccess = (email: string, options?: { message?: string; title?: string; skipToast?: boolean }) => {
    onEmailGenerated(email);
    if (!options?.skipToast) {
      toast({
        title: options?.title ?? "Success!",
        description: options?.message ?? "Email generated",
      });
    }
    handleClose();
  };

  const handleGenerate = async () => {
    if (!keyPoints.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your key points",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-hr-email", {
        body: {
          hrName: contact.name,
          hrPosition: contact.position,
          companyName,
          keyPoints,
        },
      });

      if (error) throw error;

      const generatedEmail = typeof data?.email === "string" ? data.email.trim() : "";
      if (!generatedEmail) {
        throw new Error("Email content missing from the AI service");
      }

      handleSuccess(generatedEmail);
    } catch (error: any) {
      console.error("Error generating HR email via Edge Function:", error);
      const fallbackEmail = generateFallbackEmail(contact, companyName, keyPoints);

      handleSuccess(fallbackEmail, { skipToast: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose();
        }
      }}
    >
      <DialogContent className="glass border-border/50 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Key points for your cold email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="keyPoints">Purpose / Key Points *</Label>
            <Textarea
              id="keyPoints"
              placeholder="Referral for Product Designer, 5 years experience in UX, interested in Innovation team..."
              value={keyPoints}
              onChange={(e) => setKeyPoints(e.target.value)}
              className="glass border-border/50 focus:border-primary min-h-[120px]"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 glass hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !keyPoints.trim()}
              className="flex-1 bg-primary hover:bg-primary/90 text-foreground hover-scale"
            >
              {loading ? "Generating..." : "Generate Email"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyPointsPopup;
