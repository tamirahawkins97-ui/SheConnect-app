const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../db/connection');
const User = require('../models/User');
const Post = require('../models/Post');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEMO_PASSWORD = 'SeedPassword123!';
const DEMO_USERS = [
  { username: 'mama.maya', email: 'maya@sheconnect.test' },
  { username: 'mama.olivia', email: 'olivia@sheconnect.test' },
  { username: 'mama.sophia', email: 'sophia@sheconnect.test' },
  { username: 'mama.amara', email: 'amara@sheconnect.test' },
  { username: 'mama.ella', email: 'ella@sheconnect.test' },
  { username: 'mama.naomi', email: 'naomi@sheconnect.test' },
  { username: 'mama.zara', email: 'zara@sheconnect.test' },
  { username: 'mama.luna', email: 'luna@sheconnect.test' },
  { username: 'mama.aria', email: 'aria@sheconnect.test' },
  { username: 'mama.grace', email: 'grace@sheconnect.test' },
];
const DEMO_POSTS = [
  'Taking a moment to celebrate the little milestones and the people who understand this journey.',
  'A gentle reminder to give yourself grace today. You are doing better than you think.',
  'Checking in with the community: what has brought you a little joy this week?',
];

async function seedDatabase() {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to create demo data in production.');
    }

    await connectDB();

    console.log('--- Adding SheConnect demo data (existing data is preserved) ---');

    const demoUsers = [];
    let createdUserCount = 0;
    for (const demoUser of DEMO_USERS) {
      let user = await User.findOne({ email: demoUser.email });

      if (!user) {
        const usernameTaken = await User.exists({ username: demoUser.username });
        if (usernameTaken) {
          console.warn(`Skipping reserved demo username: ${demoUser.username}`);
          continue;
        }

        user = await User.create({
          ...demoUser,
          password: DEMO_PASSWORD,
        });
        createdUserCount += 1;
      }

      demoUsers.push(user);
    }

    let createdPostCount = 0;
    for (const user of demoUsers) {
      for (const message of DEMO_POSTS) {
        const existingPost = await Post.exists({ userId: user._id, message });
        if (existingPost) continue;

        await Post.create({
          userId: user._id,
          message,
          Week: 24,
          Day: 3,
          Trimester: '2nd Trimester',
          dueDate: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        createdPostCount += 1;
      }
    }

    console.log(`Demo users created: ${createdUserCount}; demo posts created: ${createdPostCount}.`);
    console.log(`Demo login (newly created accounts): ${DEMO_USERS[0].email} / ${DEMO_PASSWORD}`);
    console.log('Existing users and posts were not deleted or modified.');
    console.log('--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('Demo data seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();