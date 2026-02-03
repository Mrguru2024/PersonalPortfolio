export const blogSeedPosts = [
  {
    title: "Migrating from Vite to Next.js: A Complete Guide",
    slug: "migrating-vite-to-nextjs-complete-guide",
    summary:
      "Learn how I migrated my portfolio from Vite to Next.js 15, including App Router setup, API routes, and SEO improvements.",
    content: `<p>After running my portfolio on Vite and React for a while, I decided to migrate to Next.js 15. The move wasn’t trivial—new routing, new data patterns, and a different mental model—but the payoff in SEO, performance, and developer experience was worth it. In this article I share exactly why I made the switch, how the migration went, and what I’d do again (or differently) so you can plan your own.</p>

<h2>Why I Chose Next.js Over Vite</h2>
<p>Vite is great for fast local development and simple SPAs. For a portfolio that needs to rank well and load quickly on all devices, I wanted server-side rendering, built-in API routes, and a single codebase that could handle both static and dynamic pages. Next.js 15 with the App Router delivered that.</p>
<p>Concrete benefits I care about:</p>
<ul>
<li><strong>Server-Side Rendering (SSR)</strong>: Pages are rendered on the server, so search engines and users get full HTML from the first request. That improved my Core Web Vitals and made SEO much easier than with a client-only React app.</li>
<li><strong>API Routes</strong>: I no longer need a separate Express server. Route handlers in <code>app/api/</code> handle contact forms, blog data, and other backend logic. One deployment, one domain, fewer moving parts.</li>
<li><strong>Image Optimization</strong>: The Next.js Image component (and underlying optimization) handles responsive sizes, lazy loading, and modern formats automatically. I moved from manual image setup to declarative, optimized assets.</li>
<li><strong>File-Based Routing</strong>: The App Router’s file and folder structure maps directly to URLs. Nested layouts, loading states, and error boundaries live next to the routes they serve, which keeps the project easy to navigate.</li>
</ul>
<p>If you’re building a <a href="/blog/building-modern-portfolio-nextjs-tailwind">modern portfolio with Next.js and Tailwind</a>, the same stack applies. For structuring those API routes, see <a href="/blog/best-practices-api-design-nextjs">best practices for API design in Next.js</a>.</p>

<h2>The Migration Process: Step by Step</h2>
<p>I didn’t do a big-bang rewrite. I migrated in stages so the site kept working and I could validate each step.</p>
<ol>
<li><strong>App Router setup</strong>: I created the new <code>app/</code> directory, moved the root layout (<code>layout.tsx</code>), and set up global styles and fonts. The old Vite entry stayed in place until the new app was usable.</li>
<li><strong>Converting API routes</strong>: Each Express endpoint became a route handler under <code>app/api/</code>. Request/response logic stayed similar; only the API shape (NextRequest/NextResponse) changed. I kept shared validation and DB access in lib modules.</li>
<li><strong>Updating components</strong>: Components that used <code>window</code>, <code>localStorage</code>, or browser-only APIs got a <code>"use client"</code> directive and, where needed, guards so they don’t run during SSR. Everything else stayed as server components by default.</li>
<li><strong>SEO</strong>: I replaced react-helmet (and any manual meta tags) with the Next.js Metadata API. Each page and layout can export <code>metadata</code> or <code>generateMetadata</code>, and Next.js handles title, description, and Open Graph tags in one place.</li>
<li><strong>State and data</strong>: Client-side state (e.g. React Query) stayed; I only adjusted how and where it’s used so it plays nicely with server-rendered content. Fetching moved to server components or route handlers where it made sense.</li>
</ol>

<h2>Challenges and How I Solved Them</h2>
<p>The trickiest part was code that assumed a browser. Anything touching <code>window</code>, <code>localStorage</code>, or <code>document</code> had to run only on the client. I used <code>"use client"</code> for those components and, in a few places, <code>typeof window !== "undefined"</code> checks or useEffect for one-time init. Session and auth moved from express-session to cookies and Next.js middleware, which simplified cross-route auth.</p>
<p>Another bump was environment variables: in Vite they’re exposed via <code>import.meta.env</code>; in Next.js they’re in <code>process.env</code> and have different visibility for server vs client. I prefixed client-safe vars with <code>NEXT_PUBLIC_</code> and kept secrets server-only.</p>

<h2>Results and What I’d Do Again</h2>
<p>After the migration, initial load times improved, Lighthouse scores went up, and deploying to Vercel became a single push. The codebase is easier to reason about: routing, API, and UI live in one tree. If I were to do it again, I’d still migrate incrementally and add tests (or at least smoke checks) for critical paths before and after each step.</p>
<p>If you’re considering a similar move, take it step by step and test at each stage. Need a hand with your own site? Check out <a href="/#services">my web development services</a> or <a href="/#contact">get in touch</a> for a quote.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
    tags: ["Next.js", "React", "Migration", "Web Development", "TypeScript"],
    publishedAt: new Date(),
    updatedAt: new Date(),
    authorId: 1,
    isPublished: true,
    metaTitle: "Migrating from Vite to Next.js 15: Complete Guide | MrGuru.dev",
    metaDescription:
      "Step-by-step guide to migrating a Vite React app to Next.js 15: App Router, API routes, SSR, and SEO. Real experience from a production portfolio migration.",
    keywords: [
      "Next.js migration",
      "Vite to Next.js",
      "React SSR",
      "App Router",
      "SEO",
    ],
    canonicalUrl:
      "https://mrguru.dev/blog/migrating-vite-to-nextjs-complete-guide",
    ogTitle: "Migrating from Vite to Next.js: A Complete Guide",
    ogDescription:
      "Learn how to migrate a Vite portfolio to Next.js 15 with App Router, API routes, and better SEO.",
    ogImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
    internalLinks: [
      {
        text: "modern portfolio with Next.js and Tailwind",
        url: "/blog/building-modern-portfolio-nextjs-tailwind",
      },
      {
        text: "best practices for API design in Next.js",
        url: "/blog/best-practices-api-design-nextjs",
      },
      { text: "my web development services", url: "/#services" },
      { text: "get in touch", url: "/#contact" },
    ],
    externalLinks: [
      {
        text: "Next.js documentation",
        url: "https://nextjs.org/docs",
        nofollow: true,
      },
    ],
    readingTime: 8,
  },
  {
    title: "Building a Modern Portfolio with Next.js 15 and Tailwind CSS",
    slug: "building-modern-portfolio-nextjs-tailwind",
    summary:
      "A comprehensive guide to creating a beautiful, responsive portfolio website using Next.js 15 and Tailwind CSS.",
    content: `<p>A portfolio site should tell your story, showcase your work, and make it easy for clients and employers to reach you. I built this site with Next.js 15 and Tailwind CSS to do exactly that—fast, responsive, and easy to maintain. In this article I walk through the design choices, tech stack, and features so you can apply the same approach to your own.</p>

<h2>Design Philosophy</h2>
<p>I wanted the site to feel professional without feeling generic. That meant clear typography, plenty of whitespace, and a layout that works on phones and desktops. I avoided heavy animations and kept the focus on content: projects, skills, and a straightforward way to get in touch.</p>
<p>Tailwind CSS made it easy to keep spacing, colors, and breakpoints consistent. I defined a small set of tokens (colors, font sizes) in the config and used utility classes everywhere else. After <a href="/blog/migrating-vite-to-nextjs-complete-guide">migrating from Vite to Next.js</a>, the same Tailwind setup carried over with minimal changes.</p>

<h2>Tech Stack</h2>
<p>Every choice was aimed at speed, clarity, and long-term maintainability.</p>
<ul>
<li><strong>Next.js 15</strong>: Server-side rendering for SEO and fast first paint, plus API routes for forms and data. The App Router keeps pages and layouts in one clear structure.</li>
<li><strong>TypeScript</strong>: Type safety across the app and API. Interfaces for props and API responses cut down on runtime bugs and make refactors safer.</li>
<li><strong>Tailwind CSS</strong>: Utility-first styling with a design system in code. No context switching to a separate CSS file for small tweaks; responsive and dark mode come from the same classes.</li>
<li><strong>Drizzle ORM and PostgreSQL</strong>: The blog, contact submissions, and other dynamic data live in Postgres. Drizzle gives type-safe queries and migrations without a heavy ORM layer.</li>
</ul>

<h2>Key Features</h2>
<p>The portfolio centers on a few high-impact areas: a project showcase, a <a href="/#skills">skills section</a>, a blog for longer-form content, and a <a href="/#contact">contact form</a> for inquiries. Dark mode is supported via a theme toggle and CSS variables so the whole site switches without flicker.</p>
<p>Under the hood, the contact form and blog rely on Next.js API routes. For how to structure those routes and handle errors and validation, see <a href="/blog/best-practices-api-design-nextjs">best practices for API design in Next.js</a>. For the broader skill set that goes into building and maintaining a site like this, read <a href="/blog/5-essential-skills-modern-web-developer">5 essential skills every modern web developer should master</a>.</p>

<h2>Lessons Learned</h2>
<p>I started with a minimal homepage and added sections one at a time. That kept the scope manageable and made it easier to ship. My advice: get something live first, then iterate. A focused portfolio that loads fast and works on mobile often makes a stronger impression than a feature-heavy site that’s still “almost done.”</p>
<p>Ready to build yours? Explore <a href="/#services">my services</a> or <a href="/#contact">request a quote</a> and we can talk through your project.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    tags: ["Next.js", "Tailwind CSS", "Portfolio", "Web Design", "Frontend"],
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    authorId: 1,
    isPublished: true,
    metaTitle:
      "Building a Modern Portfolio with Next.js 15 and Tailwind CSS | MrGuru.dev",
    metaDescription:
      "Guide to building a responsive developer portfolio with Next.js 15, Tailwind CSS, TypeScript, and Drizzle. Design, tech stack, and lessons learned.",
    keywords: [
      "Next.js portfolio",
      "Tailwind CSS",
      "developer portfolio",
      "React",
      "TypeScript",
    ],
    canonicalUrl:
      "https://mrguru.dev/blog/building-modern-portfolio-nextjs-tailwind",
    ogTitle: "Building a Modern Portfolio with Next.js 15 and Tailwind CSS",
    ogDescription:
      "How to create a beautiful, responsive portfolio with Next.js 15 and Tailwind CSS.",
    ogImage:
      "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    internalLinks: [
      {
        text: "migrating from Vite to Next.js",
        url: "/blog/migrating-vite-to-nextjs-complete-guide",
      },
      { text: "skills section", url: "/#skills" },
      { text: "contact form", url: "/#contact" },
      {
        text: "best practices for API design in Next.js",
        url: "/blog/best-practices-api-design-nextjs",
      },
      {
        text: "5 essential skills every modern web developer should master",
        url: "/blog/5-essential-skills-modern-web-developer",
      },
      { text: "my services", url: "/#services" },
      { text: "request a quote", url: "/#contact" },
    ],
    externalLinks: [
      {
        text: "Tailwind CSS docs",
        url: "https://tailwindcss.com/docs",
        nofollow: true,
      },
    ],
    readingTime: 6,
  },
  {
    title: "5 Essential Skills Every Modern Web Developer Should Master",
    slug: "5-essential-skills-modern-web-developer",
    summary:
      "The key skills that separate good developers from great ones: JavaScript, APIs, performance, responsive design, and testing.",
    content: `<p>Web development moves quickly—new frameworks, new tools, new best practices. The skills that stay valuable are the ones that transfer across stacks and years. Here are five areas I focus on to stay effective as a developer, with practical pointers you can use today.</p>

<h2>1. JavaScript Fundamentals</h2>
<p>React, Vue, and Svelte all compile to JavaScript. Understanding the language itself—closures, promises, async/await, and ES6+ features—makes you better in any framework. When you hit a bug or need to optimize, the answer often comes from how JavaScript works, not from framework docs.</p>
<p>Once you’re comfortable with vanilla JS, adding types pays off. <a href="/blog/embracing-power-typescript-react">TypeScript in React</a> (and in Node APIs) catches errors early and makes refactoring safer. Start with basic types and add stricter options as you go.</p>

<h2>2. API Design and Integration</h2>
<p>Most apps talk to at least one API—your own backend, a third-party service, or both. Being able to design clear, consistent endpoints and consume them reliably is core. Think about status codes, error shapes, and versioning from the start.</p>
<p>For Next.js apps, route handlers are the natural place for API logic. <a href="/blog/best-practices-api-design-nextjs">Best practices for API design in Next.js</a> covers structure, validation, and error handling so your frontend and backend stay in sync.</p>

<h2>3. Performance Optimization</h2>
<p>Users expect fast load times and smooth interactions. That means code splitting, lazy loading, and paying attention to bundle size. On the server, caching, database indexing, and efficient queries matter just as much.</p>
<p>Trends in <a href="/blog/future-web-development-trends-2025">the future of web development</a>—server components, edge runtimes, smaller JS—all point toward faster, leaner apps. Investing in performance now makes it easier to adopt those patterns later.</p>

<h2>4. Responsive Design</h2>
<p>Sites need to work on phones, tablets, and desktops. CSS Grid, Flexbox, and relative units (rem, %, vw/vh) are the building blocks. I design mobile-first and then add breakpoints for larger screens so the default is the most constrained layout.</p>
<p>In my <a href="/blog/building-modern-portfolio-nextjs-tailwind">portfolio build guide</a>, I walk through a responsive-first approach with Tailwind: one set of utilities, consistent spacing, and dark mode without extra complexity.</p>

<h2>5. Testing and Debugging</h2>
<p>Bugs will happen. The faster you can isolate and fix them, the more time you spend building. Learn your tools: browser DevTools, network tab, React DevTools (or equivalent), and at least one way to run automated tests—even a few smoke tests for critical paths.</p>
<p>These habits outlast any single framework. If you want to apply them on a real project, check out <a href="/#services">my development services</a> or <a href="/#contact">contact me</a> and we can talk through your goals.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    tags: [
      "Web Development",
      "Career",
      "Skills",
      "JavaScript",
      "Best Practices",
    ],
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    authorId: 1,
    isPublished: true,
    metaTitle:
      "5 Essential Skills Every Modern Web Developer Should Master | MrGuru.dev",
    metaDescription:
      "Key skills for web developers: JavaScript, API design, performance, responsive design, and testing. Practical advice from a full-stack developer.",
    keywords: [
      "web developer skills",
      "JavaScript",
      "API design",
      "performance",
      "responsive design",
    ],
    canonicalUrl:
      "https://mrguru.dev/blog/5-essential-skills-modern-web-developer",
    ogTitle: "5 Essential Skills Every Modern Web Developer Should Master",
    ogDescription:
      "JavaScript, APIs, performance, responsive design, and testing: the skills that separate good developers from great ones.",
    ogImage:
      "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    internalLinks: [
      {
        text: "TypeScript in React",
        url: "/blog/embracing-power-typescript-react",
      },
      {
        text: "best practices for API design in Next.js",
        url: "/blog/best-practices-api-design-nextjs",
      },
      {
        text: "future of web development",
        url: "/blog/future-web-development-trends-2025",
      },
      {
        text: "portfolio build guide",
        url: "/blog/building-modern-portfolio-nextjs-tailwind",
      },
      { text: "my development services", url: "/#services" },
      { text: "contact me", url: "/#contact" },
    ],
    externalLinks: [
      {
        text: "MDN JavaScript guide",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        nofollow: true,
      },
    ],
    readingTime: 7,
  },
  {
    title: "Embracing the Power of TypeScript in React Applications",
    slug: "embracing-power-typescript-react",
    summary:
      "How TypeScript has transformed my React development workflow and improved code quality.",
    content: `<p>I was initially skeptical about TypeScript—extra syntax, another build step, and a learning curve. A few years on, I wouldn’t start a React app without it. In this article I share why the investment pays off and how to get started without getting stuck.</p>

<h2>The Benefits of TypeScript in React</h2>
<p>TypeScript improves both the day-to-day experience and the long-term health of the codebase.</p>
<p><strong>Better developer experience</strong>: Code completion and inline docs make exploring libraries and APIs much easier. You spend less time jumping to docs and more time writing logic. Hover over a prop or a function and you see its shape and comments.</p>
<p><strong>Fewer bugs</strong>: Many runtime errors—wrong types, missing props, typos in object keys—are caught at compile time. The editor highlights issues before you save, and the build fails if something doesn’t match. That reduces debugging time and makes refactors safer.</p>
<p><strong>Self-documenting code</strong>: Interfaces and types make data structures explicit. New teammates (or future you) can read a type definition and understand what an API returns or what a component expects without guessing.</p>
<p><strong>Safer refactoring</strong>: Rename a prop or change a function signature and the compiler shows every place that needs to update. You can refactor with confidence instead of hoping grep caught everything.</p>

<h2>The Learning Curve</h2>
<p>Generics, union types, and type assertions take time to master. Start with the basics: primitive types, interfaces, and typing props and state. Add generics when you need reusable types (e.g. for a list component or an API helper). Use <code>unknown</code> and type guards when you’re not sure what you’re getting.</p>
<p>If you’re building a <a href="/blog/building-modern-portfolio-nextjs-tailwind">Next.js and Tailwind portfolio</a> or designing <a href="/blog/best-practices-api-design-nextjs">APIs in Next.js</a>, TypeScript fits in from day one. Next.js and React both ship with type definitions, so you get autocomplete and checks out of the box.</p>

<h2>Getting Started</h2>
<p>Add TypeScript to an existing React project with <code>npx tsc --init</code> and then gradually type one file at a time. Use <code>any</code> sparingly—prefer <code>unknown</code> and narrow with type guards when you need to escape. Let the compiler guide you: fix the errors it reports and you’ll learn the type system as you go.</p>
<p>For more on the skills that matter in modern web development, read <a href="/blog/5-essential-skills-modern-web-developer">5 essential skills every modern web developer should master</a>. Need help on a project? See <a href="/#services">my services</a> or <a href="/#contact">get in touch</a>.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    tags: [
      "TypeScript",
      "React",
      "JavaScript",
      "Development",
      "Best Practices",
    ],
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    authorId: 1,
    isPublished: true,
    metaTitle: "TypeScript in React: Why and How to Adopt It | MrGuru.dev",
    metaDescription:
      "How TypeScript improves React development: better DX, fewer bugs, self-documenting code, and safer refactoring. Practical getting-started advice.",
    keywords: [
      "TypeScript",
      "React",
      "JavaScript",
      "type safety",
      "developer experience",
    ],
    canonicalUrl: "https://mrguru.dev/blog/embracing-power-typescript-react",
    ogTitle: "Embracing the Power of TypeScript in React Applications",
    ogDescription:
      "Why TypeScript in React is worth the learning curve: benefits and how to get started.",
    ogImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    internalLinks: [
      {
        text: "Next.js and Tailwind portfolio",
        url: "/blog/building-modern-portfolio-nextjs-tailwind",
      },
      {
        text: "APIs in Next.js",
        url: "/blog/best-practices-api-design-nextjs",
      },
      {
        text: "5 essential skills every modern web developer should master",
        url: "/blog/5-essential-skills-modern-web-developer",
      },
      { text: "my services", url: "/#services" },
      { text: "get in touch", url: "/#contact" },
    ],
    externalLinks: [
      {
        text: "TypeScript handbook",
        url: "https://www.typescriptlang.org/docs/handbook/",
        nofollow: true,
      },
    ],
    readingTime: 6,
  },
  {
    title: "The Future of Web Development: Trends to Watch in 2025",
    slug: "future-web-development-trends-2025",
    summary:
      "Emerging technologies and trends shaping web development: RSC, AI tooling, edge, WebAssembly, and sustainability.",
    content: `<p>Web development keeps evolving—new runtimes, new tooling, and new expectations from users and search engines. Here’s what I’m watching in 2025 and how it connects to the stack we use today, so you can stay ahead without chasing every trend.</p>

<h2>Server Components and React Server Components (RSC)</h2>
<p>React Server Components are changing how we structure apps. More logic runs on the server, so the client bundle shrinks and initial load gets faster. Components that don’t need interactivity stay on the server; only the interactive parts ship as client JS. Next.js 15 supports RSC out of the box, so if you’re <a href="/blog/migrating-vite-to-nextjs-complete-guide">migrating to Next.js</a> or <a href="/blog/building-modern-portfolio-nextjs-tailwind">building with Next.js 15</a>, you can adopt them incrementally.</p>
<p>Start by moving data-fetching and static content to server components, and keep “use client” for components that use state, effects, or browser APIs. The mental model takes a bit of getting used to, but the performance and simplicity pay off.</p>

<h2>AI-Powered Development</h2>
<p>AI-assisted coding is part of the workflow now—drafting code, explaining errors, and generating tests or boilerplate. These tools work best when you have strong fundamentals: you still need to read, review, and debug. Pair AI with the skills that matter: <a href="/blog/5-essential-skills-modern-web-developer">essential web developer skills</a> and <a href="/blog/embracing-power-typescript-react">TypeScript in React</a> so you can evaluate and improve what the model suggests.</p>
<p>Use AI to speed up repetitive tasks and explore unfamiliar APIs; don’t rely on it to replace understanding. The developers who thrive will be the ones who combine AI productivity with solid engineering judgment.</p>

<h2>Edge and WebAssembly</h2>
<p>Edge computing brings your backend closer to users—lower latency, faster responses, and the ability to run logic at the edge in runtimes like Vercel Edge or Cloudflare Workers. WebAssembly (Wasm) is making it possible to run heavier workloads in the browser and on the server with near-native performance. Together they’re enabling faster, more capable web apps without sacrificing security or portability.</p>
<p>You don’t have to adopt everything at once. Start with edge for a few routes (e.g. API handlers that need low latency) and explore Wasm when you hit performance limits in JS. Staying current with these trends helps you build better products and advance your career.</p>

<h2>Sustainability and Performance</h2>
<p>Smaller bundles, optimized assets, fewer network requests, and efficient algorithms aren’t just good for users—they’re good for the planet. Less data transfer and less compute mean lower energy use. Good performance practice is also sustainable practice: lazy loading, code splitting, and caching all reduce waste.</p>
<p>Interested in building something future-ready? Explore <a href="/#services">my services</a> or <a href="/#contact">reach out</a> and we can talk about your next project.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80",
    tags: ["Web Development", "Trends", "Technology", "Future", "Innovation"],
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    authorId: 1,
    isPublished: true,
    metaTitle:
      "Web Development Trends 2025: RSC, AI, Edge, Sustainability | MrGuru.dev",
    metaDescription:
      "Trends shaping web development in 2025: React Server Components, AI tooling, edge computing, WebAssembly, and sustainable practices.",
    keywords: [
      "web development 2025",
      "React Server Components",
      "edge computing",
      "WebAssembly",
      "sustainability",
    ],
    canonicalUrl: "https://mrguru.dev/blog/future-web-development-trends-2025",
    ogTitle: "The Future of Web Development: Trends to Watch in 2025",
    ogDescription:
      "RSC, AI, edge, WebAssembly, and sustainability: what’s shaping web development in 2025.",
    ogImage:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80",
    internalLinks: [
      {
        text: "Next.js migration",
        url: "/blog/migrating-vite-to-nextjs-complete-guide",
      },
      {
        text: "building with Next.js 15",
        url: "/blog/building-modern-portfolio-nextjs-tailwind",
      },
      {
        text: "essential web developer skills",
        url: "/blog/5-essential-skills-modern-web-developer",
      },
      {
        text: "TypeScript in React",
        url: "/blog/embracing-power-typescript-react",
      },
      { text: "my services", url: "/#services" },
      { text: "reach out", url: "/#contact" },
    ],
    externalLinks: [
      {
        text: "React Server Components",
        url: "https://react.dev/reference/react/use-server",
        nofollow: true,
      },
    ],
    readingTime: 6,
  },
  {
    title: "Best Practices for API Design in Next.js Applications",
    slug: "best-practices-api-design-nextjs",
    summary:
      "Learn how to design clean, maintainable API routes in Next.js with proper error handling and type safety.",
    content: `<p>Next.js API routes are different from a traditional Express server—each route is a single file, and request/response handling follows a specific pattern. In this article I share practices that keep those routes clean, type-safe, and easy to maintain.</p>

<h2>Route Handler Structure</h2>
<p>Use the file-based routing that Next.js gives you: one route per file (or per dynamic segment). Put route handlers under <code>app/api/</code> and group by feature (e.g. <code>app/api/contact/route.ts</code>, <code>app/api/blog/[slug]/route.ts</code>). Each file exports <code>GET</code>, <code>POST</code>, etc., as needed. Keep route logic thin—validate input, call a service or DB, return a response. Move business logic into lib or server modules so it can be reused and tested.</p>
<p>For the full Next.js picture—how routes fit with the App Router and SSR—see <a href="/blog/migrating-vite-to-nextjs-complete-guide">migrating from Vite to Next.js</a> and <a href="/blog/building-modern-portfolio-nextjs-tailwind">building a portfolio with Next.js</a>.</p>

<h2>Error Handling and Status Codes</h2>
<p>Return the right status codes: <code>200</code> or <code>201</code> for success, <code>400</code> for bad input, <code>401</code> for unauthenticated, <code>404</code> for not found, <code>500</code> for server errors. Use <code>NextResponse.json()</code> with a consistent shape—e.g. <code>{ data?: T; error?: string }</code>—so the frontend can handle success and error the same way. Log errors on the server but don’t leak internal details in the response. A generic “Something went wrong” plus a request ID in logs is often enough.</p>

<h2>Type Safety and Validation</h2>
<p>Type request bodies and responses with TypeScript. Use Zod (or another schema library) to validate input at the boundary: parse the body, and if validation fails, return <code>400</code> with the validation errors. That keeps invalid data out of your business logic and gives the client clear feedback. For more on types in the stack, read <a href="/blog/embracing-power-typescript-react">TypeScript in React</a> and <a href="/blog/5-essential-skills-modern-web-developer">5 essential skills for web developers</a>.</p>

<h2>Authentication and Response Format</h2>
<p>If a route requires auth, check the session or token at the start of the handler. Use a shared helper or middleware so you don’t repeat the same logic in every route. Return <code>401</code> or <code>403</code> when the user isn’t allowed. Keep success and error response shapes consistent across all API routes so the frontend can use a single pattern for fetching and error handling.</p>
<p>Need help designing or refactoring APIs? See <a href="/#services">my services</a> or <a href="/#contact">contact me</a> and we can go through your project.</p>`,
    coverImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    tags: ["Next.js", "API", "Backend", "Best Practices", "TypeScript"],
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    authorId: 1,
    isPublished: true,
    metaTitle: "API Design in Next.js: Best Practices | MrGuru.dev",
    metaDescription:
      "Best practices for Next.js API routes: structure, error handling, type safety, validation, and authentication.",
    keywords: [
      "Next.js API",
      "API design",
      "route handlers",
      "TypeScript",
      "Zod validation",
    ],
    canonicalUrl: "https://mrguru.dev/blog/best-practices-api-design-nextjs",
    ogTitle: "Best Practices for API Design in Next.js Applications",
    ogDescription:
      "How to design clean, maintainable API routes in Next.js with error handling and type safety.",
    ogImage:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    internalLinks: [
      {
        text: "migrating from Vite to Next.js",
        url: "/blog/migrating-vite-to-nextjs-complete-guide",
      },
      {
        text: "building a portfolio with Next.js",
        url: "/blog/building-modern-portfolio-nextjs-tailwind",
      },
      {
        text: "TypeScript in React",
        url: "/blog/embracing-power-typescript-react",
      },
      {
        text: "5 essential skills for web developers",
        url: "/blog/5-essential-skills-modern-web-developer",
      },
      { text: "my services", url: "/#services" },
      { text: "contact me", url: "/#contact" },
    ],
    externalLinks: [
      {
        text: "Next.js Route Handlers",
        url: "https://nextjs.org/docs/app/building-your-application/routing/route-handlers",
        nofollow: true,
      },
    ],
    readingTime: 6,
  },
];
