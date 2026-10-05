//DEPENDANCIES 
const User = require("../models/user-model");
const jwt = require("jsonwebtoken");

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

async function registerUser(req, res) {
  try {
    const foundUser = await User.findOne({ email: req.body.email });
    if (foundUser !== null) return res.status(400).json({ message: "This user already exists." });
    const newUser = await User.create(req.body);

    const payload = { _id: newUser._id, role: newUser.role };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

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

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({ message: "User logged in successfully!", token });
  } catch(error) {
    console.error(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getUser,
  registerUser,
  loginUser
};