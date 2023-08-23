const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/my-blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

// Serve the client-side build
app.use(express.static(path.join(__dirname, 'client', 'build')));

// Handle all other requests and serve the 'index.html' file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});