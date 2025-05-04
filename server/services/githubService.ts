import { Octokit } from 'octokit';
import { Skill } from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Initialize the Octokit client with the GitHub token from environment variables
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// The GitHub username to fetch data for (from env or default)
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'Mrguru2024';

// Configure caching
const CACHE_DIR = path.join(process.cwd(), '.cache');
const SKILLS_CACHE_FILE = path.join(CACHE_DIR, 'github-skills-cache.json');
const REPO_CACHE_FILE = path.join(CACHE_DIR, 'github-repos-cache.json');
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

// Create cache directory if it doesn't exist
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (error) {
  console.warn('Warning: Could not create cache directory:', error);
}

export const githubService = {
  /**
   * Check if cached data exists and is still valid
   * @param cacheFile Path to the cache file
   * @returns True if cache exists and is valid, false otherwise
   */
  isCacheValid(cacheFile: string): boolean {
    try {
      if (!fs.existsSync(cacheFile)) {
        return false;
      }

      const stats = fs.statSync(cacheFile);
      const now = new Date().getTime();
      const fileTime = stats.mtime.getTime();
      return now - fileTime < CACHE_TTL;
    } catch (error) {
      console.warn(`Warning: Could not check cache validity for ${cacheFile}:`, error);
      return false;
    }
  },

  /**
   * Read data from cache file
   * @param cacheFile Path to the cache file
   * @returns Cached data or null if not available
   */
  readCache<T>(cacheFile: string): T | null {
    try {
      if (!this.isCacheValid(cacheFile)) {
        return null;
      }
      
      const data = fs.readFileSync(cacheFile, 'utf8');
      return JSON.parse(data) as T;
    } catch (error) {
      console.warn(`Warning: Could not read cache from ${cacheFile}:`, error);
      return null;
    }
  },

  /**
   * Write data to cache file
   * @param cacheFile Path to the cache file
   * @param data Data to cache
   */
  writeCache(cacheFile: string, data: any): void {
    try {
      fs.writeFileSync(cacheFile, JSON.stringify(data), 'utf8');
    } catch (error) {
      console.warn(`Warning: Could not write cache to ${cacheFile}:`, error);
    }
  },

  /**
   * Fetch language statistics from GitHub repositories with caching
   * This aggregates language usage across all repos
   */
  async fetchLanguageStats() {
    // Try to get from cache first
    console.log('Using GitHub token for skills data');
    const cachedStats = this.readCache<Record<string, number>>(SKILLS_CACHE_FILE);
    if (cachedStats) {
      console.log('Using cached GitHub skills data');
      return cachedStats;
    }

    console.log('Fetching GitHub language stats...');
    
    try {
      // Get user repositories
      const { data: repos } = await octokit.request('GET /users/{username}/repos', {
        username: GITHUB_USERNAME,
        per_page: 100,
        sort: 'updated',
      });

      // Aggregate language data across all repos
      const languageStats: Record<string, number> = {};
      const languagePromises = repos.map(async (repo) => {
        if (repo.fork) return; // Skip forked repositories
        
        try {
          const { data: languages } = await octokit.request('GET /repos/{owner}/{repo}/languages', {
            owner: GITHUB_USERNAME,
            repo: repo.name,
          });
          
          // Add language bytes to totals
          Object.entries(languages).forEach(([language, bytes]) => {
            languageStats[language] = (languageStats[language] || 0) + bytes;
          });
        } catch (error) {
          console.error(`Error fetching languages for ${repo.name}:`, error);
        }
      });
      
      await Promise.all(languagePromises);
      
      // Calculate percentages
      const totalBytes = Object.values(languageStats).reduce((sum, bytes) => sum + bytes, 0);
      const languagePercentages: Record<string, number> = {};
      
      Object.entries(languageStats).forEach(([language, bytes]) => {
        const percentage = Math.round((bytes / totalBytes) * 100);
        languagePercentages[language] = percentage;
      });
      
      // Cache the results
      this.writeCache(SKILLS_CACHE_FILE, languagePercentages);
      
      return languagePercentages;
    } catch (error) {
      console.error('Error fetching GitHub language stats:', error);
      throw new Error('Failed to fetch GitHub language stats');
    }
  },

  /**
   * Map GitHub languages to skill categories
   * @param languageStats Object with language names and percentages
   * @returns Object with categorized skills
   */
  mapLanguagesToSkills(languageStats: Record<string, number>): Record<string, Skill[]> {
    const languageCategories: Record<string, string> = {
      // Frontend languages
      JavaScript: 'frontend',
      TypeScript: 'frontend',
      HTML: 'frontend',
      CSS: 'frontend',
      Vue: 'frontend',
      React: 'frontend',
      Svelte: 'frontend',

      // Backend languages
      PHP: 'backend',
      Python: 'backend',
      Java: 'backend',
      Ruby: 'backend',
      'C#': 'backend',
      Go: 'backend',
      Rust: 'backend',
      'C++': 'backend',
      C: 'backend',
      Kotlin: 'backend',
      Swift: 'backend',
      Perl: 'backend',
      Shell: 'backend',
      
      // DevOps and tools
      Dockerfile: 'devops',
      YAML: 'devops',
      HCL: 'devops',
      PowerShell: 'devops',
      Bash: 'devops',
    };

    // JavaScript can be both frontend and backend
    if (languageStats.JavaScript) {
      const jsPercentage = languageStats.JavaScript;
      // Split JavaScript between frontend and backend if Node.js related files exist
      languageStats.JavaScript = Math.round(jsPercentage * 0.6); // 60% to frontend
      languageStats['Node.js'] = Math.round(jsPercentage * 0.4); // 40% to backend
      languageCategories['Node.js'] = 'backend';
    }

    // HTML & CSS are often used together
    if (languageStats.HTML && languageStats.CSS) {
      languageStats['HTML & CSS'] = Math.round((languageStats.HTML + languageStats.CSS) / 2);
      delete languageStats.HTML;
      delete languageStats.CSS;
      languageCategories['HTML & CSS'] = 'frontend';
    }

    // Categorize languages into skills
    const categorizedSkills: Record<string, Skill[]> = {
      frontend: [],
      backend: [],
      devops: []
    };

    Object.entries(languageStats).forEach(([language, percentage], index) => {
      // Skip languages with very low percentages
      if (percentage < 5) return;
      
      const category = languageCategories[language] || 'devops'; // Default to devops for unknown languages
      
      categorizedSkills[category].push({
        id: index + 1,
        name: language,
        percentage: percentage,
        category: category,
        endorsement_count: 0
      });
    });

    return categorizedSkills;
  },

  /**
   * Fetch repository information for a user with caching
   */
  async fetchRepositories() {
    // Try to get from cache first
    console.log('Checking for cached repository data');
    const cachedRepos = this.readCache<Array<any>>(REPO_CACHE_FILE);
    if (cachedRepos) {
      console.log('Using cached GitHub repository data');
      return cachedRepos;
    }

    console.log('Fetching GitHub repositories...');
    
    try {
      const { data: repos } = await octokit.request('GET /users/{username}/repos', {
        username: GITHUB_USERNAME,
        per_page: 100,
        sort: 'updated',
      });

      // Filter out forks and sort by stars
      const ownRepos = repos
        .filter(repo => !repo.fork)
        .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));

      const formattedRepos = ownRepos.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updated: repo.updated_at
      }));
      
      // Cache the results
      this.writeCache(REPO_CACHE_FILE, formattedRepos);
      
      return formattedRepos;
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      
      // In case of error in production, fallback to a safer approach
      if (process.env.NODE_ENV === 'production') {
        console.log('Production environment detected, using backup data if available');
        // Try to use older cached data even if expired
        try {
          if (fs.existsSync(REPO_CACHE_FILE)) {
            const staleData = fs.readFileSync(REPO_CACHE_FILE, 'utf8');
            return JSON.parse(staleData);
          }
        } catch (cacheError) {
          console.error('Error reading backup repository data:', cacheError);
        }
      }
      
      throw new Error('Failed to fetch GitHub repositories');
    }
  },
  
  /**
   * Get skills data with fallback for production environments
   */
  async getSkillsData(): Promise<Record<string, Skill[]>> {
    try {
      // Try to get skills from GitHub
      const languageStats = await this.fetchLanguageStats();
      return this.mapLanguagesToSkills(languageStats);
    } catch (error) {
      console.error('Error fetching GitHub skills:', error);
      
      // In production, use a more robust fallback strategy
      if (process.env.NODE_ENV === 'production') {
        // Try to use cached data even if expired
        try {
          if (fs.existsSync(SKILLS_CACHE_FILE)) {
            const staleData = fs.readFileSync(SKILLS_CACHE_FILE, 'utf8');
            const stats = JSON.parse(staleData);
            return this.mapLanguagesToSkills(stats);
          }
        } catch (cacheError) {
          console.error('Error reading backup skills data:', cacheError);
        }
        
        // If all else fails in production, return default skills to ensure UI works
        console.log('Falling back to default skills data for production');
        return {
          frontend: [
            { id: 49, name: 'JavaScript', percentage: 85, category: 'frontend', endorsement_count: 0 },
            { id: 50, name: 'HTML & CSS', percentage: 90, category: 'frontend', endorsement_count: 0 },
            { id: 51, name: 'React', percentage: 80, category: 'frontend', endorsement_count: 0 },
            { id: 52, name: 'Responsive Design', percentage: 85, category: 'frontend', endorsement_count: 0 },
          ],
          backend: [
            { id: 53, name: 'Node.js', percentage: 75, category: 'backend', endorsement_count: 0 },
            { id: 54, name: 'Express', percentage: 70, category: 'backend', endorsement_count: 0 },
            { id: 55, name: 'MongoDB', percentage: 65, category: 'backend', endorsement_count: 0 },
            { id: 56, name: 'Java', percentage: 60, category: 'backend', endorsement_count: 0 },
          ],
          devops: [
            { id: 57, name: 'Git/GitHub', percentage: 85, category: 'devops', endorsement_count: 0 },
            { id: 58, name: 'Vercel', percentage: 75, category: 'devops', endorsement_count: 0 },
            { id: 59, name: 'Netlify', percentage: 70, category: 'devops', endorsement_count: 0 },
            { id: 60, name: 'VS Code', percentage: 90, category: 'devops', endorsement_count: 0 }
          ]
        };
      }
      
      // In development, propagate the error
      throw error;
    }
  }
};