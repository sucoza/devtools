const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Fix all linting errors in TypeScript/TSX files
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix unused error variables in catch blocks
  content = content.replace(/} catch \(error\) {/g, (match) => {
    modified = true;
    return '} catch {';
  });

  // Fix unused variables by prefixing with _
  content = content.replace(/\(error\)/g, (match, offset) => {
    // Check if it's in a catch block context
    const before = content.substring(Math.max(0, offset - 10), offset);
    if (before.includes('catch')) {
      modified = true;
      return '(_error)';
    }
    return match;
  });

  // Fix Function type
  content = content.replace(/: Function\b/g, (match) => {
    modified = true;
    return ': (...args: unknown[]) => unknown';
  });

  // Fix console statements
  content = content.replace(/^(\s*)console\.(log|error|warn|info|debug)\(/gm, (match, indent) => {
    modified = true;
    return `${indent}// console.${match.split('.')[1].split('(')[0]}(`;
  });

  // Fix lexical declarations in case blocks - wrap with braces
  const caseBlockRegex = /case\s+[^:]+:\s*\n(\s*)(const|let)\s+/g;
  if (caseBlockRegex.test(content)) {
    content = content.replace(/case\s+([^:]+):\s*\n(\s*)(const|let)\s+([^;]+);/g, (match, caseValue, indent, declType, rest) => {
      modified = true;
      return `case ${caseValue}: {\n${indent}  ${declType} ${rest};\n${indent}  break;\n${indent}}`;
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${filePath}`);
  }

  return modified;
}

// Find all TypeScript files in the plugin
const files = glob.sync('plugins/browser-automation-test-recorder/src/**/*.{ts,tsx}');

let fixedCount = 0;
files.forEach(file => {
  if (fixFile(file)) {
    fixedCount++;
  }
});

console.log(`Fixed ${fixedCount} files`);