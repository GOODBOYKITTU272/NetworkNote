import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyLogoProps {
  name: string;
  size?: "sm" | "md" | "lg";
}

const CompanyLogo = ({ name, size = "md" }: CompanyLogoProps) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Generate a simple placeholder based on the first letter of the company name
  const getPlaceholder = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // Simple color generation based on company name for consistent colors
  const getColorClass = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <Avatar className={`${sizeClasses[size]} rounded-lg`}>
      <AvatarImage 
        src={`https://logo.clearbit.com/${name.toLowerCase().replace(/\s+/g, '')}.com`} 
        alt={name}
        className="object-contain"
      />
      <AvatarFallback className={`${getColorClass(name)} ${textSizeClasses[size]} text-white font-medium`}>
        {getPlaceholder(name)}
      </AvatarFallback>
    </Avatar>
  );
};

export default CompanyLogo;