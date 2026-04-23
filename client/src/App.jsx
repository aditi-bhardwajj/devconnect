import { useState, useEffect } from "react";

function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    content: ""
  });

  const [posts, setPosts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    setIsLoggedIn(true);

    setTimeout(() => {
      getPosts();
    }, 0);
  }
}, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json();
      showMessage(data.message);
    } catch {
      showMessage("Something went wrong");
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setIsLoggedIn(true);
        showMessage("Login successful");
        getPosts();
      } else {
        showMessage(data.message);
      }
    } catch {
      showMessage("Server error");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setPosts([]);
    showMessage("Logged out");
  };

  const handleCreatePost = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: form.content
        })
      });

      const data = await res.json();
      showMessage(data.message);
      setForm({ ...form, content: "" });
      getPosts();
    } catch {
      showMessage("Error creating post");
    }
    setLoading(false);
  };

  const getPosts = async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/posts", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      setPosts(data);
    } catch {
      showMessage("Error loading posts");
    }

    setLoading(false);
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("token");

    await fetch(`http://localhost:5000/posts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    getPosts();
  };

  return (
    <div style={styles.container}>
      <div style={styles.navbar}>
        <h2>DevConnect</h2>
        {isLoggedIn && (
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        )}
      </div>

      {message && <div style={styles.message}>{message}</div>}

      {!isLoggedIn && (
        <div style={styles.card}>
          <h3>Login / Signup</h3>

          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} style={styles.input} />
          <input name="email" placeholder="Email" value={form.email} onChange={handleChange} style={styles.input} />
          <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} style={styles.input} />

          <div style={styles.buttonGroup}>
            <button onClick={handleLogin} style={styles.button} disabled={loading}>
              {loading ? "Please wait..." : "Login"}
            </button>
            <button onClick={handleSignup} style={styles.buttonSecondary} disabled={loading}>
              Signup
            </button>
          </div>
        </div>
      )}

      {isLoggedIn && (
        <>
          <div style={styles.card}>
            <h3>Create Post</h3>
            <input name="content" placeholder="Write something..." value={form.content} onChange={handleChange} style={styles.input} />
            <button onClick={handleCreatePost} style={styles.button} disabled={loading}>
              {loading ? "Posting..." : "Post"}
            </button>
          </div>

          {loading && <p>Loading...</p>}

          <div style={styles.posts}>
            {posts.map((post) => (
              <div key={post._id} style={styles.postCard}>
                <p>{post.content}</p>
                <small>By {post.user?.name}</small>
                <button onClick={() => handleDelete(post._id)} style={styles.deleteBtn}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "600px",
    margin: "40px auto",
    fontFamily: "Arial"
  },
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px"
  },
  message: {
    background: "#e8f5e9",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "10px"
  },
  logoutBtn: {
    background: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px",
    borderRadius: "5px",
    cursor: "pointer"
  },
  card: {
    background: "#f9f9f9",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px"
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "8px 0",
    borderRadius: "6px",
    border: "1px solid #ccc"
  },
  buttonGroup: {
    display: "flex",
    gap: "10px"
  },
  button: {
    padding: "10px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  buttonSecondary: {
    padding: "10px",
    background: "#555",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  posts: {
    marginTop: "20px"
  },
  postCard: {
    background: "#fff",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
    boxShadow: "0 1px 5px rgba(0,0,0,0.1)"
  },
  deleteBtn: {
    marginTop: "10px",
    background: "red",
    color: "white",
    border: "none",
    padding: "6px",
    borderRadius: "5px",
    cursor: "pointer"
  }
};

export default App;