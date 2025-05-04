const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all component files
const findComponentFiles = () => {
  try {
    const output = execSync('find app/components -type f -name "*.tsx"').toString();
    return output.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error finding component files:', error);
    return [];
  }
};

// Fix imports in a file
const fixImportsInFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all lucide-react imports
    const importRegex = /import\s+\{\s*([\w\s,]+)\s*\}\s+from\s+["']lucide-react(?:\/dist\/esm\/index)?["'];?/;
    const match = content.match(importRegex);
    
    if (match) {
      const icons = match[1].split(',').map(icon => icon.trim());
      
      // Create individual imports
      const newImports = icons.map(icon => 
        `import ${icon} from "lucide-react/dist/esm/icons/${icon.toLowerCase().replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}";`
      ).join('\n');
      
      // Replace the import statement
      const newContent = content.replace(importRegex, newImports);
      
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed imports in ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing imports in ${filePath}:`, error);
    return false;
  }
};

// Main function
const main = () => {
  const files = findComponentFiles();
  let fixedCount = 0;
  
  files.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`✅ Fixed ${fixedCount} files with Lucide React imports`);
};

main();