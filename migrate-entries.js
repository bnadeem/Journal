require('dotenv').config();
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { createClient } = require('@libsql/client');

// Initialize database client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

async function migrateEntries() {
  console.log('Starting migration of journal entries...');
  
  try {
    // Get all year directories
    const yearDirs = fs.readdirSync('.').filter(item => {
      return fs.statSync(item).isDirectory() && /^\d{4}$/.test(item);
    });
    
    console.log(`Found years: ${yearDirs.join(', ')}`);
    
    let totalEntries = 0;
    let migratedEntries = 0;
    let skippedEntries = 0;
    let errors = 0;
    
    for (const year of yearDirs) {
      console.log(`\nProcessing year: ${year}`);
      
      const yearPath = path.join('.', year);
      const monthDirs = fs.readdirSync(yearPath).filter(item => {
        const fullPath = path.join(yearPath, item);
        return fs.statSync(fullPath).isDirectory() && MONTH_NAMES.includes(item);
      });
      
      console.log(`  Found months: ${monthDirs.join(', ')}`);
      
      for (const month of monthDirs) {
        console.log(`  Processing ${month} ${year}...`);
        
        const monthPath = path.join(yearPath, month);
        const files = fs.readdirSync(monthPath).filter(file => {
          return file.endsWith('.md') && file !== 'summary.md' && !file.includes('-habits');
        });
        
        console.log(`    Found ${files.length} entry files`);
        
        for (const file of files) {
          totalEntries++;
          const day = file.replace('.md', '');
          const filePath = path.join(monthPath, file);
          
          try {
            // Check if entry already exists in database
            const existingResult = await client.execute({
              sql: 'SELECT id FROM JournalEntry WHERE year = ? AND month = ? AND day = ?',
              args: [parseInt(year), month, parseInt(day)]
            });
            
            if (existingResult.rows.length > 0) {
              console.log(`    Skipping ${month} ${day}, ${year} - already exists`);
              skippedEntries++;
              continue;
            }
            
            // Read and parse the file
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const { data: frontmatter, content } = matter(fileContent);
            
            // Prepare database entry
            const now = new Date().toISOString();
            const frontmatterStr = frontmatter && Object.keys(frontmatter).length > 0 
              ? JSON.stringify(frontmatter) 
              : null;
            
            // Insert into database
            await client.execute({
              sql: 'INSERT INTO JournalEntry (id, year, month, day, content, frontmatter, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              args: [
                crypto.randomUUID(), 
                parseInt(year), 
                month, 
                parseInt(day), 
                content.trim(), 
                frontmatterStr, 
                now, 
                now
              ]
            });
            
            migratedEntries++;
            console.log(`    ✓ Migrated ${month} ${day}, ${year}`);
            
          } catch (error) {
            errors++;
            console.error(`    ✗ Error migrating ${month} ${day}, ${year}:`, error.message);
          }
        }
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total entries found: ${totalEntries}`);
    console.log(`Successfully migrated: ${migratedEntries}`);
    console.log(`Skipped (already exist): ${skippedEntries}`);
    console.log(`Errors: ${errors}`);
    console.log('Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  migrateEntries().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateEntries };