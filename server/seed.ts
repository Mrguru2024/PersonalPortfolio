import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local file:', error);
}

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
} from '../app/lib/data';

async function seedProjects() {
  console.log('Seeding projects...');
  
  try {
    // Clear existing projects (ignore error if table doesn't exist)
    await db.delete(projects);
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.log('Projects table does not exist yet. Please run: npm run db:push');
      return;
    }
    throw error;
  }
  
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
  
  try {
    // Clear existing blog posts and comments (ignore error if tables don't exist)
    await db.delete(blogComments);
    await db.delete(blogPosts);
  } catch (error: any) {
    if (error?.code === '42P01') {
      console.log('Blog tables do not exist yet. Please run: npm run db:push');
      return;
    }
    throw error;
  }
  
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
  
  // Seed blog posts with relevant content for a portfolio site
  const samplePosts = [
    {
      title: "Migrating from Vite to Next.js: A Complete Guide",
      slug: "migrating-vite-to-nextjs-complete-guide",
      summary: "Learn how I migrated my portfolio from Vite to Next.js 15, including App Router setup, API routes, and SEO improvements.",
      content: `When I decided to migrate my portfolio from Vite to Next.js, I knew it would be a significant undertaking. However, the benefits of server-side rendering, built-in API routes, and improved SEO made it worth the effort.

## Why Next.js?

Next.js offers several advantages over a pure client-side React application:
- **Server-Side Rendering (SSR)**: Better SEO and faster initial page loads
- **API Routes**: Built-in backend functionality without a separate Express server
- **Image Optimization**: Automatic image optimization and lazy loading
- **File-Based Routing**: Intuitive routing system with the App Router

## The Migration Process

The migration involved several key steps:

1. **Setting up Next.js App Router**: Creating the new directory structure with app/ folder
2. **Converting API Routes**: Moving Express endpoints to Next.js API route handlers
3. **Updating Components**: Ensuring all components are compatible with SSR
4. **SEO Improvements**: Replacing react-helmet with Next.js Metadata API
5. **State Management**: Adapting client-side state for Next.js patterns

## Challenges and Solutions

One of the biggest challenges was handling client-side only code during SSR. I had to add proper guards for window and localStorage access, and separate client components from server components.

Another challenge was converting Express middleware to Next.js middleware. The session management required a different approach, using Next.js cookies API instead of express-session.

## Results

The migration was successful, and the site now benefits from:
- Faster initial load times
- Better SEO rankings
- Simplified deployment on Vercel
- Improved developer experience with Next.js tooling

If you're considering a similar migration, I'd recommend taking it step by step and testing thoroughly at each stage.`,
      coverImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
      tags: ["Next.js", "React", "Migration", "Web Development", "TypeScript"],
      publishedAt: new Date(),
      updatedAt: new Date(),
      authorId: userId,
      isPublished: true
    },
    {
      title: "Building a Modern Portfolio with Next.js 15 and Tailwind CSS",
      slug: "building-modern-portfolio-nextjs-tailwind",
      summary: "A comprehensive guide to creating a beautiful, responsive portfolio website using Next.js 15 and Tailwind CSS.",
      content: `Creating a portfolio website that stands out requires more than just showcasing your projects. It needs to tell your story, demonstrate your skills, and provide an excellent user experience.

## Design Philosophy

When designing my portfolio, I focused on:
- **Clean, Modern Aesthetics**: Using Tailwind CSS for consistent, beautiful styling
- **Responsive Design**: Ensuring the site looks great on all devices
- **Performance**: Optimizing for fast load times and smooth interactions
- **Accessibility**: Making sure the site is usable by everyone

## Tech Stack

- **Next.js 15**: For server-side rendering and API routes
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For utility-first styling
- **Drizzle ORM**: For database management
- **PostgreSQL**: For data storage

## Key Features

The portfolio includes several interactive features:
- **Project Showcase**: Dynamic project cards with hover effects
- **Skills Section**: Visual representation of technical skills
- **Blog Integration**: A blog section to share thoughts and insights
- **Contact Form**: Easy way for potential clients to reach out
- **Dark Mode**: User preference for light or dark theme

## Lessons Learned

Building this portfolio taught me a lot about modern web development. The combination of Next.js and Tailwind CSS makes it incredibly fast to iterate and build beautiful interfaces.

The most important lesson? Start simple and add complexity gradually. It's easy to get overwhelmed with features, but a clean, focused portfolio often makes a stronger impression.`,
      coverImage: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      tags: ["Next.js", "Tailwind CSS", "Portfolio", "Web Design", "Frontend"],
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      authorId: userId,
      isPublished: true
    },
    {
      title: "5 Essential Skills Every Modern Web Developer Should Master",
      slug: "5-essential-skills-modern-web-developer",
      summary: "A look at the key skills that separate good developers from great ones in today's tech landscape.",
      content: `The tech landscape evolves at a breakneck pace, and web developers need to constantly adapt to stay relevant. Here are five essential skills I believe every modern web developer should master:

## 1. JavaScript Fundamentals

Despite the rise of frameworks and libraries, a solid understanding of vanilla JavaScript remains crucial. Concepts like closures, promises, async/await, and ES6+ features form the foundation of modern web development.

Understanding how JavaScript works under the hood will make you a better developer, regardless of which framework you're using.

## 2. API Design and Integration

Today's web applications rarely exist in isolation. Knowing how to design, consume, and integrate with APIs is vital for creating interconnected experiences.

Whether you're building REST APIs, working with GraphQL, or integrating third-party services, API knowledge is essential.

## 3. Performance Optimization

Users expect lightning-fast experiences. Being able to identify and resolve performance bottlenecks in your code can make the difference between a successful application and an abandoned one.

Key areas to focus on:
- Code splitting and lazy loading
- Image optimization
- Caching strategies
- Database query optimization

## 4. Responsive Design

With the proliferation of devices of all shapes and sizes, creating interfaces that work well on everything from smartphones to ultra-wide displays is no longer optional.

CSS Grid, Flexbox, and modern layout techniques make responsive design more accessible than ever.

## 5. Testing and Debugging

Writing code that works is one thing; writing code that continues to work as your application grows is another. A systematic approach to testing and debugging will save countless hours in the long run.

While frameworks and tools will come and go, these fundamental skills will serve you well throughout your career.`,
      coverImage: "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
      tags: ["Web Development", "Career", "Skills", "JavaScript", "Best Practices"],
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      authorId: userId,
      isPublished: true
    },
    {
      title: "Embracing the Power of TypeScript in React Applications",
      slug: "embracing-power-typescript-react",
      summary: "How TypeScript has transformed my React development workflow and improved code quality.",
      content: `When I first encountered TypeScript, I was skeptical. Did I really need types in my JavaScript? Wasn't the flexibility of JS one of its greatest strengths? Fast forward a couple of years, and I can't imagine building a React application without TypeScript.

## The Benefits

The benefits became apparent quickly:

**Improved Developer Experience**: TypeScript's intelligent code completion and inline documentation make exploring new libraries and APIs much more intuitive. The editor becomes a guide rather than just a text input tool.

**Catching Bugs Early**: So many runtime errors simply disappear because they're caught during development. Those frustrating "undefined is not a function" errors become a thing of the past.

**Self-Documenting Code**: When you define interfaces and types properly, your code becomes inherently more readable. New team members can understand what data structures you're working with without having to trace through the entire codebase.

**Safer Refactoring**: When it's time to make changes, TypeScript has your back. Rename a property in an interface, and the compiler will flag every place that needs to be updated.

## The Learning Curve

Of course, there's a learning curve. TypeScript introduces concepts like generics, union types, and type assertions that take time to master. But the investment pays dividends in code quality and development speed.

## Getting Started

If you're on the fence about TypeScript, I encourage you to give it a serious try on your next project. Start with basic types and gradually incorporate more advanced features as you become comfortable.

The initial friction is quickly outweighed by the benefits, especially as your application grows in complexity.`,
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      tags: ["TypeScript", "React", "JavaScript", "Development", "Best Practices"],
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      authorId: userId,
      isPublished: true
    },
    {
      title: "The Future of Web Development: Trends to Watch in 2025",
      slug: "future-web-development-trends-2025",
      summary: "Exploring the emerging technologies and trends that will shape web development in the coming year.",
      content: `As we look ahead to 2025, several exciting trends are shaping the future of web development. Here's what I'm keeping an eye on:

## Server Components and RSC

React Server Components (RSC) are revolutionizing how we think about component architecture. By moving more logic to the server, we can reduce bundle sizes and improve performance.

Next.js 15 has excellent support for RSC, making it easier than ever to build performant applications.

## AI-Powered Development

AI tools like GitHub Copilot and ChatGPT are becoming integral to the development workflow. They're not replacing developers, but they're making us more productive.

From code generation to debugging assistance, AI is helping developers focus on solving complex problems rather than writing boilerplate.

## Edge Computing

Edge computing is bringing computation closer to users, reducing latency and improving performance. Platforms like Vercel Edge Functions and Cloudflare Workers make it easier to deploy edge functions.

## WebAssembly

WebAssembly (WASM) is opening up new possibilities for web applications. While still emerging, it's enabling high-performance applications that were previously impossible in the browser.

## Sustainability in Web Development

There's a growing awareness of the environmental impact of web applications. Developers are focusing on:
- Reducing bundle sizes
- Optimizing images and assets
- Minimizing server requests
- Using efficient algorithms

## Conclusion

The web development landscape continues to evolve rapidly. Staying current with these trends will help you build better applications and advance your career.

What trends are you most excited about?`,
      coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80",
      tags: ["Web Development", "Trends", "Technology", "Future", "Innovation"],
      publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      authorId: userId,
      isPublished: true
    },
    {
      title: "Best Practices for API Design in Next.js Applications",
      slug: "best-practices-api-design-nextjs",
      summary: "Learn how to design clean, maintainable API routes in Next.js with proper error handling and type safety.",
      content: `Designing APIs in Next.js is different from traditional Express.js applications. Here are some best practices I've learned:

## Route Handler Structure

Next.js API routes use a simple file-based routing system. Each route handler should be focused and handle a single responsibility.

Example code structure:
// app/api/posts/route.ts
export async function GET(req: NextRequest) {
  // Handle GET requests
}

export async function POST(req: NextRequest) {
  // Handle POST requests
}

## Error Handling

Proper error handling is crucial. Always return appropriate HTTP status codes and meaningful error messages.

Example error handling:
try {
  // Your logic here
} catch (error) {
  return NextResponse.json(
    { error: "Something went wrong" },
    { status: 500 }
  );
}

## Type Safety

Use TypeScript to ensure type safety across your API. Define interfaces for request and response types.

## Authentication

Implement proper authentication checks in your API routes. Use middleware or helper functions to verify user sessions.

## Validation

Always validate input data. Use libraries like Zod to ensure data integrity before processing.

## Response Formatting

Keep your API responses consistent. Use a standard format for success and error responses.

These practices will help you build robust, maintainable APIs in Next.js.`,
      coverImage: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
      tags: ["Next.js", "API", "Backend", "Best Practices", "TypeScript"],
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      authorId: userId,
      isPublished: true
    }
  ];
  
  for (const post of samplePosts) {
    const [insertedPost] = await db.insert(blogPosts).values(post).returning();
    
    // Add sample comments for the first post
    if (post.slug === "migrating-vite-to-nextjs-complete-guide") {
      await db.insert(blogComments).values([
        {
          postId: insertedPost.id,
          name: "Sarah Johnson",
          email: "sarah@example.com",
          content: "Great guide! I'm planning a similar migration. How long did the entire process take?",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isApproved: true
        },
        {
          postId: insertedPost.id,
          name: "Mike Chen",
          email: "mike@example.com",
          content: "This is exactly what I needed! The section on handling SSR was particularly helpful.",
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
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