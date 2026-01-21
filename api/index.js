// Vercel API route to serve the 90 Day Win Tracker app
export default function handler(req, res) {
  // Read the index.html file and send it as response
  const fs = require('fs');
  const path = require('path');
  
  const indexPath = path.join(process.cwd(), 'index.html');
  
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, 'utf8');
    res.status(200).setHeader('Content-Type', 'text/html').send(html);
  } else {
    res.status(404).send('Page not found');
  }
}