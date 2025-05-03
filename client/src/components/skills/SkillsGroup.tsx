import { ReactNode } from "react";
import { Skill } from "@/lib/data";
import SkillBar from "./SkillBar";

interface SkillsGroupProps {
  title: string;
  skills: Skill[];
  icon: ReactNode;
  barColor?: string;
}

const SkillsGroup = ({ title, skills, icon, barColor }: SkillsGroupProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-all hover:shadow-xl">
      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      
      {skills.map((skill) => (
        <SkillBar key={skill.name} skill={skill} barColor={barColor} />
      ))}
    </div>
  );
};

export default SkillsGroup;
