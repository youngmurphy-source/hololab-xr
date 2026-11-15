const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const distDir = path.join(root, 'dist');
const project12Dir = path.join(root, 'project12');
const downloadsProject12 = 'C:\\Users\\HomePC\\Downloads\\project12';

// 1. Copy schools.html and src/schools.ts into project12
fs.copyFileSync(path.join(root, 'schools.html'), path.join(project12Dir, 'schools.html'));
fs.copyFileSync(path.join(root, 'src', 'schools.ts'), path.join(project12Dir, 'schools.ts'));

// Also copy dist/schools.html as index.html into project12 with the bundled js
if (fs.existsSync(distDir)) {
  const distSchools = fs.readFileSync(path.join(distDir, 'schools.html'), 'utf8');
  fs.writeFileSync(path.join(project12Dir, 'index.html'), distSchools);

  // Copy dist/assets into project12/assets using cpSync
  const distAssets = path.join(distDir, 'assets');
  const targetAssets = path.join(project12Dir, 'assets');
  if (fs.existsSync(distAssets)) {
    fs.cpSync(distAssets, targetAssets, { recursive: true, force: true });
  }
}

// 2. Also sync to C:\Users\HomePC\Downloads\project12 if it exists
if (fs.existsSync(downloadsProject12)) {
  fs.cpSync(project12Dir, downloadsProject12, { recursive: true, force: true });
  console.log('Successfully synced to ' + downloadsProject12);
}

console.log('Project12 successfully updated with Neu-Glassmorphism design!');
