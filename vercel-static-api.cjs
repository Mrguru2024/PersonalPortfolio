/**
 * Static API generator for Vercel deployment
 * Creates JSON files that mimic API responses for the static site
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[vercel-static-api] ${message}`);
}

// Write JSON data to a file
function writeJsonFile(filename, data) {
  const filePath = path.join('dist/api', filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  log(`Created ${filePath}`);
}

// Generate static skills data
function generateSkillsData() {
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

  writeJsonFile('skills.json', skills);
}

// Generate static projects data
function generateProjectsData() {
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

  writeJsonFile('projects.json', projects);
}

// Generate static blog posts data
function generateBlogData() {
  const blog = [
    {
      id: 1,
      slug: "journey-building-portfolio-website",
      title: "My Journey Building a Portfolio Website",
      summary: "Lessons learned while creating a developer portfolio site with React and modern tools.",
      content: "# My Journey Building a Portfolio Website\n\nAs a developer stepping into the professional world, I realized the importance of having a digital portfolio that showcases my skills and projects effectively. This blog post details my journey creating this very website you're browsing now.\n\n## Planning Phase\n\nBefore writing a single line of code, I spent considerable time researching other developer portfolios, noting what I liked and disliked about each. The planning phase included:\n\n- Defining the core sections (About, Projects, Skills, Blog, Contact)\n- Selecting the right technology stack\n- Creating wireframes and mockups\n- Planning the content strategy\n\n## Technology Stack\n\nFor this project, I chose:\n\n- **Frontend**: React with Vite for fast development\n- **Styling**: Tailwind CSS for utility-first styling\n- **Backend**: Express.js for API endpoints\n- **Database**: PostgreSQL for data persistence\n- **Animation**: Framer Motion for smooth transitions\n\n## Challenges Faced\n\nThe journey wasn't without obstacles. Some challenges I encountered included:\n\n1. **Optimizing Performance**: Ensuring fast load times while maintaining visual appeal\n2. **Responsive Design**: Creating a seamless experience across all device sizes\n3. **Content Management**: Building a system to easily update projects and blog posts\n4. **Authentication**: Implementing secure admin access for content management\n\n## Key Learnings\n\nThis project taught me valuable lessons beyond just coding:\n\n- The importance of planning before implementation\n- How to prioritize features based on user needs\n- Techniques for optimizing performance in React applications\n- Effective ways to showcase projects and skills\n\n## Next Steps\n\nThis portfolio is never truly complete. Future enhancements include:\n\n- Adding more interactive elements\n- Implementing a newsletter subscription\n- Creating a more robust blog with categories and tags\n- Expanding the project showcase with detailed case studies\n\nI hope sharing my journey helps other developers building their own portfolios. Feel free to reach out if you have questions or want to discuss web development projects!",
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
      content: "# Mastering React Hooks in 2025\n\nReact Hooks have revolutionized how we write React components since their introduction. In 2025, they remain a fundamental part of React development. This guide explores best practices and advanced techniques for working with hooks.\n\n## Why Hooks Matter\n\nHooks allow function components to use state and other React features without writing class components. This leads to:\n\n- More concise, readable code\n- Easier reuse of stateful logic between components\n- Better organization of component logic\n\n## Essential Hooks to Master\n\n### 1. useState\n\nThe foundation of state management in function components:\n\n```jsx\nconst [count, setCount] = useState(0);\n```\n\nTips for effective useState:\n- Use multiple state variables for unrelated data\n- Use functional updates for state that depends on previous state\n- Consider custom hooks for complex state logic\n\n### 2. useEffect\n\nManaging side effects in components:\n\n```jsx\nuseEffect(() => {\n  // Effect code here\n  return () => {\n    // Cleanup code here\n  };\n}, [dependencies]);\n```\n\nBest practices:\n- Always specify dependencies correctly\n- Separate unrelated effects into multiple useEffect calls\n- Handle cleanup properly to prevent memory leaks\n\n### 3. useContext\n\nAccessing context without nesting:\n\n```jsx\nconst theme = useContext(ThemeContext);\n```\n\nWhen to use context:\n- For global state that many components need\n- For deeply nested component structures\n- As an alternative to prop drilling\n\n## Advanced Hooks Techniques\n\n### Custom Hooks\n\nBuilding your own hooks allows you to extract component logic into reusable functions:\n\n```jsx\nfunction useWindowSize() {\n  const [size, setSize] = useState({ width: undefined, height: undefined });\n  \n  useEffect(() => {\n    const handleResize = () => {\n      setSize({ width: window.innerWidth, height: window.innerHeight });\n    };\n    \n    window.addEventListener('resize', handleResize);\n    handleResize();\n    \n    return () => window.removeEventListener('resize', handleResize);\n  }, []);\n  \n  return size;\n}\n```\n\n### Performance Optimization\n\nUse these hooks to avoid unnecessary renders:\n\n- **useMemo**: Memoize expensive calculations\n- **useCallback**: Prevent function recreation\n- **React.memo**: Skip rendering when props haven't changed\n\n## Common Hooks Mistakes\n\n1. **Ignoring dependency arrays**: This can cause infinite loops or stale closures\n2. **Overusing useState**: Consider useReducer for complex state\n3. **Creating hooks conditionally**: Hooks must always be called in the same order\n\n## Conclusion\n\nMastering React Hooks will significantly improve your React development experience. They enable cleaner, more maintainable code while providing powerful ways to handle component logic. Keep practicing and exploring the React documentation for more insights!",
      author_id: 1,
      created_at: "2025-04-01T00:00:00.000Z",
      updated_at: "2025-04-01T00:00:00.000Z",
      status: "published",
      image_url: "https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmVhY3R8ZW58MHx8MHx8fDA%3D"
    }
  ];

  writeJsonFile('blog.json', blog);
}

// Generate static user data (returns null for unauthenticated)
function generateUserData() {
  writeJsonFile('user.json', null);
}

// Generate all static files
function generateAllStaticFiles() {
  log('Generating all static API files');
  generateSkillsData();
  generateProjectsData();
  generateBlogData();
  generateUserData();
  log('Completed generating static API files');
}

// Run the generator
generateAllStaticFiles();