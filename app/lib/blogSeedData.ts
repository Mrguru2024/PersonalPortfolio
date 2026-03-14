const baseUrl = "https://mrguru.dev";

/** Unique default cover images per article (no duplicates) until author uploads. */
const UNSPLASH_QUERY = "ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80";
const BLOG_DEFAULT_COVERS: string[] = [
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1573495627361-d9b87960b12d?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1517245386639-0ff4cec3319b?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1551434678-e076c223a692?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1557804506-669a67965ba0?" + UNSPLASH_QUERY,
  "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?" + UNSPLASH_QUERY,
  "https://picsum.photos/seed/blog12/2070/1080",
  "https://picsum.photos/seed/blog13/2070/1080",
  "https://picsum.photos/seed/blog14/2070/1080",
  "https://picsum.photos/seed/blog15/2070/1080",
  "https://picsum.photos/seed/blog16/2070/1080",
  "https://picsum.photos/seed/blog17/2070/1080",
]; // 17 unique default covers (indices 0–16); 11–16 use Picsum for reliable loading

export const blogSeedPosts = [
  {
    id: 1,
    authorId: 1,
    isPublished: true,
    title: "Migrating from Vite to Next.js: A Complete Guide",
    slug: "migrating-vite-to-nextjs-complete-guide",
    summary:
      "Learn how I migrated my portfolio from Vite to Next.js 15, including App Router setup, API routes, and SEO improvements.",
    coverImage: BLOG_DEFAULT_COVERS[0],
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
    tags: ["Next.js", "React", "Migration", "Web Development", "TypeScript"],
    publishedAt: "2024-01-05T12:00:00.000Z",
    updatedAt: "2024-01-12T12:00:00.000Z",
    metaTitle:
      "Migrating from Vite to Next.js 15: Complete Guide | Ascendra Technologies",
    metaDescription:
      "Step-by-step guide to migrating a Vite React app to Next.js 15: App Router, API routes, SSR, and SEO. Real experience from a production portfolio migration.",
    keywords: [
      "Next.js migration",
      "Vite to Next.js",
      "React SSR",
      "App Router",
      "SEO",
    ],
    canonicalUrl: `${baseUrl}/blog/migrating-vite-to-nextjs-complete-guide`,
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
    id: 2,
    authorId: 1,
    isPublished: true,
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
    coverImage: BLOG_DEFAULT_COVERS[1],
    tags: ["Next.js", "Tailwind CSS", "Portfolio", "Web Design", "Frontend"],
    publishedAt: "2023-12-20T12:00:00.000Z",
    updatedAt: "2023-12-22T12:00:00.000Z",
    metaTitle:
      "Building a Modern Portfolio with Next.js 15 and Tailwind CSS | Ascendra Technologies",
    metaDescription:
      "Guide to building a responsive developer portfolio with Next.js 15, Tailwind CSS, TypeScript, and Drizzle. Design, tech stack, and lessons learned.",
    keywords: [
      "Next.js portfolio",
      "Tailwind CSS",
      "developer portfolio",
      "React",
      "TypeScript",
    ],
    canonicalUrl: `${baseUrl}/blog/building-modern-portfolio-nextjs-tailwind`,
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
    id: 3,
    authorId: 1,
    isPublished: true,
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
    coverImage: BLOG_DEFAULT_COVERS[2],
    tags: [
      "Web Development",
      "Career",
      "Skills",
      "JavaScript",
      "Best Practices",
    ],
    publishedAt: "2023-12-10T12:00:00.000Z",
    updatedAt: "2023-12-12T12:00:00.000Z",
    metaTitle:
      "5 Essential Skills Every Modern Web Developer Should Master | Ascendra Technologies",
    metaDescription:
      "Key skills for web developers: JavaScript, API design, performance, responsive design, and testing. Practical advice from a full-stack developer.",
    keywords: [
      "web developer skills",
      "JavaScript",
      "API design",
      "performance",
      "responsive design",
    ],
    canonicalUrl: `${baseUrl}/blog/5-essential-skills-modern-web-developer`,
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
    id: 4,
    authorId: 1,
    isPublished: true,
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
    coverImage: BLOG_DEFAULT_COVERS[3],
    tags: [
      "TypeScript",
      "React",
      "JavaScript",
      "Development",
      "Best Practices",
    ],
    publishedAt: "2023-11-25T12:00:00.000Z",
    updatedAt: "2023-11-27T12:00:00.000Z",
    metaTitle:
      "TypeScript in React: Why and How to Adopt It | Ascendra Technologies",
    metaDescription:
      "How TypeScript improves React development: better DX, fewer bugs, self-documenting code, and safer refactoring. Practical getting-started advice.",
    keywords: [
      "TypeScript",
      "React",
      "JavaScript",
      "type safety",
      "developer experience",
    ],
    canonicalUrl: `${baseUrl}/blog/embracing-power-typescript-react`,
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
    id: 5,
    authorId: 1,
    isPublished: true,
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
    coverImage: BLOG_DEFAULT_COVERS[4],
    tags: ["Web Development", "Trends", "Technology", "Future", "Innovation"],
    publishedAt: "2023-12-30T12:00:00.000Z",
    updatedAt: "2024-01-02T12:00:00.000Z",
    metaTitle:
      "Web Development Trends 2025: RSC, AI, Edge, Sustainability | Ascendra Technologies",
    metaDescription:
      "Trends shaping web development in 2025: React Server Components, AI tooling, edge computing, WebAssembly, and sustainable practices.",
    keywords: [
      "web development 2025",
      "React Server Components",
      "edge computing",
      "WebAssembly",
      "sustainability",
    ],
    canonicalUrl: `${baseUrl}/blog/future-web-development-trends-2025`,
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
    id: 6,
    authorId: 1,
    isPublished: true,
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
    coverImage: BLOG_DEFAULT_COVERS[5],
    tags: ["Next.js", "API", "Backend", "Best Practices", "TypeScript"],
    publishedAt: "2024-01-20T12:00:00.000Z",
    updatedAt: "2024-01-22T12:00:00.000Z",
    metaTitle: "API Design in Next.js: Best Practices | Ascendra Technologies",
    metaDescription:
      "Best practices for Next.js API routes: structure, error handling, type safety, validation, and authentication.",
    keywords: [
      "Next.js API",
      "API design",
      "route handlers",
      "TypeScript",
      "Zod validation",
    ],
    canonicalUrl: `${baseUrl}/blog/best-practices-api-design-nextjs`,
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
  // ——— Funnel-aligned articles (conversion, trust, messaging, revenue) ———
  {
    id: 7,
    authorId: 1,
    isPublished: true,
    title: "Why Your Homepage Has About 5 Seconds",
    slug: "why-your-homepage-has-about-5-seconds",
    summary:
      "Visitors decide fast. If they can't tell what you do or what to do next, they leave. Here's what actually works from reviewing dozens of business sites.",
    content: `<p>Most business owners don't realize how quickly someone makes a call on their site. Research on attention and bounce rates consistently shows that visitors give you a handful of seconds—often less than five—before they either engage or leave. If the headline is vague—"We deliver excellence" or "Your trusted partner"—the visitor has nothing to latch onto. They don't know who you serve, what you're best at, or what to do next. So they leave. In this article we'll break down why that window is so short, what we see when we review homepages, and how to structure yours so it works with how people actually behave.</p>

<h2>Why the First Few Seconds Matter</h2>
<p>When someone lands on your site, they're not reading. They're scanning. They're asking, often unconsciously: Is this for me? Do these people get my problem? What do I do next? If the answer to any of those isn't obvious in a few seconds, they'll assume it's not worth their time and bounce. That's not a criticism of your business—it's how attention works. The good news is that you can design for it. A clear headline that names who you serve and what you do, one primary action above the fold, and a hint of proof (a credential, a number, a short testimonial) can be enough to keep them scrolling.</p>

<h2>What We See When We Look at Homepages</h2>
<p>When we review sites, the same gaps show up again and again. The offer is buried two or three screens down. The primary action is unclear or competing with five other buttons—"Contact us," "Get a quote," "Learn more," "Schedule a call," "Request info"—so visitors don't know which one matters. Trust signals—reviews, credentials, proof of results—sit way down the page. Above the fold, it's a generic tagline and a stock photo. That's not a conversion problem; it's a clarity problem. The fix isn't more copy. It's structure: one clear promise, one obvious next step, and proof that you're legitimate. <a href="/homepage-conversion-blueprint">A simple homepage blueprint</a> helps you check whether you have those in place before you invest in more traffic.</p>

<h2>One CTA Beats Five</h2>
<p>I've seen homepages with half a dozen calls to action fighting for attention in the hero alone. The result is decision paralysis. When we work with businesses, we usually narrow it to one primary action per section—often something specific like "Request your audit" or "Get your estimate"—and repeat it so anyone who scrolls still knows what to do. Secondary actions (e.g. "See services," "Read the blog") can live in the nav or lower on the page, but they shouldn't compete with the main goal. One clear path converts better than many vague ones.</p>

<h2>Above the Fold: What Belongs There</h2>
<p>"Above the fold" is the part of the page visible without scrolling. On mobile that might be a single screen; on desktop it's a bit more. That space should answer: Who is this for? What do you do or offer? What's the one thing I should do next? And ideally, one element that says "these people are real and good at this"—a credential, a number, or a short quote. You don't need long paragraphs. You need clarity and hierarchy. If your main CTA is below the fold on mobile, a large share of visitors will never see it.</p>

<h2>What to Do Next</h2>
<p>Look at your homepage with fresh eyes—or ask someone who doesn't know your business to look for five seconds and tell you what you do and what they should do next. If they hesitate or get it wrong, you have a clarity problem. Is there one clear button or link that represents the main action you want? If not, start there. If you want a structured review of your whole site—homepage, messaging, and conversion path—<a href="/digital-growth-audit">a Digital Growth Audit</a> walks through exactly that and gives you a prioritized list of changes.</p>`,
    coverImage: BLOG_DEFAULT_COVERS[6],
    tags: ["Conversion", "Homepage", "UX", "Business", "Websites", "For business owners"],
    publishedAt: "2026-02-18T12:00:00.000Z",
    updatedAt: "2026-02-18T12:00:00.000Z",
    metaTitle: "Why Your Homepage Has About 5 Seconds | Ascendra Technologies",
    metaDescription:
      "Visitors decide in seconds. Clear headlines, one primary CTA, and trust above the fold—what we see when we review business websites.",
    keywords: ["homepage conversion", "first impression", "CTA", "business website", "clarity"],
    canonicalUrl: `${baseUrl}/blog/why-your-homepage-has-about-5-seconds`,
    ogTitle: "Why Your Homepage Has About 5 Seconds",
    ogDescription: "What actually works on a business homepage: clarity, one clear action, and proof.",
    ogImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
    internalLinks: [
      { text: "homepage blueprint", url: "/homepage-conversion-blueprint" },
      { text: "Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 9,
  },
  {
    id: 8,
    authorId: 1,
    isPublished: true,
    title: "The Real Cost of a Website That Doesn't Convert",
    slug: "real-cost-website-doesnt-convert",
    summary:
      "Traffic without conversion is just a number. Here's how to think about the gap between visitors and leads—and why the math usually surprises people.",
    content: `<p>You're getting traffic. Maybe a few hundred or a few thousand visits a month. But the phone isn't ringing and the form isn't filling up. So what's the cost? Most business owners haven't actually run the numbers. When we do it with them—visitors, a realistic conversion rate, and average deal size—the gap is often bigger than they expect. This article walks through how to estimate that cost and why fixing conversion usually beats chasing more traffic.</p>

<h2>Traffic Isn't the Goal</h2>
<p>Traffic is an input. Leads and customers are the output. If your site has a weak offer, a confusing path, or no clear next step, you're leaving most of that input on the table. A 1% conversion rate when 3% is achievable doesn't sound dramatic until you multiply it by hundreds of visitors and a four-figure average sale. Then it's real money. For example: 1,000 visitors per month at 1% conversion is 10 leads. At 3%, it's 30. If your average deal is $2,000, that's $20,000 vs. $60,000 in potential revenue per month from the same traffic. The difference is often tens of thousands of dollars per year—sometimes more.</p>
<p>We built a <a href="/website-revenue-calculator">revenue loss calculator</a> so you can plug in your own numbers: monthly visitors, current conversion rate, and average sale value. It's not exact—no calculator is—but it gives you a frame for the opportunity. For a lot of small businesses, that frame is "we could be leaving five figures a year on the table." Once you see that number, the question shifts from "should we spend time on the website?" to "where do we start?"</p>

<h2>Why Conversion Lags</h2>
<p>Usually it's not one thing. It's a mix: unclear messaging so visitors don't know if you're a fit, weak or buried CTAs, no trust signals above the fold, or a form that feels like a big commitment when they're not ready. Maybe the headline is generic and the primary action is buried. Maybe there are too many options and no single clear next step. Fixing one of these helps; fixing the system—message, design, and path—helps more. That's what we look at in a <a href="/digital-growth-audit">Digital Growth Audit</a>: where the leaks are and what to fix first so you're not guessing.</p>

<h2>The Opportunity Cost of "Good Enough"</h2>
<p>Many business owners treat the website as a one-time project. Once it's live, they focus on marketing and operations and assume the site is doing its job. But if conversion is low, every dollar spent on ads or SEO is partly wasted—you're driving people to a page that doesn't convert them. Improving the site often has a higher return than increasing spend on traffic, especially when the baseline conversion is low. The math is simple: same traffic, higher conversion, more leads and revenue.</p>

<h2>Next Step</h2>
<p>If you've never estimated what your current conversion rate might be costing you, run the numbers in our <a href="/website-revenue-calculator">revenue loss calculator</a>. Then get a clear view of your site: <a href="/digital-growth-audit">request an audit</a> and we'll point to the highest-impact fixes so you can prioritize what to change first.</p>`,
    coverImage: BLOG_DEFAULT_COVERS[7],
    tags: ["Conversion", "Revenue", "Lead Generation", "Business", "Websites", "For business owners"],
    publishedAt: "2026-02-14T12:00:00.000Z",
    updatedAt: "2026-02-14T12:00:00.000Z",
    metaTitle: "The Real Cost of a Website That Doesn't Convert | Ascendra Technologies",
    metaDescription:
      "Traffic without conversion costs real money. How to estimate the gap and what to fix first.",
    keywords: ["conversion rate", "revenue loss", "lead generation", "website conversion", "business"],
    canonicalUrl: `${baseUrl}/blog/real-cost-website-doesnt-convert`,
    ogTitle: "The Real Cost of a Website That Doesn't Convert",
    ogDescription: "Why traffic without conversion costs more than you think—and how to fix it.",
    ogImage:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    internalLinks: [
      { text: "revenue loss calculator", url: "/website-revenue-calculator" },
      { text: "Digital Growth Audit", url: "/digital-growth-audit" },
      { text: "request an audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
  {
    id: 9,
    authorId: 1,
    isPublished: true,
    title: "What We Actually See When We Review Business Websites",
    slug: "what-we-see-when-we-review-business-websites",
    summary:
      "After reviewing hundreds of sites, a few patterns keep showing up. Unclear who it's for, weak CTAs, no proof—and what to do about it.",
    content: `<p>We don't do generic audits. We look at your brand clarity, your visual presentation, and how your site is built to convert. Over time, the same issues show up again and again. Not because business owners don't care—they do—but because nobody's pointed at the gaps in a clear order. Here's what we see when we review business websites and what we recommend so you can prioritize changes that actually move the needle.</p>

<h2>Who Is This For?</h2>
<p>Lots of sites open with a line that could apply to any company in the industry. "We provide quality service." "Your trusted partner." The visitor has to dig to figure out who you serve and what you're best at. When we flag this, the response is often "we serve everyone." That might be true in practice, but your homepage can't speak to everyone at once. It has to speak to one kind of customer first—the one you want more of. Getting that clear makes every other page easier to write and every CTA easier to justify. We look for a headline and subhead that name the audience and the outcome; if we can't tell in five seconds who the site is for, we note it as a top priority.</p>

<h2>Where's the Next Step?</h2>
<p>Another common pattern: the site explains the business well enough, but the call to action is vague or buried. "Contact us" in the footer. "Learn more" on every card. Nobody's told the visitor what happens next or why they should take that step now. We look for one primary action—request a quote, schedule a call, get an audit—and whether it's visible and specific. If it's not, that's usually a quick win. We also check how many CTAs compete above the fold; too many options lead to no action. One clear path, repeated in logical places, converts better.</p>

<h2>Proof and Trust</h2>
<p>Visitors are skeptical. They've seen slick sites that didn't deliver. So credentials, reviews, and concrete outcomes need to show up early. We check whether your site gives someone a reason to believe you in the first screen or two. If trust signals are all below the fold, we recommend moving at least one or two up—a credential, a number, or a short testimonial. Same for mobile: if the key action or proof is hard to find on a phone, you're losing a big chunk of visitors. We note where trust is weak or missing and suggest specific placements.</p>

<h2>Design and Consistency</h2>
<p>We're not grading you on the trendiest design. We're asking: Does the design support the message? Do fonts, colors, and layout feel consistent, or do they suggest the site was patched together over time? Inconsistent or outdated design undermines trust. We also look at load time and mobile experience—slow or broken-feeling sites signal that the business doesn't invest in its presence. Small fixes (image size, one clear CTA, proof above the fold) often matter more than a full redesign.</p>

<h2>Get a Review That's Specific to You</h2>
<p>If you want to know how your site stacks up on clarity, design, and conversion—and what to fix first—<a href="/digital-growth-audit">request a Digital Growth Audit</a>. We'll go through your brand, visuals, and site structure and give you a straight list of opportunities. You can also <a href="/website-performance-score">see how your site scores</a> on the same dimensions we care about. No fluff, just what we actually see and in what order we'd tackle it.</p>`,
    coverImage: BLOG_DEFAULT_COVERS[8],
    tags: ["Website Review", "Conversion", "Trust", "Business", "Audit", "For business owners"],
    publishedAt: "2026-02-10T12:00:00.000Z",
    updatedAt: "2026-02-10T12:00:00.000Z",
    metaTitle: "What We See When We Review Business Websites | Ascendra Technologies",
    metaDescription:
      "Patterns we see in business website reviews: unclear audience, weak CTAs, missing trust—and what to do next.",
    keywords: ["website review", "conversion", "trust signals", "business website", "audit"],
    canonicalUrl: `${baseUrl}/blog/what-we-see-when-we-review-business-websites`,
    ogTitle: "What We Actually See When We Review Business Websites",
    ogDescription: "Real patterns from website reviews—and what to fix first.",
    ogImage:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    internalLinks: [
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
      { text: "see how your site scores", url: "/website-performance-score" },
    ],
    externalLinks: [],
    readingTime: 10,
  },
  {
    id: 10,
    authorId: 1,
    isPublished: true,
    title: "How to Stop Sounding Like Every Other Business in Your Industry",
    slug: "how-to-stop-sounding-like-every-other-business",
    summary:
      "When your messaging could apply to any competitor, you blend in. Specificity is what makes you memorable and worth choosing.",
    content: `<p>Read the homepages of five businesses in the same industry. Chances are they all say something like "We're committed to excellence" or "Your trusted partner." Swap the logos and you couldn't tell them apart. That's not positioning—that's wallpaper. And it doesn't help visitors choose you. In this article we'll look at why generic messaging fails, how to compare yourself honestly to competitors, and why getting specific is the first step to a site that actually converts.</p>

<h2>Why Generic Messaging Fails</h2>
<p>Generic messaging doesn't give anyone a reason to pick you. It doesn't say who you're for, what you're best at, or what outcome you deliver that others don't. So visitors either guess or leave. When we help businesses with positioning, we start with one question: who is the one type of customer you want more of? Then we get specific: what problem do you solve for them, and what do you want to be known for? That becomes the spine of your message. Every page and every CTA can then support that spine instead of repeating vague claims that could apply to anyone.</p>
<p>It's tempting to say "we serve everyone" or "we do it all." But when your homepage tries to speak to everyone, it speaks clearly to no one. The businesses that convert well usually lead with one audience and one primary outcome. The rest of the site can broaden from there, but the first impression has to be clear.</p>

<h2>Compare Yourself Honestly</h2>
<p>One of the most useful exercises is to put your site next to two or three competitors. Read the headlines and subheads. If you could paste your copy onto their site and it would still make sense, you're not differentiated. A <a href="/competitor-position-snapshot">Competitor Position Snapshot</a> does exactly that: we look at how you're showing up versus others in your space—brand clarity, presentation, trust, and conversion readiness—so you see where you blend in and where you could stand out. Most business owners are surprised by how similar they sound; the snapshot makes it visible so you can change it.</p>

<h2>Strategy Before Design and Code</h2>
<p>Clarity of message makes everything else easier. Once you know what you're saying and who it's for, design and website structure have a job: support that message and make the next step obvious. When strategy is fuzzy, you get a nice-looking site that still doesn't convert. When it's clear, you get a site that works. Copy becomes easier to write because you're not guessing at tone or audience. CTAs become obvious because you know what action you want. If you're not sure where you stand, <a href="/digital-growth-audit">a Digital Growth Audit</a> reviews your brand clarity, visual presentation, and conversion path in one pass and gives you a prioritized list of fixes.</p>

<h2>What to Do Next</h2>
<p>Write down one sentence: who you serve and what you're known for. If it could apply to three other companies in your industry, sharpen it. Then compare your homepage to two competitors. If your headline could swap onto theirs, you have work to do. Getting specific isn't about being clever—it's about being clear enough that the right people recognize themselves and know what to do next.</p>`,
    coverImage: BLOG_DEFAULT_COVERS[9],
    tags: ["Brand", "Messaging", "Positioning", "Differentiation", "Business", "For business owners"],
    publishedAt: "2026-02-06T12:00:00.000Z",
    updatedAt: "2026-02-06T12:00:00.000Z",
    metaTitle: "How to Stop Sounding Like Every Other Business | Ascendra Technologies",
    metaDescription:
      "Generic messaging makes you invisible. How to get specific and stand out—and see how you compare to competitors.",
    keywords: ["brand messaging", "positioning", "differentiation", "competitors", "business"],
    canonicalUrl: `${baseUrl}/blog/how-to-stop-sounding-like-every-other-business`,
    ogTitle: "How to Stop Sounding Like Every Other Business in Your Industry",
    ogDescription: "Specificity beats generic claims. How to position yourself so the right clients choose you.",
    ogImage:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    internalLinks: [
      { text: "Competitor Position Snapshot", url: "/competitor-position-snapshot" },
      { text: "Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
  {
    id: 11,
    authorId: 1,
    isPublished: true,
    title: "Why Trust Disappears Before the First Click",
    slug: "why-trust-disappears-before-the-first-click",
    summary:
      "Visual presentation and consistency signal whether you're legitimate. Dated or chaotic design costs you leads before anyone fills out a form.",
    content: `<p>People don't read your whole site before they decide to reach out. They skim. They look at the first screen, maybe scroll a bit, and form a gut feeling: does this look legitimate? Does it look current? If the answer is no, they leave. No form submission, no call—just a bounce. Trust disappears before the first click. In this article we'll look at what "looking dated" actually means, how design supports or undercuts your message, and how to structure your site so visitors have a reason to stay and act.</p>

<h2>What "Looking Dated" Actually Means</h2>
<p>It's not about having the flashiest design. It's about consistency and intent. Inconsistent fonts, cluttered layouts, and visuals that don't match the message all signal "we didn't think this through." So do sites that clearly haven't been updated in years—old copyright dates, broken links, or a look that screams 2012. Visitors assume the business is behind the times or doesn't invest in its presence. Neither assumption helps you convert. You don't need to chase every design trend. You need a coherent look that matches your positioning and doesn't raise doubts in the first few seconds.</p>

<h2>Design Supports (or Undercuts) Your Message</h2>
<p>When your copy says "premium" but your visuals look generic, trust drops. When your headline is clear but the rest of the page is a wall of text with no hierarchy, people tune out. Good design doesn't replace strategy—it supports it. Clear sections, one primary CTA, and proof (reviews, credentials, outcomes) in the right places make it easier for visitors to believe you and take the next step. We use a <a href="/homepage-conversion-blueprint">homepage conversion blueprint</a> to check that structure: hero, trust, problem, solution, offer, proof, and a final CTA. Most business homepages are missing at least one of those or have them in the wrong order. Fixing that order often has a bigger impact than a visual refresh.</p>

<h2>Consistency Across the Site</h2>
<p>Trust also comes from consistency. If the homepage looks polished but inner pages feel like an afterthought—different fonts, different tone, broken or outdated content—visitors notice. They don't have to articulate it; they just feel that something's off. Same with mobile: if the experience is clearly worse on a phone, you're telling a large share of visitors that they're not a priority. We check key flows (homepage to primary CTA, mobile experience, and consistency of message and design) so you know where trust might be leaking.</p>

<h2>How Your Site Stacks Up</h2>
<p>If you've never had someone score your site on clarity, design, conversion, and trust, it's worth doing. Our <a href="/website-performance-score">Website Performance Score</a> looks at those dimensions and tells you where you're strong and where you're leaking. For a deeper pass—brand, visuals, and conversion path together—<a href="/digital-growth-audit">request a Digital Growth Audit</a>. We'll give you a straight list of what to fix first, no fluff.</p>`,
    coverImage: BLOG_DEFAULT_COVERS[10],
    tags: ["Trust", "Design", "Conversion", "Business", "Websites", "For business owners"],
    publishedAt: "2026-02-02T12:00:00.000Z",
    updatedAt: "2026-02-02T12:00:00.000Z",
    metaTitle: "Why Trust Disappears Before the First Click | Ascendra Technologies",
    metaDescription:
      "Visual presentation and consistency build—or kill—trust. What we see when we review business sites.",
    keywords: ["trust", "web design", "conversion", "business website", "credibility"],
    canonicalUrl: `${baseUrl}/blog/why-trust-disappears-before-the-first-click`,
    ogTitle: "Why Trust Disappears Before the First Click",
    ogDescription: "How design and consistency affect trust—and what to fix so visitors stay.",
    ogImage:
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2082&q=80",
    internalLinks: [
      { text: "homepage conversion blueprint", url: "/homepage-conversion-blueprint" },
      { text: "Website Performance Score", url: "/website-performance-score" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
  // ——— Migrated from insights hub (single blog, business-owner focus) ———
  {
    id: 12,
    authorId: 1,
    isPublished: true,
    title: "Why most homepages confuse visitors (and how to fix it)",
    slug: "why-most-homepages-confuse-visitors",
    summary:
      "Visitors decide in seconds whether to stay or leave. Unclear messaging, weak hierarchy, and missing next steps cost you leads every day.",
    content: `<p>When your headline is vague or your value proposition is buried, visitors don't stick around to find out. They assume you're not a fit or that your offer isn't clear—and they leave. The fix isn't more copy; it's clearer structure and one obvious next step. In this article we'll cover the real cost of confusion, common mistakes that make homepages hard to use, and a simple way to check whether yours is working.</p>

<h2>The Cost of Confusion</h2>
<p>Every day someone lands on your site, doesn't get it in a few seconds, and bounces. That's a lost lead. Multiply that by hundreds or thousands of visitors and the cost adds up. One clear CTA beats five competing options. The best homepages answer three things fast: what you do, who it's for, and what to do next. Trust elements (proof, credentials, social proof) should appear early so visitors have a reason to keep reading. Problem and solution sections should support the main message, not compete with it. When everything is equally prominent, nothing stands out—and nobody takes action.</p>

<h2>Common Mistakes to Avoid</h2>
<p>Too much text above the fold is one of the most common issues. Visitors won't read a long paragraph before they know whether the site is for them. Another mistake: multiple CTAs with no hierarchy. "Contact us," "Get a quote," "Learn more," and "Schedule a call" all in the hero means no single path is obvious. A third mistake is hiding the next step below the fold or inside a menu. On mobile especially, if the primary action isn't visible without scrolling, you lose people. Make the primary action visible and simple, and repeat it so that anyone who scrolls still knows what to do.</p>

<h2>Structure Beats Creativity</h2>
<p>You don't need a clever or unique layout to convert. You need a structure that answers the visitor's questions in order: What is this? Is it for me? Why should I believe you? What do I do next? A <a href="/homepage-conversion-blueprint">Homepage Conversion Blueprint</a> lays that out so you can check your own site against it. Most homepages we review are missing at least one piece or have the pieces in the wrong order. Fixing that often has a bigger impact than rewriting all your copy.</p>

<h2>Quick Self-Check</h2>
<ul><li>Can a stranger say what you do and who it's for in 5 seconds?</li><li>Is there one clear primary CTA above the fold?</li><li>Do you show proof or credibility early?</li></ul>
<p>If you want a structure to follow, use our <a href="/homepage-conversion-blueprint">Homepage Conversion Blueprint</a>. For a full review of your site—homepage, messaging, and conversion path—<a href="/digital-growth-audit">request a Digital Growth Audit</a>.</p>`,
    coverImage: BLOG_DEFAULT_COVERS[11],
    tags: ["Website Conversion", "Homepage", "Business", "For business owners"],
    publishedAt: "2026-02-15T12:00:00.000Z",
    updatedAt: "2026-02-15T12:00:00.000Z",
    metaTitle: "Why most homepages confuse visitors | Ascendra Technologies",
    metaDescription: "Unclear messaging and weak hierarchy cost you leads. How to fix it with clarity and one clear next step.",
    keywords: ["homepage", "conversion", "messaging", "business website"],
    canonicalUrl: `${baseUrl}/blog/why-most-homepages-confuse-visitors`,
    ogTitle: "Why most homepages confuse visitors (and how to fix it)",
    ogDescription: "Clarity beats creativity when it comes to converting.",
    ogImage: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80",
    internalLinks: [
      { text: "Homepage Conversion Blueprint", url: "/homepage-conversion-blueprint" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
  {
    id: 13,
    authorId: 1,
    isPublished: true,
    title: "Why weak CTAs kill conversions",
    slug: "why-weak-ctas-kill-conversions",
    summary:
      "Generic buttons and vague next steps leave visitors with no reason to act. Here's how to make your calls-to-action clear and effective.",
    content: `<p>Buttons like "Submit" or "Learn more" don't set expectations. Visitors don't know what they're signing up for or what happens next. Strong CTAs are specific: "Request Your Digital Growth Audit" or "Get Your Free Score" tell the user exactly what they get. Specific CTAs reduce friction and increase trust. In this article we'll look at why vague CTAs fail, how placement and hierarchy affect clicks, and how to audit your own pages so your primary action is obvious.</p>

<h2>Why Vague CTAs Fail</h2>
<p>When a visitor sees "Submit" or "Learn more," they have to guess what happens next. That guess creates friction. Some will assume it's a big commitment and leave. Others will click and then bounce when the next step doesn't match their expectation. A specific CTA—"Get Your Free Website Score" or "Request Your Audit"—sets the expectation. The visitor knows what they're getting and what happens next. That clarity increases the chance they'll act and reduces the chance they'll feel misled. It also makes your offer feel more concrete and professional.</p>

<h2>Placement and Hierarchy</h2>
<p>One primary CTA per section or page keeps the path clear. Secondary actions (e.g. Book a call, See services) can support but shouldn't compete. If everything looks equally important, nothing gets clicked. We often see homepages with four or five buttons in the hero; when we narrow it to one primary action and maybe one secondary, conversion improves. The same principle applies as the visitor scrolls: the primary action should repeat so that at any point they know what to do. Secondary links can live in the nav or in supporting sections, but they shouldn't fight for attention with the main goal.</p>

<h2>What Happens After the Click</h2>
<p>Your CTA isn't just the button text—it's the whole path. If the button says "Get your free audit" but the next page is a long form with no explanation, you've created a drop-off point. Tell the user what happens next: "You'll get a short form; we'll review your site and send you a report within 3 days." Setting that expectation reduces anxiety and increases completion. Same for thank-you pages: confirm what they did and what they can expect. Small clarity improvements often have an outsized impact on conversion.</p>

<h2>What to Do Next</h2>
<p>Audit your key pages. Count how many CTAs appear above the fold. If there are more than two, simplify. Make the primary action the same across the page so visitors who scroll still know what to do. Check that your main CTA is specific and that you tell the user what happens after they click. Estimate what weak conversion might be costing you with our <a href="/website-revenue-calculator">Revenue Loss Calculator</a>. Then <a href="/digital-growth-audit">request a Digital Growth Audit</a> for a clear list of fixes.</p>

<h2>Quick Self-Check</h2>
<ul><li>Is your main CTA a specific action or something vague?</li><li>Do you tell the user what happens after they click?</li><li>Is the CTA visible without scrolling on key pages?</li></ul>`,
    coverImage: BLOG_DEFAULT_COVERS[12],
    tags: ["Website Conversion", "CTA", "Business", "For business owners"],
    publishedAt: "2026-02-10T12:00:00.000Z",
    updatedAt: "2026-02-10T12:00:00.000Z",
    metaTitle: "Why weak CTAs kill conversions | Ascendra Technologies",
    metaDescription: "Generic CTAs don't convert. How to make your calls-to-action specific and effective.",
    keywords: ["CTA", "conversion", "business website", "lead generation"],
    canonicalUrl: `${baseUrl}/blog/why-weak-ctas-kill-conversions`,
    ogTitle: "Why weak CTAs kill conversions",
    ogDescription: "Specific CTAs reduce friction and increase trust.",
    ogImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    internalLinks: [
      { text: "Revenue Loss Calculator", url: "/website-revenue-calculator" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 9,
  },
  {
    id: 14,
    authorId: 1,
    isPublished: true,
    title: "Why brand clarity matters for small businesses",
    slug: "why-brand-clarity-matters",
    summary:
      "When your messaging sounds like everyone else's, you blend in. Clear positioning helps you attract the right clients and stand out.",
    content: `<p>Many small businesses describe themselves in the same way: "We provide quality service" or "We're a full-service company." That doesn't help a visitor choose you. Clarity means being specific about who you serve, what problem you solve, and what makes you the right fit. Specificity builds trust; vagueness builds doubt. In this article we'll cover how to sharpen your message, how clarity connects to conversion, and how to check whether you're distinct enough to stand out.</p>

<h2>Why Generic Claims Don't Convert</h2>
<p>When your messaging could apply to any business in your industry, you're asking the visitor to do the work of figuring out why you're different. Most won't. They'll either pick a competitor who was clearer or leave. Generic claims like "quality service" or "client-focused" don't answer who you're for or what outcome you deliver. Getting specific—"We help HVAC contractors in the Southeast get more booked jobs from their website" or "Brand and website strategy for B2B professional services"—gives the right visitor a reason to stay and act.</p>

<h2>How to Sharpen Your Message</h2>
<p>Start with your ideal customer and the one outcome they care about most. Lead with that. Use language they use, not industry jargon. Compare your headline and subhead to two or three competitors—if you could swap them and no one would notice, you're not distinct enough. One practical exercise: write one sentence that states who you serve and what you're known for. If that sentence could apply to three other companies, tighten it until it's clearly you.</p>

<h2>Connecting Clarity to Conversion</h2>
<p>Clear positioning makes every page easier to write and every CTA easier to justify. When visitors quickly understand what you do and who it's for, they're more likely to take the next step. Vague sites need more copy and more CTAs to compensate; clear sites can be simpler and still convert better. If you're not sure how you compare to competitors, a <a href="/competitor-position-snapshot">Competitor Position Snapshot</a> shows you side-by-side. For a full review of brand, design, and conversion, <a href="/digital-growth-audit">request a Digital Growth Audit</a>.</p>

<h2>Quick Self-Check</h2>
<ul><li>Can you state in one sentence who you serve and what you're known for?</li><li>Does your website copy sound different from your competitors?</li><li>Do you lead with a specific outcome or with generic claims?</li></ul>`,
    coverImage: BLOG_DEFAULT_COVERS[13],
    tags: ["Brand Positioning", "Messaging", "Business", "For business owners"],
    publishedAt: "2026-02-08T12:00:00.000Z",
    updatedAt: "2026-02-08T12:00:00.000Z",
    metaTitle: "Why brand clarity matters for small businesses | Ascendra Technologies",
    metaDescription: "Clear positioning helps you stand out and attract the right clients.",
    keywords: ["brand", "messaging", "positioning", "small business"],
    canonicalUrl: `${baseUrl}/blog/why-brand-clarity-matters`,
    ogTitle: "Why brand clarity matters for small businesses",
    ogDescription: "When your messaging sounds like everyone else's, you blend in.",
    ogImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    internalLinks: [
      { text: "Competitor Position Snapshot", url: "/competitor-position-snapshot" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
  {
    id: 15,
    authorId: 1,
    isPublished: true,
    title: "How slow sites lose customers",
    slug: "how-slow-sites-lose-customers",
    summary:
      "Speed isn't just a technical metric—it affects trust, bounce rate, and whether visitors ever reach your offer.",
    content: `<p>Slow load times increase bounce rate and reduce the chance that visitors see your offer or CTA. On mobile, slow sites feel broken. Visitors assume the business is outdated or doesn't care about experience. Speed signals professionalism and respect for the visitor. In this article we'll look at where sites usually slow down, quick wins you can implement, and how to measure what actually matters.</p>

<h2>Why Speed Affects More Than You Think</h2>
<p>Every second of delay costs you visitors. Research on bounce rates and conversion consistently shows that slow pages lose people before they've even seen your message. On mobile, where connections are often slower and attention is shorter, the effect is even stronger. Slow sites also rank worse in search over time, so the cost compounds: fewer visitors and lower visibility. And it's not just technical speed—if the page loads but the layout shifts or the main CTA is delayed, you're still losing trust and conversions.</p>

<h2>Where Sites Usually Slow Down</h2>
<p>Large images, too many scripts, and unoptimized fonts are common culprits. Above-the-fold content should load first; everything else can wait. Heavy background images, auto-playing video, and third-party widgets (chat, analytics, ads) often add more weight than people realize. Measuring with real devices and throttled connections gives you a true picture—desktop on a fast connection can hide problems that mobile users hit every day.</p>

<h2>Quick Wins</h2>
<p>Compress images and use modern formats (e.g. WebP) where possible. Defer non-critical JavaScript so the main content and CTA can render first. Use a fast host and a CDN for static assets. If your site is still slow after basics, the structure may need a review—sometimes the fix is simpler navigation and fewer heavy elements on the homepage rather than more technical optimization. We factor speed into our <a href="/website-performance-score">Website Performance Score</a> so you can see how you stack up. For a full review of performance, clarity, and conversion, <a href="/digital-growth-audit">request a Digital Growth Audit</a>.</p>

<h2>Quick Self-Check</h2>
<ul><li>Have you checked your site speed on mobile in the last 6 months?</li><li>Do key pages load in under 3 seconds on a typical connection?</li><li>Are images and scripts optimized?</li></ul>`,
    coverImage: BLOG_DEFAULT_COVERS[14],
    tags: ["Digital Growth Strategy", "Performance", "Business", "For business owners"],
    publishedAt: "2026-02-05T12:00:00.000Z",
    updatedAt: "2026-02-05T12:00:00.000Z",
    metaTitle: "How slow sites lose customers | Ascendra Technologies",
    metaDescription: "Speed affects trust and conversion. Where sites slow down and what to fix.",
    keywords: ["site speed", "performance", "conversion", "business website"],
    canonicalUrl: `${baseUrl}/blog/how-slow-sites-lose-customers`,
    ogTitle: "How slow sites lose customers",
    ogDescription: "Speed isn't just a technical metric—it affects trust and conversion.",
    ogImage: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=2082&q=80",
    internalLinks: [
      { text: "Website Performance Score", url: "/website-performance-score" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 9,
  },
  {
    id: 16,
    authorId: 1,
    isPublished: true,
    title: "Why most small businesses blend into their competitors",
    slug: "why-small-businesses-blend-into-competitors",
    summary:
      "Same claims, same look, same vague promises. Standing out starts with clarity and a clear point of view.",
    content: `<p>When everyone says they're "trusted," "quality-driven," and "client-focused," no one stands out. Differentiation comes from being specific: who you serve, what you're best at, and what outcome you deliver that others don't. Differentiation is clarity, not cleverness. In this article we'll look at why small businesses blend in, how visual and verbal consistency help you stand out, and how to get an honest view of how you compare.</p>

<h2>Why So Many Businesses Sound the Same</h2>
<p>It's safe to say "we're committed to excellence." It's risky to say "we help plumbing companies in the greater Phoenix area get more emergency calls from their website." The first could apply to anyone; the second names an audience and an outcome. Most businesses default to the safe option, so entire industries end up with the same claims. The way out isn't a fancy tagline—it's specificity. Who do you serve? What are you known for? What outcome do you deliver that you want to be known for? Answer those and you're already ahead of most competitors.</p>

<h2>Visual and Verbal Consistency</h2>
<p>Your message and your design should support the same story. If your copy says "premium" but your visuals look generic, trust drops. If your headline is specific but your imagery is stock photos that could fit any industry, you're undercutting the message. Consistency across brand, design, and website makes you memorable. Inconsistent or dated design signals that the business doesn't invest in how it shows up—and visitors make that judgment in seconds.</p>

<h2>Getting an Honest View</h2>
<p>Comparing yourself to competitors side-by-side—messaging, visuals, and conversion path—reveals where you're blending in. A structured <a href="/competitor-position-snapshot">Competitor Position Snapshot</a> helps you see gaps and prioritize what to fix first. For a full review of brand, design, and conversion, <a href="/digital-growth-audit">request a Digital Growth Audit</a>. We'll give you a straight list of where you're blending in and what would make the biggest difference.</p>

<h2>Quick Self-Check</h2>
<ul><li>If you covered the logo, could a visitor tell your site from a competitor's?</li><li>Do you lead with a unique outcome or a generic line?</li><li>Is your differentiator stated clearly in the first screen?</li></ul>`,
    coverImage: BLOG_DEFAULT_COVERS[15],
    tags: ["Brand Positioning", "Differentiation", "Business", "For business owners"],
    publishedAt: "2026-02-01T12:00:00.000Z",
    updatedAt: "2026-02-01T12:00:00.000Z",
    metaTitle: "Why most small businesses blend into their competitors | Ascendra Technologies",
    metaDescription: "Standing out starts with clarity and a clear point of view.",
    keywords: ["differentiation", "brand", "competitors", "small business"],
    canonicalUrl: `${baseUrl}/blog/why-small-businesses-blend-into-competitors`,
    ogTitle: "Why most small businesses blend into their competitors",
    ogDescription: "Same claims, same look—how to stand out with specificity.",
    ogImage: "https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80",
    internalLinks: [
      { text: "Competitor Position Snapshot", url: "/competitor-position-snapshot" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
  {
    id: 17,
    authorId: 1,
    isPublished: true,
    title: "What website performance really means for your business",
    slug: "what-website-performance-really-means",
    summary:
      "Performance isn't just speed. It's clarity, trust, and whether your site is built to capture leads.",
    content: `<p>Performance in a business sense means: Does the site load quickly? Is the message clear? Is there a clear next step? Technical speed matters, but so do structure, CTAs, and trust signals. All of it affects whether visitors become leads. Performance = speed + clarity + conversion path. In this article we'll look at what underperformance looks like, how to measure what matters, and how to prioritize improvements so you're not guessing.</p>

<h2>What "Performance" Really Means for Your Business</h2>
<p>Developers often think of performance as load time and Core Web Vitals. Those matter—slow sites lose visitors and rank worse. But for a business owner, performance is whether the site does its job: gets the right message in front of the right people and guides them toward a clear next step. A fast site with vague messaging and no clear CTA underperforms. A slightly slower site with a clear offer and one obvious action can still convert well. So when we talk about website performance, we mean the whole system: speed, clarity, trust, and conversion path.</p>

<h2>Signs of Underperformance</h2>
<p>Traffic with few leads, high bounce rate, or feedback that people "couldn't find" what they needed are all signs. So is a site that looks fine on desktop but is slow or confusing on mobile. Often the fix isn't a full redesign—it's simpler navigation, one clear CTA, and proof above the fold. We see a lot of sites that need structural and messaging fixes more than they need a new theme. A <a href="/website-performance-score">Website Performance Score</a> scores you on clarity, design, conversion readiness, and speed so you can see where you stand and what to improve first.</p>

<h2>Measuring What Matters</h2>
<p>Score your site on clarity, design, conversion readiness, and speed. Use that to decide what to improve first. A structured review beats guessing. If you're not sure where to start, a <a href="/digital-growth-audit">Digital Growth Audit</a> walks through your brand, visuals, and conversion path and gives you a prioritized list. That way you're fixing the highest-impact issues first instead of spreading effort across everything.</p>

<h2>Quick Self-Check</h2>
<ul><li>Does your site clearly guide visitors toward one primary action?</li><li>Are trust and proof visible without digging?</li><li>Would you describe your site as conversion-ready or informational?</li></ul>`,
    coverImage: BLOG_DEFAULT_COVERS[16],
    tags: ["Website Conversion", "Performance", "Business", "For business owners"],
    publishedAt: "2026-01-28T12:00:00.000Z",
    updatedAt: "2026-01-28T12:00:00.000Z",
    metaTitle: "What website performance really means for your business | Ascendra Technologies",
    metaDescription: "Performance is speed, clarity, and conversion path—not just load time.",
    keywords: ["website performance", "conversion", "business", "lead generation"],
    canonicalUrl: `${baseUrl}/blog/what-website-performance-really-means`,
    ogTitle: "What website performance really means for your business",
    ogDescription: "Performance isn't just speed. It's clarity, trust, and conversion.",
    ogImage: "https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    internalLinks: [
      { text: "Website Performance Score", url: "/website-performance-score" },
      { text: "request a Digital Growth Audit", url: "/digital-growth-audit" },
    ],
    externalLinks: [],
    readingTime: 8,
  },
];

/** Latest blog posts tagged for business owners (for homepage "Insights for Business Owners" section). */
export function getLatestBlogPostsForBusiness(limit = 4) {
  return blogSeedPosts
    .filter((p) => p.tags && p.tags.includes("For business owners"))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}
