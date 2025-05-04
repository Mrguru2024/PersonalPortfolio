/**
 * This script generates static JSON files for API endpoints
 * These will be used for the static site deployment on Vercel
 */

const fs = require('fs');
const path = require('path');

function createStaticApiFiles() {
  const apiDir = path.join(__dirname, 'dist', 'api');
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }

  // Skills API data
  const skillsData = {
    frontend: [
      {id: 76, name: "JavaScript", category: "frontend", percentage: 85, endorsement_count: 0},
      {id: 77, name: "React", category: "frontend", percentage: 80, endorsement_count: 0},
      {id: 78, name: "HTML & CSS", category: "frontend", percentage: 90, endorsement_count: 0},
      {id: 79, name: "TypeScript", category: "frontend", percentage: 75, endorsement_count: 0}
    ],
    backend: [
      {id: 80, name: "Node.js", category: "backend", percentage: 80, endorsement_count: 0},
      {id: 81, name: "Express", category: "backend", percentage: 78, endorsement_count: 0},
      {id: 82, name: "MongoDB", category: "backend", percentage: 75, endorsement_count: 0},
      {id: 85, name: "MySQL", category: "backend", percentage: 78, endorsement_count: 0},
      {id: 86, name: "Java", category: "backend", percentage: 73, endorsement_count: 0}
    ],
    devops: [
      {id: 83, name: "Git/GitHub", category: "devops", percentage: 85, endorsement_count: 0},
      {id: 84, name: "VS Code", category: "devops", percentage: 90, endorsement_count: 0}
    ]
  };

  fs.writeFileSync(
    path.join(apiDir, 'skills.json'), 
    JSON.stringify(skillsData, null, 2)
  );
  
  // Blog API data
  const blogData = [
    {
      "id": 1,
      "slug": "journey-building-portfolio-website",
      "title": "My Journey Building a Portfolio Website",
      "content": "# The Journey Begins\n\nWhen I started building my portfolio website, I knew I wanted it to be more than just a digital resume. I envisioned an interactive showcase of my skills and projects that would engage visitors and demonstrate my capabilities as a developer.\n\n## Choosing the Tech Stack\n\nAfter careful consideration, I settled on a modern tech stack:\n\n- **Frontend**: React with TypeScript for type safety\n- **Styling**: TailwindCSS for rapid UI development\n- **Backend**: Node.js with Express for API endpoints\n- **Database**: PostgreSQL for reliable data storage\n\nThis combination offered the perfect balance of performance, developer experience, and maintainability.\n\n## Challenges and Solutions\n\nOne of the biggest challenges was implementing the real-time skill tracking system that pulls data from GitHub and updates my skill proficiency automatically. I solved this by:\n\n1. Creating a custom GitHub API integration service\n2. Implementing a weighted algorithm that analyzes code contributions by language\n3. Building a fallback system for when the API is unavailable\n\n## The Results\n\nThe end result exceeded my expectations. The site not only showcases my work effectively but also serves as a demonstration of my coding abilities and problem-solving skills.\n\nI'm particularly proud of the interactive elements and performance optimizations that make the site fast and engaging.\n\n## What's Next\n\nThis portfolio will continue to evolve as I grow as a developer. I plan to add more interactive features, improve accessibility, and refine the user experience based on feedback.\n\nStay tuned for more updates on my journey!",
      "excerpt": "Follow my journey of building a modern, interactive portfolio website using React, TypeScript, and PostgreSQL, and learn about the challenges faced and solutions implemented along the way.",
      "published_at": "2025-04-30T10:00:00.000Z",
      "updated_at": "2025-05-01T14:30:00.000Z",
      "author_id": 1,
      "status": "published",
      "featured_image": null,
      "meta_title": "Building a Modern Portfolio Website - Development Journey",
      "meta_description": "Learn about my experience building a modern portfolio website using React, TypeScript, TailwindCSS, and PostgreSQL."
    }
  ];

  fs.writeFileSync(
    path.join(apiDir, 'blog.json'), 
    JSON.stringify(blogData, null, 2)
  );

  // Projects API data
  const projectsData = [
    {
      "id": "1",
      "title": "Stackzen",
      "description": "Income and expense tracking application with dashboard analytics and budgeting features.",
      "features": [
        "Real-time expense tracking", 
        "Interactive dashboard", 
        "Budget planning tools", 
        "Financial goal setting"
      ],
      "technologies": ["React", "Node.js", "Express", "MongoDB", "Chart.js"],
      "github_url": "https://github.com/mrguru2024/stackzen",
      "demo_url": "https://income-intelligence-mytech7.replit.app/",
      "image_url": "/assets/projects/stackzen.png",
      "category": "web",
      "status": "completed",
      "start_date": "2024-12-01T00:00:00.000Z",
      "end_date": "2025-02-15T00:00:00.000Z",
      "demo_type": "live"
    },
    {
      "id": "2",
      "title": "Keycode Helper",
      "description": "Interactive tool for developers to quickly identify JavaScript key codes and event properties.",
      "features": [
        "Real-time key detection", 
        "Copy key code with one click", 
        "Event property explorer", 
        "Mobile-friendly design"
      ],
      "technologies": ["JavaScript", "HTML5", "CSS3", "LocalStorage API"],
      "github_url": "https://github.com/mrguru2024/keycode-helper",
      "demo_url": "https://keycode-helper.vercel.app",
      "image_url": "/assets/projects/keycode-helper.png",
      "category": "tools",
      "status": "completed",
      "start_date": "2025-01-10T00:00:00.000Z",
      "end_date": "2025-01-25T00:00:00.000Z",
      "demo_type": "iframe"
    }
  ];

  fs.writeFileSync(
    path.join(apiDir, 'projects.json'), 
    JSON.stringify(projectsData, null, 2)
  );

  // User data (unauthenticated)
  fs.writeFileSync(
    path.join(apiDir, 'user.json'), 
    JSON.stringify({message: "Not authenticated"})
  );

  console.log('Static API JSON files created successfully');
}

module.exports = { createStaticApiFiles };