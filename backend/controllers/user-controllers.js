//DEPENDANCIES 
const User = require("../models/User");
const jwt = require("jsonwebtoken");

async function getUsers(req, res) {
  try {
    const now = Date.now();
    const activeWindowMs = 90 * 1000;
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username role lastSeenAt avatar")
      .sort({ username: 1 })
      .limit(100);

    res.status(200).json(users.map((user) => {
      const lastSeenAt = user.lastSeenAt?.getTime();
      return {
        _id: user._id,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        isActive: typeof lastSeenAt === 'number' &&
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
    if (!req.user) return res.status(401).json({ message: "User must register or log in." });
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json({ message: "User authenticated.", user });
  } catch(error) {
    console.error(error);
    res.status(400).json({ message: error.message });
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
  verifyVeteranAccess,
  registerUser,
  loginUser
};