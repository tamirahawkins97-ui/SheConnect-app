const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../db/connection');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

//ensures the server loads sensitive keys and database credentials from root env file.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEMO_PASSWORD = 'SeedPassword123!';
const LEGACY_DEMO_POSTS = [
  'Taking a moment to celebrate the little milestones and the people who understand this journey.',
  'A gentle reminder to give yourself grace today. You are doing better than you think.',
  'Checking in with the community: what has brought you a little joy this week?',
];
const FAMILY_PHOTOS = [
  'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=900&q=80',
  'https://images.pexels.com/photos/4473864/pexels-photo-4473864.jpeg?auto=compress&cs=tinysrgb&w=900',
  'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Nefisa_her_husband_and_healthy_baby_%2815789518678%29.jpg/960px-Nefisa_her_husband_and_healthy_baby_%2815789518678%29.jpg',
  'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=900&q=80',
];
const DEMO_FAMILIES = [
  {
    username: 'mama.maya',
    email: 'maya@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/0.jpg',
    stories: [
      'Maya and Jo are making a little photo wall for their first baby. Choosing the frames together has become our favorite Sunday ritual.',
      'Our daughter kicked right on cue during Jo’s bedtime story. We already have a very enthusiastic book club of three.',
      'A slow park walk with Maya, Jo, and baby Nia gave us exactly the fresh air our family needed today.',
    ],
  },
  {
    username: 'mama.olivia',
    email: 'olivia@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/14.jpg',
    stories: [
      'Olivia’s village showed up with freezer meals and gentle check-ins this week. Letting people care for us is a new kind of strength.',
      'My little one and I picked the coziest corner for our first bedtime stories. One day at a time, we are finding our rhythm.',
      'Grandma joined our stroller walk and taught baby Amari the family’s favorite lullaby.',
    ],
  },
  {
    username: 'mama.sophia',
    email: 'sophia@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/21.jpg',
    stories: [
      'Sophia’s twins have started responding to each other’s kicks. Their tiny back-and-forth is already the sweetest conversation.',
      'We are setting up two little spaces side by side and learning that “matching” can still mean wonderfully different.',
      'A quiet afternoon with the twins and their big sister reminded us that every family milestone deserves its own celebration.',
    ],
  },
  {
    username: 'mama.amara',
    email: 'amara@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/99.jpg',
    stories: [
      'Amara’s family gathered across three generations to make a welcome blanket. Every square came with a story and a lot of love.',
      'The cousins made a playlist for the new baby, and now our whole home has an unofficial soundtrack.',
      'A sunny visit with aunties, cousins, and baby Kofi turned an ordinary afternoon into a family memory.',
    ],
  },
  {
    username: 'mama.ella',
    email: 'ella@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/48.jpg',
    stories: [
      'Ella and her partner are blending two bedtime routines into one. Our older kids are already lobbying for their favorite songs.',
      'The big siblings picked a tiny book for the baby and proudly practiced reading it together.',
      'Our blended crew made room for one more chair at the table and one more name on the family photo wall.',
    ],
  },
  {
    username: 'mama.naomi',
    email: 'naomi@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
    stories: [
      'Naomi and her wife are preparing for their first placement with a room full of soft blankets and a lot of hopeful hearts.',
      'We are learning to hold space for the joyful unknowns and making sure our support circle knows how to show up.',
      'Our first family photo together is going on the mantel, right beside the tiny shoes we picked out as a team.',
    ],
  },
  {
    username: 'mama.zara',
    email: 'zara@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/50.jpg',
    stories: [
      'Zara and her co-parent made a shared calendar for appointments and little wins. Teamwork is already making this feel lighter.',
      'We took turns choosing songs for the baby and discovered our playlists have more in common than we thought.',
      'Both sides of the family came to cheer at the anatomy scan. This baby already has a very enthusiastic fan club.',
    ],
  },
  {
    username: 'mama.luna',
    email: 'luna@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    stories: [
      'Luna’s first pregnancy journal has room for questions, tiny sketches, and the things we want to remember along the way.',
      'We made a small “ask for help” list together and realized our friends are excited to be part of the village.',
      'A gentle morning at home with our newborn felt like the first page of a story we will keep writing together.',
    ],
  },
  {
    username: 'mama.aria',
    email: 'aria@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/61.jpg',
    stories: [
      'Aria’s family is collecting lullabies in both languages so the baby can grow up surrounded by familiar voices.',
      'We labeled the nursery shelves together, then promptly celebrated with snacks and a very long rest.',
      'Grandpa’s first video call with baby Sol came with three songs, two stories, and a promise to visit soon.',
    ],
  },
  {
    username: 'mama.grace',
    email: 'grace@sheconnect.test',
    avatar: 'https://randomuser.me/api/portraits/women/39.jpg',
    stories: [
      'Grace and her partner are getting ready for their new arrival with a practical checklist and plenty of room for surprises.',
      'Our neighbors left a tiny hand-knitted hat at the door. This community keeps finding thoughtful ways to say “we are here.”',
      'We finally took a family walk with the stroller and stopped for a photo when the baby fell asleep in the sunshine.',
    ],
  },
].map((family, familyIndex) => ({
  ...family,
  stories: family.stories.map((message, storyIndex) => ({
    message,
    imageURL: FAMILY_PHOTOS[(familyIndex + storyIndex) % FAMILY_PHOTOS.length],
  })),
}));
const DEMO_COMMENTS = [
  'Thank you for sharing this with us. Sending you so much love today.',
  'I needed this reminder, mama. We are all cheering you on.',
  'So glad you shared this here. How has the rest of your week been?',
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
    let updatedAvatarCount = 0;
    for (const demoFamily of DEMO_FAMILIES) {
      let user = await User.findOne({ email: demoFamily.email });

      if (!user) {
        const usernameTaken = await User.exists({ username: demoFamily.username });
        if (usernameTaken) {
          console.warn(`Skipping reserved demo username: ${demoFamily.username}`);
          continue;
        }

        user = await User.create({
          username: demoFamily.username,
          email: demoFamily.email,
          avatar: demoFamily.avatar,
          password: DEMO_PASSWORD,
        });
        createdUserCount += 1;
      } else if (user.avatar !== demoFamily.avatar) {
        user.avatar = demoFamily.avatar;
        await user.save();
        updatedAvatarCount += 1;
      }

      demoUsers.push(user);
    }

    let createdPostCount = 0;
    let updatedPostCount = 0;
    for (const user of demoUsers) {
      const family = DEMO_FAMILIES.find((item) => item.email === user.email);
      if (!family) continue;

      const legacyPosts = await Post.find({
        userId: user._id,
        message: { $in: LEGACY_DEMO_POSTS },
      }).sort({ createdAt: 1 }).limit(family.stories.length);

      for (let index = 0; index < legacyPosts.length; index += 1) {
        const oldPost = legacyPosts[index];
        const story = family.stories[index];
        const conflictingStory = await Post.exists({ userId: user._id, message: story.message });
        if (conflictingStory) continue;

        oldPost.message = story.message;
        oldPost.imageURL = story.imageURL;
        await oldPost.save();
        updatedPostCount += 1;
      }

      for (const story of family.stories) {
        const existingPost = await Post.findOne({ userId: user._id, message: story.message });
        if (existingPost) {
          if (existingPost.imageURL !== story.imageURL) {
            existingPost.imageURL = story.imageURL;
            await existingPost.save();
            updatedPostCount += 1;
          }
          continue;
        }

        await Post.create({
          userId: user._id,
          message: story.message,
          imageURL: story.imageURL,
          Week: 24,
          Day: 3,
          Trimester: '2nd Trimester',
          dueDate: new Date(Date.now() + 16 * 7 * 24 * 60 * 60 * 1000).toISOString(),
        });
        createdPostCount += 1;
      }
    }

    const demoStoryMessages = DEMO_FAMILIES.flatMap((family) =>
      family.stories.map((story) => story.message)
    );
    const seededPosts = await Post.find({
      userId: { $in: demoUsers.map((user) => user._id) },
      message: { $in: demoStoryMessages },
    }).select('_id userId').lean();
    const seededPostIds = seededPosts.map((post) => post._id);
    const existingComments = await Comment.find({
      post: { $in: seededPostIds },
      text: { $in: DEMO_COMMENTS },
    }).select('post author text').lean();
    const existingCommentKeys = new Set(
      existingComments.map((comment) => `${comment.post}:${comment.author}:${comment.text}`)
    );
    const demoCommentsToCreate = [];

    for (const post of seededPosts) {
      const ownerIndex = demoUsers.findIndex((user) => user._id.toString() === post.userId.toString());
      for (let commentIndex = 0; commentIndex < DEMO_COMMENTS.length; commentIndex += 1) {
        const author = demoUsers[(ownerIndex + commentIndex + 1) % demoUsers.length];
        const text = DEMO_COMMENTS[commentIndex];
        const key = `${post._id}:${author._id}:${text}`;

        if (existingCommentKeys.has(key)) continue;
        demoCommentsToCreate.push({ post: post._id, author: author._id, text });
        existingCommentKeys.add(key);
      }
    }

    if (demoCommentsToCreate.length > 0) {
      await Comment.insertMany(demoCommentsToCreate);
    }

    console.log(
      `Demo users created: ${createdUserCount}; profiles updated with photos: ${updatedAvatarCount}; demo posts created: ${createdPostCount}; demo posts updated with photos: ${updatedPostCount}; demo comments created: ${demoCommentsToCreate.length}.`
    );
    console.log(`Demo login (newly created accounts): ${DEMO_FAMILIES[0].email} / ${DEMO_PASSWORD}`);
    console.log('Non-demo users and posts were not deleted or modified.');
    console.log('--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('Demo data seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();