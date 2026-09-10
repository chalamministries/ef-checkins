const fs = require('fs');
const { createCanvas } = require('canvas');

// Create 256x256 solid blue icon (placeholder)
const canvas = createCanvas(256, 256);
const ctx = canvas.getContext('2d');
ctx.fillStyle = '#2c3e50';
ctx.fillRect(0, 0, 256, 256);

// Add white 'EF' text
ctx.font = 'bold 96px sans-serif';
ctx.fillStyle = 'white';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('EF', 128, 128);

// Write to file
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('assets/icons/256x256.png', buffer);
console.log('✅ Generated assets/icons/256x256.png');
