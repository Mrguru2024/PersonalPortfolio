export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  category: string;
  githubUrl?: string;
  liveUrl?: string;
  details?: string;
}

export interface Skill {
  name: string;
  percentage: number;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  description: string;
  education: string[];
  experience: string[];
  resumeUrl: string;
  image: string;
}

export interface ContactInfo {
  email: string;
  location: string;
  phone: string;
}

export const personalInfo: PersonalInfo = {
  name: "Anthony Feaster (MrGuru.dev)",
  title: "Full Stack Web Developer",
  description: "Hello! I'm Anthony Feaster, also known as MrGuru.dev, an innovative entrepreneur and tech enthusiast based in Atlanta, Georgia. With a strong background in electronic repair and automotive locksmiths, I founded SSI-M.E.T Repairs-KeyCode Help to bring advanced technology solutions to the locksmith industry. Currently, I'm expanding my skill set through Codenoobs WebDev Incubator. My passion lies in problem-solving and continuous learning. I thrive on creating solutions that improve customer experiences and streamline operations.",
  education: [
    "Codenoobs WebDev Incubator",
    "Tech Entrepreneurship Training",
    "Automotive Security Systems Specialist"
  ],
  experience: [
    "Founder, SSI-M.E.T Repairs-KeyCode Help",
    "Automotive Locksmith Specialist",
    "Electronic Repair Technician"
  ],
  resumeUrl: "/api/resume",
  image: "https://raw.githubusercontent.com/Mrguru2024/My-Portfolio-Website/main/assets/Assets/Photos/Copy%20of%20Web%20Designer%20Content%20Posts.jpg"
};

export const socialLinks: SocialLink[] = [
  {
    platform: "GitHub",
    url: "https://github.com/Mrguru2024",
    icon: "github"
  },
  {
    platform: "LinkedIn",
    url: "https://linkedin.com/in/anthonyfeaster",
    icon: "linkedin"
  },
  {
    platform: "Twitter",
    url: "https://twitter.com/mrguru2024",
    icon: "twitter"
  },
  {
    platform: "MrGuru.dev",
    url: "https://mrguru.dev",
    icon: "globe"
  },
  {
    platform: "Email",
    url: "mailto:5epmgllc@gmail.com",
    icon: "mail"
  }
];

export const contactInfo: ContactInfo = {
  email: "5epmgllc@gmail.com",
  location: "Atlanta, Georgia",
  phone: "+1 (404) 555-1234"
};

export const frontendSkills: Skill[] = [
  { name: "JavaScript", percentage: 85 },
  { name: "HTML & CSS", percentage: 90 },
  { name: "React", percentage: 80 },
  { name: "Responsive Design", percentage: 85 }
];

export const backendSkills: Skill[] = [
  { name: "Node.js", percentage: 75 },
  { name: "Express", percentage: 70 },
  { name: "MongoDB", percentage: 65 },
  { name: "Java", percentage: 60 }
];

export const devopsSkills: Skill[] = [
  { name: "Git/GitHub", percentage: 85 },
  { name: "Vercel", percentage: 75 },
  { name: "Netlify", percentage: 70 },
  { name: "VS Code", percentage: 90 }
];

export const additionalSkills: string[] = [
  "Problem Solving",
  "Customer Service",
  "Automotive Security",
  "Electronic Repair",
  "Entrepreneurship",
  "Business Development",
  "Technical Documentation",
  "Team Leadership"
];

export const projects: Project[] = [
  {
    id: "keycode-help",
    title: "Keycode Help",
    description: "A SaaS business that provides VIN to KeyCode services and online resources for locksmiths.",
    image: "https://images.unsplash.com/photo-1586864387789-628af9feed72?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["SaaS", "Automotive", "Security"],
    category: "business",
    githubUrl: "https://github.com/Mrguru2024",
    liveUrl: "https://keycodehelp.com",
    details: "Keycode Help is a Software as a Service (SaaS) platform designed to support automotive professionals with key coding and programming needs. This platform provides essential VIN to KeyCode translation services specifically for locksmiths working in the automotive security industry."
  },
  {
    id: "portfolio-website",
    title: "Portfolio Website",
    description: "A responsive portfolio website showcasing my skills, projects and professional information.",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["HTML", "CSS", "JavaScript", "Responsive"],
    category: "web",
    githubUrl: "https://github.com/Mrguru2024/My-Portfolio-Website",
    liveUrl: "https://mrguru2024.github.io/My-Portfolio-Website/",
    details: "A personal portfolio website built using HTML, CSS, and JavaScript to showcase my projects, skills, and professional experience. The site features responsive design, theme customization, and interactive elements."
  },
  {
    id: "ssi-met-repairs",
    title: "SSI-M.E.T Repairs",
    description: "Business website for electronic repair and automotive locksmith services.",
    image: "https://images.unsplash.com/photo-1635262945219-33df0944316a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Business", "Service", "Automotive"],
    category: "business",
    liveUrl: "https://ssi-met-repairs.com",
    details: "SSI-M.E.T Repairs is a business website that offers electronic repair and automotive locksmith services. The site includes service descriptions, appointment scheduling, and customer testimonials."
  },
  {
    id: "web-development-services",
    title: "Web Development Services",
    description: "Professional web development and design services for businesses and individuals.",
    image: "https://images.unsplash.com/photo-1559028012-481c04fa702d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80",
    tags: ["Web Development", "Design", "Business"],
    category: "service",
    githubUrl: "https://github.com/Mrguru2024",
    liveUrl: "https://forms.gle/vu11jF1nixkoRxH86",
    details: "Professional web development and design services tailored for businesses and individuals. Services include website creation, redesign, maintenance, and custom web application development to meet client needs."
  }
];
