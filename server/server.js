require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("./models/user");
const Post = require("./models/post");

const app = express();

// ✅ Debug ENV
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded" : "Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "Loaded" : "Missing");

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ------------------- DB CONNECT -------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });

// ------------------- TEST ROUTE -------------------
app.get("/", (req, res) => {
  res.send("API is running...");
});

// ------------------- SIGNUP -------------------
app.post("/signup", async (req, res) => {
  try {
    console.log("REQ BODY:", req.body);

    const { name, email, password } = req.body;

    // ✅ validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "Signup successful" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------- LOGIN -------------------
app.post("/login", async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ------------------- AUTH -------------------
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ------------------- CREATE POST -------------------
app.post("/posts", auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const post = new Post({
      content,
      user: req.userId,
    });

    await post.save();

    res.status(201).json({ message: "Post created" });

  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: "Error creating post" });
  }
});

// ------------------- GET POSTS -------------------
app.get("/posts", auth, async (req, res) => {
  try {
    const posts = await Post.find().populate("user", "name");
    res.json(posts);
  } catch (err) {
    console.error("Fetch posts error:", err);
    res.status(500).json({ message: "Error fetching posts" });
  }
});

// ------------------- DELETE POST -------------------
app.delete("/posts/:id", auth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Error deleting post" });
  }
});

// ------------------- SERVER -------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});