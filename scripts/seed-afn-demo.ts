/**
 * Seed AFN demo content: discussion posts, comments, collaboration posts, resources.
 * Run after db:push and at least one user + AFN profile exist.
 * Usage: tsx scripts/seed-afn-demo.ts
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env.local");
try {
  const envFile = readFileSync(envPath, "utf-8");
  envFile.split("\n").forEach((line) => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  });
} catch {
  // ignore
}

import { db } from "../server/db";
import {
  users,
  afnProfiles,
  afnDiscussionCategories,
  afnDiscussionPosts,
  afnDiscussionComments,
  afnCollaborationPosts,
  afnResources,
} from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedAfnDemo() {
  console.log("Seeding AFN demo content...");

  const [firstUser] = await db.select().from(users).limit(1);
  if (!firstUser) {
    console.log("No user found. Create a user and complete community onboarding first.");
    process.exit(0);
    return;
  }
  const userId = firstUser.id;
  const profile = await db.select().from(afnProfiles).where(eq(afnProfiles.userId, userId)).limit(1);
  if (profile.length === 0) {
    console.log("No AFN profile for first user. Complete community onboarding first.");
    process.exit(0);
    return;
  }

  const categories = await db.select().from(afnDiscussionCategories).where(eq(afnDiscussionCategories.isActive, true));
  if (categories.length === 0) {
    console.log("No discussion categories. Run npm run db:seed first.");
    process.exit(0);
    return;
  }

  const cat = categories[0];
  const now = new Date();

  const [post1] = await db
    .insert(afnDiscussionPosts)
    .values({
      authorId: userId,
      categoryId: cat.id,
      title: "What’s your biggest bottleneck right now?",
      slug: "biggest-bottleneck-right-now",
      body: "I’m curious what other founders are struggling with this month. For us it’s been balancing product work with outbound. What’s yours?",
      excerpt: "I’m curious what other founders are struggling with this month.",
      status: "published",
      helpfulCount: 0,
      commentCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  if (post1) {
    await db.insert(afnDiscussionComments).values({
      postId: post1.id,
      authorId: userId,
      body: "Great question. For me it's been prioritization—too many ideas, not enough focus.",
      status: "published",
      createdAt: now,
      updatedAt: now,
    });
    await db.update(afnDiscussionPosts).set({ commentCount: 1, updatedAt: now }).where(eq(afnDiscussionPosts.id, post1.id));
  }

  const [post2] = await db
    .insert(afnDiscussionPosts)
    .values({
      authorId: userId,
      categoryId: cat.id,
      title: "How do you structure your first 10 customer calls?",
      slug: "structure-first-10-customer-calls",
      body: "Looking for a simple framework to get the most out of early discovery calls. What questions do you always ask?",
      excerpt: "Looking for a simple framework to get the most out of early discovery calls.",
      status: "published",
      helpfulCount: 0,
      commentCount: 0,
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  await db.insert(afnCollaborationPosts).values({
    authorId: userId,
    type: "looking_for_partner",
    title: "Looking for a technical co-founder",
    description: "I’m a non-technical founder with a validated idea and early traction. Looking for a technical partner to build the product. Prefer someone with experience in Next.js and APIs.",
    status: "open",
    contactPreference: "inbox",
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(afnCollaborationPosts).values({
    authorId: userId,
    type: "offering_services",
    title: "Offering: funnel and landing page audits",
    description: "I can review your funnel or landing page and give you a short written audit with 3–5 actionable fixes. Free for community members. DM me if interested.",
    status: "open",
    contactPreference: "inbox",
    createdAt: now,
    updatedAt: now,
  });

  await db
    .insert(afnResources)
    .values({
      slug: "founder-weekly-planning-template",
      title: "Founder weekly planning template",
      description: "A simple one-pager to plan your week: top 3 outcomes, key tasks, and one thing to delegate or drop.",
      type: "guide",
      isFeatured: true,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: afnResources.slug,
      set: { title: "Founder weekly planning template", updatedAt: now },
    });

  await db
    .insert(afnResources)
    .values({
      slug: "first-10-customers-checklist",
      title: "First 10 customers checklist",
      description: "Checklist for getting your first 10 paying customers: outreach, discovery, and closing.",
      type: "guide",
      isFeatured: false,
      isPublished: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: afnResources.slug,
      set: { title: "First 10 customers checklist", updatedAt: now },
    });

  console.log("AFN demo content seeded: 2 discussion posts, 1 comment, 2 collab posts, 2 resources.");
  process.exit(0);
}

seedAfnDemo().catch((e) => {
  console.error(e);
  process.exit(1);
});
