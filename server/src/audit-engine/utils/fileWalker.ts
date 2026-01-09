import fs from 'fs';
import path from 'path';

export const walkFiles = (dir: string, fileList: string[] = [], ignore: string[] = ['node_modules', 'dist', '.git']): string[] => {
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (ignore.includes(file)) return;

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkFiles(filePath, fileList, ignore);
    } else {
      if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
};
