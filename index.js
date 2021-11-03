const express = require("express");

const app = express();

app.listen(5000, () => {
  console.log("App is running on Port 5000");
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

//@ GIT 0
