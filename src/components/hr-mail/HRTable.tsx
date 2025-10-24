import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import KeyPointsPopup from "./KeyPointsPopup";
import { HRContact } from "./HRDetails";

interface HRTableProps {
  hrContacts: HRContact[];
  companyName: string;
  onSelectHR: (contact: HRContact) => void;
  onEmailGenerated: (email: string) => void;
}

const HRTable = ({ hrContacts, companyName, onSelectHR, onEmailGenerated }: HRTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContact, setSelectedContact] = useState<HRContact | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(hrContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentContacts = hrContacts.slice(startIndex, endIndex);

  const handleGenerate = (contact: HRContact) => {
    setSelectedContact(contact);
    onSelectHR(contact);
    setShowPopup(true);
  };

  return (
    <>
      <div className="glass rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-16">Sl no</TableHead>
              <TableHead>HR Name</TableHead>
              <TableHead>Mail ID</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="w-32">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentContacts.map((contact, index) => (
              <TableRow key={contact.id} className="hover:bg-primary/5 border-border/50">
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{contact.email}</TableCell>
                <TableCell>{contact.position}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    onClick={() => handleGenerate(contact)}
                    className="bg-secondary hover:bg-secondary/90 text-white hover-scale"
                  >
                    Generate
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="glass hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={page === currentPage ? "bg-primary text-foreground" : "glass hover:bg-accent"}
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="glass hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {selectedContact && (
        <KeyPointsPopup
          open={showPopup}
          onClose={() => setShowPopup(false)}
          contact={selectedContact}
          companyName={companyName}
          onEmailGenerated={onEmailGenerated}
        />
      )}
    </>
  );
};

export default HRTable;
