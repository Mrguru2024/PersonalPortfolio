import React from 'react';
import { X } from 'lucide-react';

interface TagProps {
  text: string;
  onRemove: () => void;
}

export const Tag: React.FC<TagProps> = ({ text, onRemove }) => {
  return (
    <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
      {text}
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none dark:text-blue-300 dark:hover:text-blue-100"
      >
        <X size={14} />
        <span className="sr-only">Remove {text}</span>
      </button>
    </div>
  );
};