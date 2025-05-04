import { NextRequest, NextResponse } from "next/server";
import { db } from "../../db";
import { skills } from "@/shared/schema";
import { eq, sql } from "drizzle-orm";

// GitHub API type definitions
type GithubRepo = {
  name: string;
  description: string;
  language: string;
  stargazers_count: number;
  html_url: string;
  created_at: string;
  updated_at: string;
};

type GithubLanguage = {
  [key: string]: number;
};

// Define skill mappings to GitHub languages
const languageToSkillMapping: Record<string, string[]> = {
  JavaScript: ["JavaScript", "Node.js", "React"],
  TypeScript: ["TypeScript", "React", "Angular"],
  Python: ["Python", "Django", "Flask"],
  HTML: ["HTML", "Frontend Development"],
  CSS: ["CSS", "Tailwind CSS", "Bootstrap"],
  PHP: ["PHP", "Laravel"],
  Java: ["Java", "Spring"],
  Ruby: ["Ruby", "Ruby on Rails"],
  Go: ["Go"],
  Swift: ["Swift", "iOS Development"],
  Kotlin: ["Kotlin", "Android Development"],
  "C#": ["C#", ".NET", "ASP.NET"],
  Rust: ["Rust"],
  C: ["C"],
  "C++": ["C++"]
};

// Middleware function to fetch GitHub repositories
async function fetchGithubData(username: string) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  // First, get repositories
  const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
    headers: {
      ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {})
    }
  });
  
  if (!reposResponse.ok) {
    throw new Error(`Failed to fetch repositories: ${reposResponse.statusText}`);
  }
  
  const repos: GithubRepo[] = await reposResponse.json();
  
  // Calculate language frequencies
  const languageStats: Record<string, { count: number, bytes: number }> = {};
  
  // First we count the repos with each language
  repos.forEach(repo => {
    if (repo.language) {
      if (!languageStats[repo.language]) {
        languageStats[repo.language] = { count: 0, bytes: 0 };
      }
      languageStats[repo.language].count++;
    }
  });
  
  // Now we fetch language data for each repo to get bytes of code
  await Promise.all(
    repos.map(async (repo) => {
      if (!repo.language) return;
      
      const langResponse = await fetch(`https://api.github.com/repos/${username}/${repo.name}/languages`, {
        headers: {
          ...(GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {})
        }
      });
      
      if (langResponse.ok) {
        const languages: GithubLanguage = await langResponse.json();
        
        // Add bytes to the language stats
        Object.entries(languages).forEach(([lang, bytes]) => {
          if (!languageStats[lang]) {
            languageStats[lang] = { count: 0, bytes: 0 };
          }
          languageStats[lang].bytes += bytes;
        });
      }
    })
  );
  
  return {
    repos,
    languageStats
  };
}

// Calculate skill proficiency from GitHub language data
function calculateSkillProficiency(
  languageStats: Record<string, { count: number, bytes: number }>,
  skillName: string
): number {
  // Find languages that map to this skill
  const relevantLanguages = Object.entries(languageToSkillMapping)
    .filter(([_, skills]) => skills.includes(skillName))
    .map(([lang, _]) => lang);
  
  if (relevantLanguages.length === 0) {
    return 0; // No relevant languages for this skill
  }
  
  // Calculate a base score from the languages used
  let totalRelevantRepos = 0;
  let totalRelevantBytes = 0;
  
  relevantLanguages.forEach(lang => {
    if (languageStats[lang]) {
      totalRelevantRepos += languageStats[lang].count;
      totalRelevantBytes += languageStats[lang].bytes;
    }
  });
  
  // Calculate a score based on repo count and code volume
  // This is a simplified approach; you might want to refine this algorithm
  const repoScore = Math.min(100, totalRelevantRepos * 10); // Cap at 100%
  const byteScore = Math.min(100, Math.log10(totalRelevantBytes) * 20); // Log scale to handle large numbers
  
  // Combine scores with more weight on code volume
  const combinedScore = (repoScore * 0.4) + (byteScore * 0.6);
  
  // Ensure the score is between 30 and 98 for active skills
  return Math.max(30, Math.min(98, combinedScore));
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username") || "Mrguru2024";
  
  try {
    // Fetch GitHub data
    const githubData = await fetchGithubData(username);
    
    // Get all skills from the database
    const dbSkills = await db.select().from(skills);
    
    // Calculate new proficiency values based on GitHub data
    const updatedSkills = dbSkills.map(skill => {
      const newProficiency = calculateSkillProficiency(githubData.languageStats, skill.name);
      
      // Only update if GitHub data gives a higher proficiency (don't downgrade skills)
      const finalProficiency = Math.max(skill.percentage, Math.round(newProficiency));
      
      return {
        ...skill,
        percentage: finalProficiency,
        githubUpdated: finalProficiency > skill.percentage
      };
    });
    
    // Update the database with new proficiency values
    await Promise.all(
      updatedSkills
        .filter(skill => skill.githubUpdated)
        .map(skill => 
          db.update(skills)
            .set({ percentage: skill.percentage })
            .where(eq(skills.id, skill.id))
        )
    );
    
    // Return results
    return NextResponse.json({
      message: "Skills updated based on GitHub data",
      languageStats: githubData.languageStats,
      skills: updatedSkills,
      repositoryCount: githubData.repos.length,
    });
  } catch (error) {
    console.error("Error updating skills from GitHub:", error);
    return NextResponse.json(
      { error: `Failed to update skills from GitHub: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}