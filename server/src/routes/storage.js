const express = require('express');
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const File = require('../models/File');
const BucketFile = require('../models/BucketFile');
const cloudinaryService = require('../services/cloudinaryService');
const router = express.Router();

// GET /api/storage - Get user's storage info and all assets
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    const assets = [];

    // Get all task attachments
    const tasks = await Task.find({ user: user._id, attachment: { $exists: true, $ne: null } });
    tasks.forEach(task => {
      if (task.attachment && task.attachment.url) {
        assets.push({
          id: task.attachment.fileId || task.attachment.url,
          type: 'task',
          url: task.attachment.url,
          name: task.attachment.originalName || 'Task Image',
          size: task.attachment.size || 0,
          taskId: task._id,
          taskTitle: task.title,
          uploadedAt: task.updatedAt
        });
      }
    });

    // Get all file inline images from inlineImages array or parse from markdown
    const files = await File.find({ user: user._id });
    
    for (const file of files) {
      // First, try to use tracked inlineImages array
      if (file.inlineImages && file.inlineImages.length > 0) {
        file.inlineImages.forEach(image => {
          assets.push({
            id: image.fileId,
            type: 'file',
            url: image.url,
            name: image.originalName || 'Inline Image',
            size: image.size || 0,
            fileId: file._id,
            fileTitle: file.title,
            uploadedAt: image.uploadedAt || file.updatedAt
          });
        });
      } 
      // Fallback: parse markdown and get sizes from Cloudinary
      else if (file.content) {
        const imageRegex = /!\[.*?\]\((https?:\/\/res\.cloudinary\.com\/[^)]+daylytics\/files\/inline[^)]+)\)/g;
        const matches = file.content.matchAll(imageRegex);
        
        for (const match of matches) {
          const imageUrl = match[1];
          const urlParts = imageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          
          // Try to get size from Cloudinary
          let imageSize = 0;
          try {
            // Extract public_id: everything after /upload/v{version}/ without extension
            // URL: https://res.cloudinary.com/{cloud}/image/upload/v123/daylytics/files/inline/abc.jpg
            const uploadMatch = imageUrl.match(/\/upload\/v\d+\/(.+)$/);
            if (uploadMatch) {
              const pathWithExt = uploadMatch[1]; // daylytics/files/inline/abc.jpg
              const publicId = pathWithExt.replace(/\.[^/.]+$/, ''); // remove extension
              
              const cloudinary = require('cloudinary').v2;
              const result = await cloudinary.api.resource(publicId, { resource_type: 'image' });
              imageSize = result.bytes || 0;
            }
          } catch (err) {
            console.log('Cloudinary size fetch error:', err.message);
          }
          
          assets.push({
            id: imageUrl,
            type: 'file',
            url: imageUrl,
            name: decodeURIComponent(fileName),
            size: imageSize,
            fileId: file._id,
            fileTitle: file.title,
            uploadedAt: file.updatedAt
          });
        }
      }
    }

    // Get all bucket assets
    const bucketFiles = await BucketFile.find({ uploadedBy: user._id });
    bucketFiles.forEach(bucketFile => {
      assets.push({
        id: bucketFile._id,
        type: 'bucket',
        url: bucketFile.url,
        name: bucketFile.fileName,
        size: bucketFile.fileSize || 0,
        bucketFileId: bucketFile._id,
        uploadedAt: bucketFile.createdAt
      });
    });

    // Calculate actual storage used from assets with size
    let calculatedStorage = 0;
    assets.forEach(asset => {
      if (asset.size && asset.size > 0) {
        calculatedStorage += asset.size;
      }
    });

    // Update user storage if different (sync)
    if (user.storageUsed !== calculatedStorage) {
      user.storageUsed = calculatedStorage;
      await user.save();
    }

    res.json({
      storageUsed: calculatedStorage,
      storageLimit: user.storageLimit || 100 * 1024 * 1024,
      assets: assets.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    });
  } catch (err) {
    console.error('Storage fetch error:', err);
    res.status(500).send('Server error');
  }
});

// DELETE /api/storage/:type/:id - Delete an asset
router.delete('/:type/:id', auth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const user = req.user;

    if (type === 'task') {
      // Delete task attachment
      const task = await Task.findOne({ _id: id, user: user._id });
      if (!task || !task.attachment) {
        return res.status(404).json({ msg: 'Task attachment not found' });
      }

      // Delete from Cloudinary
      try {
        await cloudinaryService.deleteFile(task.attachment.fileId, 'image');
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }

      // Update storage
      if (task.attachment.size) {
        user.storageUsed = Math.max(0, user.storageUsed - task.attachment.size);
        await user.save();
      }

      // Remove attachment from task
      task.attachment = undefined;
      await task.save();

      res.json({ msg: 'Asset deleted', storageUsed: user.storageUsed });
    } else if (type === 'file') {
      // For file inline images, we need the file ID and image URL
      const { fileId, imageUrl } = req.query;
      
      if (!fileId || !imageUrl) {
        return res.status(400).json({ msg: 'File ID and image URL required' });
      }

      const file = await File.findOne({ _id: fileId, user: user._id });
      if (!file) {
        return res.status(404).json({ msg: 'File not found' });
      }

      // Remove image from content
      const imageMarkdown = `![image](${imageUrl})`;
      file.content = file.content.replace(imageMarkdown, '');
      await file.save();

      // Delete from Cloudinary
      try {
        const urlParts = imageUrl.split('/');
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex !== -1) {
          const pathParts = urlParts.slice(uploadIndex + 2);
          const fileName = pathParts[pathParts.length - 1];
          const fileNameWithoutExt = fileName.split('.')[0];
          const folder = pathParts.slice(0, -1).join('/');
          const publicId = folder ? `${folder}/${fileNameWithoutExt}` : fileNameWithoutExt;
          
          await cloudinaryService.deleteFile(publicId, 'image');
        }
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }

      res.json({ msg: 'Asset deleted' });
    } else if (type === 'bucket') {
      // Delete bucket file
      const bucketFile = await BucketFile.findOne({ _id: id, uploadedBy: user._id });
      if (!bucketFile) {
        return res.status(404).json({ msg: 'Bucket file not found' });
      }

      // Delete from Cloudinary
      try {
        await cloudinaryService.deleteFile(bucketFile.fileId, bucketFile.resourceType || 'raw');
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }

      // Update storage
      if (bucketFile.fileSize) {
        user.storageUsed = Math.max(0, user.storageUsed - bucketFile.fileSize);
        await user.save();
      }

      // Delete from database
      await BucketFile.findByIdAndDelete(id);

      res.json({ msg: 'Asset deleted', storageUsed: user.storageUsed });
    } else {
      res.status(400).json({ msg: 'Invalid asset type' });
    }
  } catch (err) {
    console.error('Asset delete error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
