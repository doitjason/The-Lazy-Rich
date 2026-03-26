import fs from 'fs';
import path from 'path';

const CONTENT_PATH = path.join(process.cwd(), 'src/content/columns');

export async function getColumnContent(id: string) {
    const fullPath = path.join(CONTENT_PATH, `${id}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const source = fs.readFileSync(fullPath, 'utf8');
    
    return {
        source
    };
}
