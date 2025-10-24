import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import HRTable from "./HRTable";
import GeneratedEmailPanel from "./GeneratedEmailPanel";
import { supabase } from "@/integrations/supabase/client";

interface HRDetailsProps {
  companyName: string;
  onBack: () => void;
}

export interface HRContact {
  id: string;
  name: string;
  email: string;
  position: string;
}

const HRDetails = ({ companyName, onBack }: HRDetailsProps) => {
  const [hrData, setHrData] = useState<HRContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHR, setSelectedHR] = useState<HRContact | null>(null);
  const [generatedEmail, setGeneratedEmail] = useState("");

  useEffect(() => {
    const fetchHRData = async () => {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from('hr_details')
          .select('id, name, email, designation')
          .eq('company', companyName);

        if (error) throw error;

        // Transform the data to match HRContact interface
        const transformedData = (data as any[]).map(item => ({
          id: item.id.toString(),
          name: item.name,
          email: item.email,
          position: item.designation
        }));

        setHrData(transformedData);
      } catch (error) {
        console.error('Error fetching HR data:', error);
        // Fallback to mock data if there's an error
        const MOCK_HR_DATA: HRContact[] = [
          { id: "1", name: "Sarah Johnson", email: "sarah.j@company.com", position: "HR Manager" },
          { id: "2", name: "Michael Chen", email: "m.chen@company.com", position: "Talent Acquisition Lead" },
          { id: "3", name: "Emma Williams", email: "e.williams@company.com", position: "Senior Recruiter" },
          { id: "4", name: "David Brown", email: "d.brown@company.com", position: "HR Business Partner" },
          { id: "5", name: "Lisa Anderson", email: "l.anderson@company.com", position: "Recruitment Specialist" },
        ];
        setHrData(MOCK_HR_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchHRData();
  }, [companyName]);

  return (
    <div className="grid lg:grid-cols-[60%,40%] gap-8">
      <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="glass hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-semibold">{companyName}</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <HRTable
            hrContacts={hrData}
            companyName={companyName}
            onSelectHR={setSelectedHR}
            onEmailGenerated={setGeneratedEmail}
          />
        )}
      </div>

      <GeneratedEmailPanel
        selectedHR={selectedHR}
        generatedEmail={generatedEmail}
      />
    </div>
  );
};

export default HRDetails;
