// Test script for image upload functionality
import { uploadToImgur } from './src/utils/imgur.js';

// Create a test image file
const createTestImage = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#007bff';
  ctx.fillRect(0, 0, 100, 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Arial';
  ctx.fillText('TEST', 30, 55);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob], 'test.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.8);
  });
};

// Test the upload
const testUpload = async () => {
  try {
    console.log('Creating test image...');
    const testFile = await createTestImage();
    console.log('Test image created:', testFile);
    
    console.log('Starting upload...');
    const result = await uploadToImgur(testFile, (progress) => {
      console.log('Progress:', progress);
    });
    
    console.log('Upload successful:', result);
    console.log('Image URL:', result.url);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};

console.log('Image upload test ready. Run testUpload() in browser console.');