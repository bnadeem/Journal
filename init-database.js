require('dotenv').config();
const { createClient } = require('@libsql/client');

// Initialize database client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function initializeDatabase() {
  console.log('Initializing database schema...');
  
  try {
    // Create JournalEntry table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS JournalEntry (
        id TEXT PRIMARY KEY,
        year INTEGER NOT NULL,
        month TEXT NOT NULL,
        day INTEGER NOT NULL,
        content TEXT NOT NULL,
        frontmatter TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        UNIQUE(year, month, day)
      )
    `);
    
    console.log('✓ Created JournalEntry table');
    
    // Create an index for faster queries
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_journal_date 
      ON JournalEntry (year, month, day)
    `);
    
    console.log('✓ Created date index');
    
    // Check if we have any existing entries
    const result = await client.execute('SELECT COUNT(*) as count FROM JournalEntry');
    const count = result.rows[0]?.count || 0;
    
    console.log(`✓ Database initialized successfully. Current entries: ${count}`);
    
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  initializeDatabase().then(() => {
    console.log('Database initialization completed!');
    process.exit(0);
  }).catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
}

module.exports = { initializeDatabase };