const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src/content/columns');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mdx'));

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to find markdown links [text](url) where url contains spaces
    // This is tricky because url might contain nested parentheses, but for simple ones it works.
    // Let's use a simpler one for common cases.
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    
    let changed = false;
    const newContent = content.replace(linkRegex, (match, text, url) => {
        if (url.includes(' ')) {
            // Encode the URL. encodeURI is safe for base URLs + query params
            const encodedUrl = encodeURI(url);
            console.log(`Fixing link in ${file}: ${url} -> ${encodedUrl}`);
            changed = true;
            return `[${text}](${encodedUrl})`;
        }
        return match;
    });
    
    if (changed) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Updated ${file}`);
    }
});
