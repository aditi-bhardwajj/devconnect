const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./models/user");
const Post = require("./models/post");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.log("MongoDB error:", err);
    process.exit(1);
  });

// ------------------- SIGNUP -------------------
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Error signing up" });
  }
});

// ------------------- LOGIN -------------------
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ message: "Error logging in" });
  }
});

// ------------------- AUTH MIDDLEWARE -------------------
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.json({ message: "Invalid token" });
  }
};

// ------------------- CREATE POST -------------------
app.post("/posts", auth, async (req, res) => {
  try {
    const post = new Post({
      content: req.body.content,
      user: req.userId,
    });

    await post.save();

    res.json({ message: "Post created" });
  } catch (err) {
    res.status(500).json({ message: "Error creating post" });
  }
});

// ------------------- GET POSTS -------------------
app.get("/posts", auth, async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name");
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// ------------------- DELETE POST -------------------
app.delete("/posts/:id", auth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting post" });
  }
});

// ------------------- SERVER -------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});