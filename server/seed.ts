import { db } from './db';
import { eq } from 'drizzle-orm';
import { projects, skills, contacts, blogPosts, blogComments, users } from '@shared/schema';
import { 
  projects as staticProjects, 
  frontendSkills,
  backendSkills,
  devopsSkills,
  personalInfo,
  socialLinks,
  contactInfo
} from '../client/src/lib/data';

async function seedProjects() {
  console.log('Seeding projects...');
  
  // Clear existing projects
  await db.delete(projects);
  
  // Insert projects from static data
  for (const project of staticProjects) {
    await db.insert(projects).values(project);
  }
  
  console.log(`Seeded ${staticProjects.length} projects`);
}

async function seedSkills() {
  console.log('Seeding skills...');
  
  // Clear existing skills
  await db.delete(skills);
  
  // Insert frontend skills
  for (const skill of frontendSkills) {
    await db.insert(skills).values({
      name: skill.name,
      percentage: skill.percentage,
      category: 'frontend'
    });
  }
  
  // Insert backend skills
  for (const skill of backendSkills) {
    await db.insert(skills).values({
      name: skill.name,
      percentage: skill.percentage,
      category: 'backend'
    });
  }
  
  // Insert devops skills
  for (const skill of devopsSkills) {
    await db.insert(skills).values({
      name: skill.name,
      percentage: skill.percentage,
      category: 'devops'
    });
  }
  
  console.log(`Seeded ${frontendSkills.length + backendSkills.length + devopsSkills.length} skills`);
}

async function seedBlogPosts() {
  console.log('Seeding blog posts...');
  
  // Clear existing blog posts and comments
  await db.delete(blogComments);
  await db.delete(blogPosts);
  
  // Create admin user if doesn't exist
  let userId = 1;
  const existingUser = await db.select().from(users).where(eq(users.username, 'admin')).limit(1);
  
  if (existingUser.length === 0) {
    const [user] = await db.insert(users).values({
      username: 'admin',
      password: 'admin123', // In a real app, this would be properly hashed
      email: 'admin@example.com',
      isAdmin: true
    }).returning();
    
    userId = user.id;
  }
  
  // Seed blog posts
  const samplePosts = [
    {
      title: "The Journey of Building My Portfolio Website",
      slug: "journey-building-portfolio-website",
      summary: "My experience creating a personal portfolio site using modern web technologies.",
      content: `When I decided to build a new portfolio website, I knew I wanted something that would truly represent my skills and personality as a developer.

This project was an opportunity to showcase not just my work, but also my approach to development. I chose React and TypeScript for the frontend because they provide the perfect balance of flexibility and type safety.

For the backend, I opted for Express and Node.js, two technologies I've grown to love for their simplicity and power. The addition of PostgreSQL allows me to store and retrieve data efficiently, making the site more dynamic.

One of the biggest challenges was designing a user experience that would be intuitive and engaging. I spent a lot of time on the UI/UX, ensuring that visitors could easily navigate through my projects and learn about my skills.

In the end, this portfolio is more than just a collection of my work—it's a reflection of my journey as a developer, and I'm excited to continue improving it as I grow in my career.`,
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2072&q=80",
      tags: ["React", "TypeScript", "Portfolio", "Web Development"],
      publishedAt: new Date(),
      updatedAt: new Date(),
      authorId: userId,
      isPublished: true
    },
    {
      title: "5 Essential Skills Every Modern Web Developer Should Master",
      slug: "5-essential-skills-modern-web-developer",
      summary: "A look at the key skills that separate good developers from great ones in today's tech landscape.",
      content: `The tech landscape evolves at a breakneck pace, and web developers need to constantly adapt to stay relevant. Here are five essential skills I believe every modern web developer should master:

1. **JavaScript Fundamentals**: Despite the rise of frameworks and libraries, a solid understanding of vanilla JavaScript remains crucial. Concepts like closures, promises, and ES6+ features form the foundation of modern web development.

2. **API Design and Integration**: Today's web applications rarely exist in isolation. Knowing how to design, consume, and integrate with APIs is vital for creating interconnected experiences.

3. **Performance Optimization**: Users expect lightning-fast experiences. Being able to identify and resolve performance bottlenecks in your code can make the difference between a successful application and an abandoned one.

4. **Responsive Design**: With the proliferation of devices of all shapes and sizes, creating interfaces that work well on everything from smartphones to ultra-wide displays is no longer optional.

5. **Testing and Debugging**: Writing code that works is one thing; writing code that continues to work as your application grows is another. A systematic approach to testing and debugging will save countless hours in the long run.

While frameworks and tools will come and go, these fundamental skills will serve you well throughout your career. What skills would you add to this list?`,
      coverImage: "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
      tags: ["Web Development", "Career", "Skills", "JavaScript"],
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      authorId: userId,
      isPublished: true
    },
    {
      title: "Embracing the Power of TypeScript in React Applications",
      slug: "embracing-power-typescript-react",
      summary: "How TypeScript has transformed my React development workflow and improved code quality.",
      content: `When I first encountered TypeScript, I was skeptical. Did I really need types in my JavaScript? Wasn't the flexibility of JS one of its greatest strengths? Fast forward a couple of years, and I can't imagine building a React application without TypeScript.

The benefits became apparent quickly:

**Improved Developer Experience**: TypeScript's intelligent code completion and inline documentation make exploring new libraries and APIs much more intuitive. The editor becomes a guide rather than just a text input tool.

**Catching Bugs Early**: So many runtime errors simply disappear because they're caught during development. Those frustrating undefined is not a function errors become a thing of the past.

**Self-Documenting Code**: When you define interfaces and types properly, your code becomes inherently more readable. New team members can understand what data structures you're working with without having to trace through the entire codebase.

**Safer Refactoring**: When it's time to make changes, TypeScript has your back. Rename a property in an interface, and the compiler will flag every place that needs to be updated.

Of course, there's a learning curve. TypeScript introduces concepts like generics, union types, and type assertions that take time to master. But the investment pays dividends in code quality and development speed.

If you're on the fence about TypeScript, I encourage you to give it a serious try on your next project. The initial friction is quickly outweighed by the benefits, especially as your application grows in complexity.`,
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80",
      tags: ["TypeScript", "React", "JavaScript", "Development"],
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      authorId: userId,
      isPublished: true
    }
  ];
  
  for (const post of samplePosts) {
    const [insertedPost] = await db.insert(blogPosts).values(post).returning();
    
    // Add sample comments for the first post
    if (post.slug === "journey-building-portfolio-website") {
      await db.insert(blogComments).values([
        {
          postId: insertedPost.id,
          name: "Sarah Johnson",
          email: "sarah@example.com",
          content: "Great insights into your development process! I especially liked how you approached the UI/UX challenges.",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          isApproved: true
        },
        {
          postId: insertedPost.id,
          name: "Mike Chen",
          email: "mike@example.com",
          content: "Your portfolio looks amazing! What was the most challenging part of building it?",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isApproved: true
        }
      ]);
    }
  }
  
  console.log(`Seeded ${samplePosts.length} blog posts`);
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    await seedProjects();
    await seedSkills();
    await seedBlogPosts();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();