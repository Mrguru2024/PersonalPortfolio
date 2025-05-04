"use client";

type Skill = {
  id: number;
  name: string;
  category: string;
  proficiency: number;
  endorsementCount: number;
  icon: string | null;
  color: string | null;
  yearsOfExperience: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export function getMockSkills(): { frontend: Skill[], backend: Skill[], other: Skill[] } {
  const currentTime = new Date();
  
  return {
    frontend: [
      { 
        id: 1, 
        name: "React / Next.js", 
        category: "frontend", 
        proficiency: 95,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 2, 
        name: "TypeScript", 
        category: "frontend", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 3, 
        name: "TailwindCSS", 
        category: "frontend", 
        proficiency: 95,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 4, 
        name: "Framer Motion", 
        category: "frontend", 
        proficiency: 85,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 1,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 5, 
        name: "HTML5 / CSS3", 
        category: "frontend", 
        proficiency: 95,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 5,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 6, 
        name: "JavaScript", 
        category: "frontend", 
        proficiency: 95,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 4,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 7, 
        name: "Redux / Context API", 
        category: "frontend", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 8, 
        name: "Responsive Design", 
        category: "frontend", 
        proficiency: 95,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 4,
        createdAt: currentTime,
        updatedAt: currentTime
      },
    ],
    backend: [
      { 
        id: 9, 
        name: "Node.js", 
        category: "backend", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 10, 
        name: "Express", 
        category: "backend", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 11, 
        name: "Next.js API Routes", 
        category: "backend", 
        proficiency: 85,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 12, 
        name: "PostgreSQL", 
        category: "backend", 
        proficiency: 85,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 13, 
        name: "MongoDB", 
        category: "backend", 
        proficiency: 80,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 14, 
        name: "RESTful APIs", 
        category: "backend", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 15, 
        name: "GraphQL", 
        category: "backend", 
        proficiency: 75,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 1,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 16, 
        name: "Authentication", 
        category: "backend", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
    ],
    other: [
      { 
        id: 17, 
        name: "Git / GitHub", 
        category: "other", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 4,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 18, 
        name: "Docker", 
        category: "other", 
        proficiency: 75,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 1,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 19, 
        name: "CI/CD", 
        category: "other", 
        proficiency: 80,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 20, 
        name: "Testing (Jest, RTL)", 
        category: "other", 
        proficiency: 85,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 21, 
        name: "AWS Basics", 
        category: "other", 
        proficiency: 75,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 1,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 22, 
        name: "Agile / Scrum", 
        category: "other", 
        proficiency: 90,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 3,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 23, 
        name: "UI/UX Principles", 
        category: "other", 
        proficiency: 85,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
      { 
        id: 24, 
        name: "Performance Optimization", 
        category: "other", 
        proficiency: 85,
        endorsementCount: 0,
        icon: null,
        color: null,
        yearsOfExperience: 2,
        createdAt: currentTime,
        updatedAt: currentTime
      },
    ],
  };
}