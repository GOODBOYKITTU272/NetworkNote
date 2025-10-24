import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { supabase } from "@/integrations/supabase/client";

interface CompanyListProps {
  searchTerm: string;
  onSelectCompany: (company: string) => void;
}

const CompanyList = ({ searchTerm, onSelectCompany }: CompanyListProps) => {
  const [companies, setCompanies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLetter, setCurrentLetter] = useState<string>('A');
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [alphabet, setAlphabet] = useState<string[]>([]);
  
  // Get all letters A-Z
  useEffect(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    setAlphabet(letters);
  }, []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        
        // First, get the total count of unique companies
        const { count, error: countError } = await (supabase as any)
          .from('hr_details')
          .select('company', { count: 'exact', head: true });

        if (countError) throw countError;
        setTotalCompanies(count || 0);

        // Fetch companies that start with the current letter
        const { data, error } = await (supabase as any)
          .from('hr_details')
          .select('company')
          .ilike('company', `${currentLetter}%`)
          .order('company');

        if (error) throw error;

        // Extract unique company names
        const uniqueCompanies = Array.from(new Set((data as any[]).map(item => item.company)));
        setCompanies(uniqueCompanies);
      } catch (error) {
        console.error('Error fetching companies:', error);
        // Fallback to mock data if there's an error
        const MOCK_COMPANIES = [
          "Google", "Meta", "Amazon", "Apple", "Microsoft", "Netflix",
          "Tesla", "Adobe", "Salesforce", "Oracle", "IBM", "Intel",
          "Nvidia", "PayPal", "Uber", "Airbnb", "Spotify", "Twitter",
        ];
        // Filter mock data by current letter
        const filteredMock = MOCK_COMPANIES.filter(company => 
          company.toUpperCase().startsWith(currentLetter)
        );
        setCompanies(filteredMock);
        setTotalCompanies(MOCK_COMPANIES.length);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [currentLetter]);

  const filteredCompanies = companies.filter((company) =>
    company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, index) => (
            <div key={index} className="glass rounded-xl p-4 flex flex-col items-center justify-center aspect-square animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg w-12 h-12 mb-2" />
              <div className="bg-gray-200 dark:bg-gray-700 rounded w-3/4 h-4" />
            </div>
          ))}
        </div>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => setCurrentLetter(letter)}
              className={`glass rounded-lg w-8 h-8 flex items-center justify-center border border-border/50 transition-smooth ${
                currentLetter === letter 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-primary/10"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (filteredCompanies.length === 0) {
    return (
      <div className="space-y-6">
        <p className="text-center text-muted-foreground py-8">
          No companies found starting with '{currentLetter}'.
        </p>
        
        <div className="flex flex-wrap gap-2 justify-center">
          {alphabet.map(letter => (
            <button
              key={letter}
              onClick={() => setCurrentLetter(letter)}
              className={`glass rounded-lg w-8 h-8 flex items-center justify-center border border-border/50 transition-smooth ${
                currentLetter === letter 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-primary/10"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Showing companies starting with '{currentLetter}' ({filteredCompanies.length} companies)
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredCompanies.map((company) => (
          <button
            key={company}
            onClick={() => onSelectCompany(company)}
            className="glass rounded-xl p-4 flex flex-col items-center justify-center hover:bg-primary/10 transition-smooth hover-scale border border-border/50 hover:border-primary/50 aspect-square"
          >
            <div className="mb-2">
              <CompanyLogo name={company} size="md" />
            </div>
            <span className="font-medium text-center text-sm">{company}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground mt-1" />
          </button>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        {alphabet.map(letter => (
          <button
            key={letter}
            onClick={() => setCurrentLetter(letter)}
            className={`glass rounded-lg w-8 h-8 flex items-center justify-center border border-border/50 transition-smooth ${
              currentLetter === letter 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-primary/10"
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
      
      <div className="text-sm text-muted-foreground text-center">
        Total companies in database: {totalCompanies}
      </div>
    </div>
  );
};

export default CompanyList;