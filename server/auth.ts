import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'mrguru-portfolio-session-secret',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // Set up GitHub authentication strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    const githubCallbackURL = process.env.NODE_ENV === 'production'
      ? 'https://mrguru.dev/api/auth/github/callback'
      : 'http://localhost:3000/api/auth/github/callback';
    
    passport.use(
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL: githubCallbackURL
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            // Check if user already exists by GitHub ID or username
            let user = await storage.getUserByUsername(`github:${profile.id}`);
            
            // Also check by email if available
            if (!user && profile.emails?.[0]?.value) {
              const userByEmail = await storage.getUserByEmail(profile.emails[0].value);
              if (userByEmail) {
                // Update existing user with GitHub info
                user = await storage.updateUser(userByEmail.id, {
                  githubId: profile.id.toString(),
                  githubUsername: profile.username,
                  avatarUrl: profile.photos?.[0]?.value
                });
              }
            }
            
            if (!user) {
              // Create new user if it doesn't exist
              user = await storage.createUser({
                username: profile.username || `github:${profile.id}`,
                password: await hashPassword(randomBytes(16).toString('hex')), // Random password since login is via GitHub
                email: profile.emails?.[0]?.value || '',
                full_name: profile.displayName || profile.username || '',
                isAdmin: false,
                githubId: profile.id.toString(),
                githubUsername: profile.username,
                avatarUrl: profile.photos?.[0]?.value
              });
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn("GitHub OAuth credentials not found. GitHub login will not be available.");
  }

  // Set up Google authentication strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    const googleCallbackURL = process.env.NODE_ENV === 'production'
      ? 'https://mrguru.dev/api/auth/google/callback'
      : 'http://localhost:3000/api/auth/google/callback';
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: googleCallbackURL
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            // Check if user already exists by email
            let user;
            if (profile.emails?.[0]?.value) {
              user = await storage.getUserByEmail(profile.emails[0].value);
            }
            
            if (!user) {
              // Create new user if it doesn't exist
              const username = profile.emails?.[0]?.value?.split('@')[0] || `google:${profile.id}`;
              user = await storage.createUser({
                username: username,
                password: await hashPassword(randomBytes(16).toString('hex')), // Random password since login is via Google
                email: profile.emails?.[0]?.value || '',
                full_name: profile.displayName || profile.name?.givenName || '',
                isAdmin: false,
                avatarUrl: profile.photos?.[0]?.value
              });
            } else {
              // Update existing user with Google info if needed
              if (!user.avatarUrl && profile.photos?.[0]?.value) {
                user = await storage.updateUser(user.id, {
                  avatarUrl: profile.photos[0].value
                });
              }
            }
            
            return done(null, user);
          } catch (error) {
            return done(error);
          }
        }
      )
    );
  } else {
    console.warn("Google OAuth credentials not found. Google login will not be available.");
  }

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create new user (adminApproved is always false by default)
      const user = await storage.createUser({
        username,
        email,
        password: await hashPassword(password),
        isAdmin: false,
        adminApproved: false
      });
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error during login after registration" });
        }
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error during logout" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // GitHub authentication routes
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    // Route to initiate GitHub authentication
    app.get('/api/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
    
    // GitHub callback route
    app.get(
      '/api/auth/github/callback',
      passport.authenticate('github', { 
        failureRedirect: '/auth?error=github_auth_failed',
      }),
      (req, res) => {
        // Successful authentication, redirect home
        console.log("GitHub authentication successful");
        res.redirect('/');
      }
    );
  }

  // Google authentication routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Route to initiate Google authentication
    app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    // Google callback route
    app.get(
      '/api/auth/google/callback',
      passport.authenticate('google', { 
        failureRedirect: '/auth?error=google_auth_failed',
      }),
      (req, res) => {
        // Successful authentication, redirect home
        console.log("Google authentication successful");
        res.redirect('/');
      }
    );
  }
}