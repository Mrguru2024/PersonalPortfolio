import { motion } from "framer-motion";
import { Skill } from "@/lib/data";

interface SkillBarProps {
  skill: Skill;
  barColor?: string;
}

const SkillBar = ({ skill, barColor = "bg-primary" }: SkillBarProps) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <span className="text-gray-700 dark:text-gray-300 font-medium">{skill.name}</span>
        <span className="text-gray-600 dark:text-gray-400 text-sm">{skill.percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <motion.div
          className={`${barColor} h-2.5 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${skill.percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default SkillBar;
