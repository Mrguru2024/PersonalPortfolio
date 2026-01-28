import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

try {
  const envFile = readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^#][^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local file:', error);
}

import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq, or } from 'drizzle-orm';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    const email = '5epmgllc@gmail.com';
    const password = 'Destiny@2028';
    const username = email.split('@')[0]; // Use email prefix as username

    console.log('Creating/updating admin user...');
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);

    // Check if user exists by email or username
    const existingUsers = await db
      .select()
      .from(users)
      .where(or(eq(users.email, email), eq(users.username, username)));

    const hashedPassword = await hashPassword(password);

    if (existingUsers.length > 0) {
      // Update existing user to admin
      const existingUser = existingUsers[0];
      console.log(`Found existing user with ID: ${existingUser.id}`);
      
      const [updatedUser] = await db
        .update(users)
        .set({
          email: email,
          username: username,
          password: hashedPassword,
          isAdmin: true,
          adminApproved: true,
          role: 'admin'
        })
        .where(eq(users.id, existingUser.id))
        .returning();

      console.log('✅ User updated to admin successfully!');
      console.log(`User ID: ${updatedUser.id}`);
      console.log(`Username: ${updatedUser.username}`);
      console.log(`Email: ${updatedUser.email}`);
      console.log(`Is Admin: ${updatedUser.isAdmin}`);
      console.log(`Role: ${updatedUser.role}`);
    } else {
      // Create new admin user
      const [newUser] = await db
        .insert(users)
        .values({
          username: username,
          email: email,
          password: hashedPassword,
          isAdmin: true,
          adminApproved: true,
          role: 'admin'
        })
        .returning();

      console.log('✅ Admin user created successfully!');
      console.log(`User ID: ${newUser.id}`);
      console.log(`Username: ${newUser.username}`);
      console.log(`Email: ${newUser.email}`);
      console.log(`Is Admin: ${newUser.isAdmin}`);
      console.log(`Role: ${newUser.role}`);
    }

    console.log('\n✅ Admin user setup complete!');
    console.log('You can now login with:');
    console.log(`  Username: ${username}`);
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

createAdminUser();
