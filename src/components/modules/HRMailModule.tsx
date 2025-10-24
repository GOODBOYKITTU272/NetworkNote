import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight } from "lucide-react";
import CompanyList from "../hr-mail/CompanyList";
import HRDetails from "../hr-mail/HRDetails";

const HRMailModule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {!selectedCompany ? (
        <div className="glass rounded-2xl p-8 shadow-elegant animate-slide-in">
          <h2 className="text-2xl font-semibold mb-6">HR Mail IDs</h2>
          
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass pl-10 border-border/50 focus:border-primary"
            />
          </div>

          <CompanyList 
            searchTerm={searchTerm} 
            onSelectCompany={setSelectedCompany}
          />
        </div>
      ) : (
        <HRDetails 
          companyName={selectedCompany}
          onBack={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
};

export default HRMailModule;
