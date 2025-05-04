import { Octokit } from 'octokit';
import { Skill } from '@shared/schema';

// Initialize the Octokit client
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// The GitHub username to fetch data for
const GITHUB_USERNAME = 'Mrguru2024';

export const githubService = {
  /**
   * Fetch language statistics from GitHub repositories
   * This aggregates language usage across all repos
   */
  async fetchLanguageStats() {
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
   * Fetch repository information for a user
   */
  async fetchRepositories() {
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

      return ownRepos.map(repo => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        language: repo.language,
        updated: repo.updated_at
      }));
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      throw new Error('Failed to fetch GitHub repositories');
    }
  }
};