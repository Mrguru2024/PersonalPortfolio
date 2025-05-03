import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ProjectFilterProps {
  onFilterChange: (filter: string) => void;
}

const ProjectFilter = ({ onFilterChange }: ProjectFilterProps) => {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All Projects" },
    { id: "web", label: "Web Development" },
    { id: "mobile", label: "Mobile Apps" },
    { id: "design", label: "UI/UX Design" }
  ];

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    onFilterChange(filter);
  };

  return (
    <div className="flex flex-wrap justify-center mt-8 gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          size="sm"
          className={`rounded-full text-sm font-medium ${
            activeFilter === filter.id
              ? "bg-primary text-white"
              : "bg-white dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
          }`}
          onClick={() => handleFilterClick(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default ProjectFilter;
