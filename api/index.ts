import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GitHubStrategy } from 'passport-github2';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';
import { db } from '../server/db';
import { storage } from '../server/storage';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import * as schema from "../shared/schema";

declare global {
  namespace Express {
    interface User extends schema.User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Create Express app
const app = express();

// Configure middleware
app.use(cookieParser());
app.use(json());
app.use(urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://mrguru.dev' 
    : 'http://localhost:5000',
  credentials: true
}));

// Setup session
const sessionSettings: session.SessionOptions = {
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
};

app.use(session(sessionSettings));
app.use(passport.initialize());
app.use(passport.session());

// Configure local authentication strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await storage.getUserByUsername(username);
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    } else {
      return done(null, user);
    }
  }),
);

// Configure GitHub authentication strategy (if GitHub credentials are available)
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production'
          ? 'https://mrguru.dev/api/auth/github/callback'
          : 'http://localhost:5000/api/auth/github/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await storage.getUserByUsername(profile.username || '');
          
          // If not, create a new user
          if (!user) {
            user = await storage.createUser({
              username: profile.username || '',
              password: await hashPassword(randomBytes(16).toString('hex')),
              email: profile.emails?.[0]?.value || '',
              full_name: profile.displayName || '',
              role: 'user',
              github_id: profile.id,
              created_at: new Date(),
            });
          }
          
          return done(null, user);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id: number, done) => {
  const user = await storage.getUser(id);
  done(null, user);
});

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user?.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Access denied" });
}

// Import controllers
import { portfolioController } from '../server/controllers/portfolioController';
import { blogController } from '../server/controllers/blogController';
import { uploadController } from '../server/controllers/uploadController';

// Auth routes
app.post("/api/register", async (req, res, next) => {
  const existingUser = await storage.getUserByUsername(req.body.username);
  if (existingUser) {
    return res.status(400).send("Username already exists");
  }

  const user = await storage.createUser({
    ...req.body,
    password: await hashPassword(req.body.password),
  });

  req.login(user, (err) => {
    if (err) return next(err);
    res.status(201).json(user);
  });
});

app.post("/api/login", passport.authenticate("local"), (req, res) => {
  res.status(200).json(req.user);
});

app.post("/api/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.sendStatus(200);
  });
});

app.get("/api/user", (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
  res.json(req.user);
});

// GitHub auth routes
app.get("/api/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/api/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/auth" }),
  (req, res) => {
    res.redirect("/");
  }
);

// Portfolio routes
app.get("/api/skills", portfolioController.getSkills);
app.get("/api/skills/:skillId/endorsements", portfolioController.getSkillEndorsements);
app.post("/api/skills/:skillId/endorse", portfolioController.createSkillEndorsement);

app.get("/api/projects", portfolioController.getProjects);
app.get("/api/projects/:id", portfolioController.getProjectById);

app.get("/api/personal-info", portfolioController.getPersonalInfo);
app.get("/api/contact-info", portfolioController.getContactInfo);
app.post("/api/contact", portfolioController.submitContactForm);
app.post("/api/request-resume", portfolioController.requestResume);
app.get("/api/resume/:token", portfolioController.downloadResume);

// Blog routes
app.get("/api/blog", blogController.getBlogPosts);
app.get("/api/blog/:slug", blogController.getBlogPostBySlug);
app.post("/api/blog", isAdmin, blogController.createBlogPost);
app.get("/api/blog/:slug/comments", blogController.getPostComments);
app.post("/api/blog/:slug/comments", blogController.addComment);
app.get("/api/admin/comments/pending", isAdmin, blogController.getPendingComments);
app.post("/api/admin/comments/:id/approve", isAdmin, blogController.approveComment);
app.post("/api/admin/comments/:id/spam", isAdmin, blogController.markCommentAsSpam);
app.post("/api/blog/:slug/contribute", blogController.submitBlogPostContribution);
app.get("/api/admin/contributions/pending", isAdmin, blogController.getPendingContributions);
app.post("/api/admin/contributions/:id/review", isAdmin, blogController.reviewBlogPostContribution);
app.post("/api/admin/contributions/:id/spam", isAdmin, blogController.markContributionAsSpam);

// Media upload routes
app.post("/api/media", isAdmin, uploadController.uploadMedia);
app.get("/api/media/:filename", uploadController.serveMedia);

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Export the Express API as a Vercel API handler
export default app;