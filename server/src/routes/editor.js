const express = require('express');
const router = express.Router();
const EditorFile = require('../models/EditorFile');
const auth = require('../middleware/auth');

// Get all editor files for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const files = await EditorFile.find({ user: req.user.id }).sort({ view: 1, order: 1 });
    
    // If no files exist, create default files
    if (files.length === 0) {
      const defaultFiles = [
        {
          user: req.user.id,
          view: 'window',
          name: 'index.html',
          language: 'html',
          content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Project</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <button onclick="greet()">Click Me</button>\n    <script src="script.js"></script>\n</body>\n</html>',
          order: 1
        },
        {
          user: req.user.id,
          view: 'window',
          name: 'style.css',
          language: 'css',
          content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}\n\nbutton {\n    padding: 10px 20px;\n    font-size: 16px;\n    cursor: pointer;\n}',
          order: 2
        },
        {
          user: req.user.id,
          view: 'window',
          name: 'script.js',
          language: 'javascript',
          content: 'function greet() {\n    console.log("Hello from JavaScript!");\n    alert("Button clicked!");\n}\n\nconsole.log("Page loaded!");',
          order: 3
        },
        {
          user: req.user.id,
          view: 'console',
          name: 'script.js',
          language: 'javascript',
          content: '// JavaScript Console\nconsole.log("Hello from Console!");\nconsole.log("You can write JavaScript code here");\n\n// Try some code:\nconst x = 10;\nconst y = 20;\nconsole.log("Sum:", x + y);',
          order: 1
        }
      ];
      
      const createdFiles = await EditorFile.insertMany(defaultFiles);
      return res.json(createdFiles);
    }
    
    res.json(files);
  } catch (error) {
    console.error('Error fetching editor files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a specific editor file
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const file = await EditorFile.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    file.content = content;
    await file.save();
    
    res.json(file);
  } catch (error) {
    console.error('Error updating editor file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset editor files to default
router.post('/reset', auth, async (req, res) => {
  try {
    // Delete all existing files
    await EditorFile.deleteMany({ user: req.user.id });
    
    // Create default files
    const defaultFiles = [
      {
        user: req.user.id,
        view: 'window',
        name: 'index.html',
        language: 'html',
        content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Project</title>\n    <link rel="stylesheet" href="style.css">\n</head>\n<body>\n    <h1>Hello World!</h1>\n    <button onclick="greet()">Click Me</button>\n    <script src="script.js"></script>\n</body>\n</html>',
        order: 1
      },
      {
        user: req.user.id,
        view: 'window',
        name: 'style.css',
        language: 'css',
        content: 'body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n}\n\nh1 {\n    color: #333;\n}\n\nbutton {\n    padding: 10px 20px;\n    font-size: 16px;\n    cursor: pointer;\n}',
        order: 2
      },
      {
        user: req.user.id,
        view: 'window',
        name: 'script.js',
        language: 'javascript',
        content: 'function greet() {\n    console.log("Hello from JavaScript!");\n    alert("Button clicked!");\n}\n\nconsole.log("Page loaded!");',
        order: 3
      },
      {
        user: req.user.id,
        view: 'console',
        name: 'script.js',
        language: 'javascript',
        content: '// JavaScript Console\nconsole.log("Hello from Console!");\nconsole.log("You can write JavaScript code here");\n\n// Try some code:\nconst x = 10;\nconst y = 20;\nconsole.log("Sum:", x + y);',
        order: 1
      }
    ];
    
    const createdFiles = await EditorFile.insertMany(defaultFiles);
    res.json(createdFiles);
  } catch (error) {
    console.error('Error resetting editor files:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
