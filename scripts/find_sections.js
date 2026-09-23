const fs = require('fs');

const html = fs.readFileSync('public/index.html', 'utf-8');

// Find headings
const headingRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
let m;
console.log('--- Page Headings ---');
while ((m = headingRegex.exec(html)) !== null) {
  const text = m[1].replace(/<[^>]+>/g, '').trim();
  if (text.length > 3 && text.length < 80) {
    if (text.toLowerCase().includes('chương trình') || text.toLowerCase().includes('nội dung') || text.toLowerCase().includes('phiên') || text.toLowerCase().includes('lịch') || text.toLowerCase().includes('diễn giả')) {
      console.log('Heading:', text, 'at pos:', m.index);
    }
  }
}

// Find elements with id attribute near those terms
const idRegex = /id="([^"]+)"/gi;
const ids = [];
while ((m = idRegex.exec(html)) !== null) {
  ids.push(m[1]);
}
console.log('\n--- All IDs in page ---');
console.log(ids);
