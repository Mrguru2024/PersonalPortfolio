import { db } from './db';
import { projects, skills, contacts } from '@shared/schema';
import { 
  projects as staticProjects, 
  frontendSkills,
  backendSkills,
  devopsSkills,
  personalInfo,
  socialLinks,
  contactInfo
} from '../client/src/lib/data';

async function seedProjects() {
  console.log('Seeding projects...');
  
  // Clear existing projects
  await db.delete(projects);
  
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

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    await seedProjects();
    await seedSkills();
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();