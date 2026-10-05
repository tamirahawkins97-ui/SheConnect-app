// backend/seeds/seed.js
import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// 1. IMPORT DATABASE CONFIGURATION FUNCTION
import connectDB from '../config/db.js'; 

// 2. IMPORT YOUR MODELS (Needed to actually call .create or .insertMany)
import User from '../models/User.js';
import Post from '../models/Post.js';

// Initialize environment variables (so MONGO_URI works)
dotenv.config();

const SEED_COUNT_USERS = 10;
const SEED_COUNT_POSTS_PER_USER = 3;

async function seedDatabase() {
  try {
    
    await connectDB(); 

    // Now that we are connected, we can interact with the DB collections
    console.log('--- Seeding Process Started ---');

    // Clear existing data (using the User and Post models)
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing Users and Posts collections.');

    const createdUsers = [];

    // --- SEED USERS LOOP (Same as explained previously) ---
    console.log('Generating fake users...');
    for (let i = 0; i < SEED_COUNT_USERS; i++) {
      const user = await User.create({
        username: faker.internet.userName().toLowerCase(),
        email: faker.internet.email().toLowerCase(),
     
        password_hash: '$2b$10$e8wF58fKx6HjQW9Z2ZgTGe...fakehash...',
      });
      createdUsers.push(user);
    }
    console.log(`Successfully seeded ${createdUsers.length} users.`);

    const postsToInsert = [];
    console.log('Generating fake posts...');
    const trimesters = ['1st Trimester', '2nd Trimester', '3rd Trimester', 'Postpartum'];

    // We loop through each user we just made...
    for (const user of createdUsers) {
      // ...and create 3 posts for that specific user.
      for (let j = 0; j < SEED_COUNT_POSTS_PER_USER; j++) {
        postsToInsert.push({
          user_id: user._id, // This links the post to the user
          message: faker.lorem.paragraph({ min: 2, max: 4 }),
          image_url: faker.image.urlLoremFlickr({ category: 'baby' }),
          gestational_week: faker.number.int({ min: 4, max: 40 }),
          gestational_day: faker.number.int({ min: 1, max: 7 }),
          trimester: faker.helpers.arrayElement(trimesters),
          expected_due_date: faker.date.future({ years: 1 }),
        });
      }
    }

    await Post.insertMany(postsToInsert);
    console.log(`Successfully seeded ${postsToInsert.length} posts.`);

    console.log('--- Seeding Completed Successfully! ---');

    process.exit(0); 

  } catch (error) {
    console.error('CRITICAL ERROR DURING SEEDING:', error.message);
    process.exit(1);
  }
}

// Start the function
seedDatabase();