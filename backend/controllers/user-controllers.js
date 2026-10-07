//DEPENDANCIES 
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Conversation = require("../models/Conversation");
const jwt = require("jsonwebtoken");

async function getUsers(req, res) {
  try {
    const now = Date.now();
    const activeWindowMs = 90 * 1000;
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username role lastSeenAt avatar showActiveStatus")
      .sort({ username: 1 })
      .limit(100);

    res.status(200).json(users.map((user) => {
      const lastSeenAt = user.lastSeenAt?.getTime();
      return {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        isActive: user.showActiveStatus !== false &&
          typeof lastSeenAt === 'number' &&
          lastSeenAt <= now &&
          now - lastSeenAt <= activeWindowMs,
      };
    }));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch community members." });
  }
}

async function updatePresence(req, res) {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "User must register or log in." });
    }

    const result = await User.updateOne(
      { _id: currentUserId },
      { $set: { lastSeenAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ message: "Presence updated." });
  } catch (error) {
    console.error("Unable to update user presence:", error);
    return res.status(500).json({ message: "Unable to update user presence." });
  }
}

async function getUser(req, res) {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    if (!currentUserId) return res.status(401).json({ message: "User must register or log in." });
    const user = await User.findById(currentUserId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ message: "User authenticated.", user });
  } catch(error) {
    console.error(error);
    return res.status(500).json({ message: "Unable to fetch user profile." });
  }
}

async function updateProfile(req, res) {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "User must register or log in." });
    }

    const user = await User.findById(currentUserId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const body = req.body || {};
    const hasUpdate = [
      "username",
      "email",
      "password",
      "avatar",
      "pregnancyMonth",
      "momStatus",
      "showActiveStatus",
      "allowDirectMessages",
    ].some((field) => Object.prototype.hasOwnProperty.call(body, field));
    if (!hasUpdate) {
      return res.status(400).json({ message: "Provide at least one profile setting to update." });
    }

    if (Object.prototype.hasOwnProperty.call(body, "username")) {
      if (typeof body.username !== "string" || !body.username.trim()) {
        return res.status(400).json({ message: "Username cannot be empty." });
      }
      user.username = body.username.trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "email")) {
      if (typeof body.email !== "string" || !/.+@.+\..+/.test(body.email.trim())) {
        return res.status(400).json({ message: "Please provide a valid email address." });
      }
      const email = body.email.trim().toLowerCase();
      const existingUser = await User.findOne({ email, _id: { $ne: currentUserId } }).select("_id");
      if (existingUser) {
        return res.status(409).json({ message: "That email address is already in use." });
      }
      user.email = email;
    }

    if (Object.prototype.hasOwnProperty.call(body, "avatar")) {
      if (body.avatar !== null && typeof body.avatar !== "string") {
        return res.status(400).json({ message: "Profile image must be a string or null." });
      }
      if (typeof body.avatar === "string" && body.avatar.length > 8 * 1024 * 1024) {
        return res.status(413).json({ message: "Profile image is too large." });
      }
      if (typeof body.avatar === "string") user.avatar = body.avatar;
    }

    if (Object.prototype.hasOwnProperty.call(body, "pregnancyMonth")) {
      const month = Number(body.pregnancyMonth);
      if (!Number.isInteger(month) || month < 1 || month > 9) {
        return res.status(400).json({ message: "Pregnancy month must be a whole number from 1 to 9." });
      }
      user.pregnancyMonth = month;
    }

    if (Object.prototype.hasOwnProperty.call(body, "momStatus")) {
      const allowedStatuses = [
        "1st Trimester",
        "2nd Trimester",
        "3rd Trimester",
        "Newborn Season",
        "Toddler Pro",
      ];
      if (!allowedStatuses.includes(body.momStatus)) {
        return res.status(400).json({ message: "Choose a valid maternal stage." });
      }
      user.momStatus = body.momStatus;
    }

    for (const field of ["showActiveStatus", "allowDirectMessages"]) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        if (typeof body[field] !== "boolean") {
          return res.status(400).json({ message: `${field} must be true or false.` });
        }
        user[field] = body[field];
      }
    }

    if (Object.prototype.hasOwnProperty.call(body, "password")) {
      if (typeof body.password !== "string" || body.password.length < 7) {
        return res.status(400).json({ message: "Password must be at least 7 characters long." });
      }
      if (typeof body.currentPassword !== "string" || !body.currentPassword) {
        return res.status(400).json({ message: "Enter your current password to set a new password." });
      }
      if (!(await user.isCorrectPassword(body.currentPassword))) {
        return res.status(403).json({ message: "Current password is incorrect." });
      }
      user.password = body.password;
    }

    await user.save();
    const safeUser = user.toObject();
    delete safeUser.password;
    return res.status(200).json({ message: "Profile updated successfully.", user: safeUser });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That username or email address is already in use." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Unable to update user profile:", error);
    return res.status(500).json({ message: "Unable to update profile." });
  }
}

async function deleteAccount(req, res) {
  try {
    const currentUserId = req.user?._id || req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ message: "User must register or log in." });
    }

    const user = await User.findById(currentUserId).select("_id");
    if (!user) return res.status(404).json({ message: "User not found." });

    const ownedPosts = await Post.find({ userId: currentUserId }).select("_id");
    const ownedPostIds = ownedPosts.map((post) => post._id);
    await Comment.deleteMany({
      $or: [
        { author: currentUserId },
        { post: { $in: ownedPostIds } },
      ],
    });
    await Post.deleteMany({ userId: currentUserId });

    await Conversation.deleteMany({
      type: "direct",
      participants: currentUserId,
    });
    await Conversation.updateMany(
      { type: "group", participants: currentUserId },
      {
        $pull: {
          participants: currentUserId,
          messages: { sender: currentUserId },
        },
      }
    );
    await Conversation.deleteMany({
      type: "group",
      participants: { $size: 1 },
    });

    await User.deleteOne({ _id: currentUserId });
    return res.status(200).json({ message: "Account and associated content deleted." });
  } catch (error) {
    console.error("Unable to delete user account:", error);
    return res.status(500).json({ message: "Unable to delete account and associated content." });
  }
}

function verifyVeteranAccess(req, res) {
  return res.status(200).json({ message: "Veteran Mommy access verified." });
}

async function registerUser(req, res) {
  try {
    const foundUser = await User.findOne({ email: req.body.email });
    if (foundUser !== null) return res.status(400).json({ message: "This user already exists." });
    const newUser = await User.create({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
    });

    const payload = { _id: newUser._id, role: newUser.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2d' });

    res.status(201).json({ message: "User created successfully!", token });
  } catch(error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

async function loginUser(req, res) {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({ message: "Incorrect email or password."} );
    }

    const correctPw = await user.isCorrectPassword(req.body.password);

    if (!correctPw) {
      return res.status(400).json({ message: "Incorrect email or password." });
    }

    const payload = { _id: user._id, role: user.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({ message: "User logged in successfully!", token });
  } catch(error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updatePresence,
  getUser,
  updateProfile,
  deleteAccount,
  verifyVeteranAccess,
  registerUser,
  loginUser
};