// This script runs in the browser after deployment
// It creates static JSON files for API endpoints

(function generateStaticAPI() {
  // Skills data
  const skills = {
    frontend: [
      { id: 76, name: "JavaScript", category: "frontend", percentage: 85, endorsement_count: 0 },
      { id: 77, name: "React", category: "frontend", percentage: 80, endorsement_count: 0 },
      { id: 78, name: "HTML & CSS", category: "frontend", percentage: 90, endorsement_count: 0 },
      { id: 79, name: "TypeScript", category: "frontend", percentage: 75, endorsement_count: 0 }
    ],
    backend: [
      { id: 80, name: "Node.js", category: "backend", percentage: 80, endorsement_count: 0 },
      { id: 81, name: "Express", category: "backend", percentage: 78, endorsement_count: 0 },
      { id: 82, name: "MongoDB", category: "backend", percentage: 75, endorsement_count: 0 },
      { id: 85, name: "MySQL", category: "backend", percentage: 78, endorsement_count: 0 },
      { id: 86, name: "Java", category: "backend", percentage: 73, endorsement_count: 0 }
    ],
    devops: [
      { id: 83, name: "Git/GitHub", category: "devops", percentage: 85, endorsement_count: 0 },
      { id: 84, name: "VS Code", category: "devops", percentage: 90, endorsement_count: 0 }
    ]
  };

  // Create skills JSON file
  const skillsJSON = JSON.stringify(skills);
  localStorage.setItem('api_skills', skillsJSON);
  
  // Projects data
  const projects = [
    {
      id: "1",
      title: "Stackzen",
      description: "Income Intelligence Dashboard with expense tracking and management.",
      image_url: "/assets/project-stackzen.webp",
      live_url: "https://income-intelligence-mytech7.replit.app/",
      github_url: "https://github.com/Mrguru2/Stackzen",
      technologies: ["React", "Node.js", "Express", "MongoDB"],
      featured: true,
      demo_type: "iframe"
    },
    {
      id: "2",
      title: "Keycode Help",
      description: "Tool to help developers identify JavaScript key codes for event handling.",
      image_url: "/assets/project-keycode.webp",
      live_url: "https://keycodehelper.netlify.app/",
      github_url: "https://github.com/Mrguru2/KeycodeHelper",
      technologies: ["JavaScript", "HTML", "CSS"],
      featured: true,
      demo_type: "iframe"
    },
    {
      id: "3",
      title: "Inventory Management",
      description: "Full inventory management system for small businesses.",
      image_url: "/assets/project-inventory.webp",
      live_url: "https://inventory-app.vercel.app",
      github_url: "https://github.com/Mrguru2/InventoryApp",
      technologies: ["React", "Node.js", "Express", "MongoDB"],
      featured: true,
      demo_type: "video"
    },
    {
      id: "4",
      title: "Gatherly",
      description: "Event management platform for organizing and managing community events.",
      image_url: "/assets/project-gatherly.webp",
      live_url: "https://gatherly-events.vercel.app",
      github_url: "https://github.com/Mrguru2/Gatherly",
      technologies: ["React", "Firebase", "Tailwind CSS"],
      featured: true,
      demo_type: "github"
    }
  ];
  localStorage.setItem('api_projects', JSON.stringify(projects));
  
  // Blog data
  const blog = [
    {
      id: 1,
      slug: "journey-building-portfolio-website",
      title: "My Journey Building a Portfolio Website",
      summary: "Lessons learned while creating a developer portfolio site with React and modern tools.",
      content: "# My Journey Building a Portfolio Website\n\nAs a developer stepping into the professional world, I realized the importance of having a digital portfolio that showcases my skills and projects effectively.",
      author_id: 1,
      created_at: "2025-03-15T00:00:00.000Z",
      updated_at: "2025-03-15T00:00:00.000Z",
      status: "published",
      image_url: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y29kaW5nfGVufDB8fDB8fHww"
    },
    {
      id: 2,
      slug: "mastering-react-hooks",
      title: "Mastering React Hooks in 2025",
      summary: "An in-depth guide to using React Hooks effectively in modern applications.",
      content: "# Mastering React Hooks in 2025\n\nReact Hooks have revolutionized how we write React components since their introduction. In 2025, they remain a fundamental part of React development.",
      author_id: 1,
      created_at: "2025-04-01T00:00:00.000Z",
      updated_at: "2025-04-01T00:00:00.000Z",
      status: "published",
      image_url: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmVhY3R8ZW58MHx8MHx8fDA%3D"
    }
  ];
  localStorage.setItem('api_blog', JSON.stringify(blog));
  
  // User data (null for unauthenticated)
  localStorage.setItem('api_user', JSON.stringify(null));
  
  console.log('Static API data generated and stored in localStorage');
})();