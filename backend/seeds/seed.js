const path = require('path');
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const dotenv = require('dotenv');
const connectDB = require('../db/connection');
const User = require('../models/User');
const Post = require('../models/Post');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SEED_COUNT_USERS = 10;
const SEED_COUNT_POSTS_PER_USER = 3;

async function seedDatabase() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to run a destructive seed script in production.');
    }

    await connectDB();

    console.log('--- Seeding Process Started ---');

    await Post.deleteMany({});
    await User.deleteMany({});
    console.log('Cleared existing Users and Posts collections.');

    const createdUsers = [];

    console.log('Generating fake users...');
    for (let i = 0; i < SEED_COUNT_USERS; i++) {
      const user = await User.create({
        username: faker.internet.username().toLowerCase(),
        email: faker.internet.email().toLowerCase(),
        password: 'SeedPassword123!',
      });
      createdUsers.push(user);
    }
    console.log(`Successfully seeded ${createdUsers.length} users.`);

    const postsToInsert = [];
    console.log('Generating fake posts...');
    const trimesters = ['1st Trimester', '2nd Trimester', '3rd Trimester', 'Postpartum'];

    for (const user of createdUsers) {
      for (let j = 0; j < SEED_COUNT_POSTS_PER_USER; j++) {
        const gestationalWeek = faker.number.int({ min: 4, max: 40 });
        postsToInsert.push({
          userId: user._id,
          message: faker.lorem.paragraph({ min: 2, max: 4 }),
          imageURL: faker.image.url(),
          Week: gestationalWeek,
          Day: faker.number.int({ min: 1, max: 7 }),
          Trimester: faker.helpers.arrayElement(trimesters),
          dueDate: faker.date.future({ years: 1 }).toISOString(),
        });
      }
    }

    await Post.insertMany(postsToInsert);
    console.log(`Successfully seeded ${postsToInsert.length} posts.`);

    console.log('--- Seeding Completed Successfully! ---');
  } catch (error) {
    console.error('CRITICAL ERROR DURING SEEDING:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();