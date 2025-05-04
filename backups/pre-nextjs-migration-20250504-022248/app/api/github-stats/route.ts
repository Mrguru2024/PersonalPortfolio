import { NextRequest, NextResponse } from "next/server";

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

// This endpoint will fetch GitHub statistics without updating skills
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username") || "Mrguru2024";
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  try {
    // First, get repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
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
      repos.slice(0, 15).map(async (repo) => { // Limit to 15 repos to avoid rate limits
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
    
    // Calculate total bytes for percentage calculations
    const totalBytes = Object.values(languageStats).reduce((sum, { bytes }) => sum + bytes, 0);
    
    // Add percentage to language stats
    const languageStatsWithPercentage = Object.entries(languageStats).map(([language, stats]) => ({
      language,
      repos: stats.count,
      bytes: stats.bytes,
      percentage: totalBytes > 0 ? Math.round((stats.bytes / totalBytes) * 100) : 0
    }));
    
    // Sort by bytes in descending order
    languageStatsWithPercentage.sort((a, b) => b.bytes - a.bytes);
    
    // Extract featured repositories (those with stars or recent updates)
    const featuredRepos = repos
      .filter(repo => repo.stargazers_count > 0 || new Date(repo.updated_at) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        stars: repo.stargazers_count,
        url: repo.html_url,
        updatedAt: repo.updated_at
      }));
    
    return NextResponse.json({
      username,
      repositoryCount: repos.length,
      languageStats: languageStatsWithPercentage,
      featuredRepositories: featuredRepos
    });
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return NextResponse.json(
      { error: `Failed to fetch GitHub stats: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}