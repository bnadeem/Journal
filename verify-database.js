require('dotenv').config();
const { createClient } = require('@libsql/client');

// Initialize database client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function verifyDatabase() {
  console.log('Verifying database entries...');
  
  try {
    // Get all entries
    const result = await client.execute(
      'SELECT year, month, day, LENGTH(content) as content_length FROM JournalEntry ORDER BY year, month, day'
    );
    
    console.log(`\nFound ${result.rows.length} total entries in database:`);
    console.log('=========================================');
    
    for (const row of result.rows) {
      const contentLength = row.content_length || 0;
      console.log(`${row.month} ${row.day}, ${row.year} - ${contentLength} characters`);
    }
    
    console.log('=========================================');
    
    // Get a sample entry to verify content
    const sampleResult = await client.execute(
      'SELECT year, month, day, content FROM JournalEntry LIMIT 1'
    );
    
    if (sampleResult.rows.length > 0) {
      const sample = sampleResult.rows[0];
      console.log(`\nSample entry (${sample.month} ${sample.day}, ${sample.year}):`);
      console.log('-------------------------------------------');
      console.log(sample.content?.substring(0, 200) + (sample.content?.length > 200 ? '...' : ''));
      console.log('-------------------------------------------');
    }
    
    // Check for 2025 entries specifically
    const year2025Result = await client.execute(
      'SELECT COUNT(*) as count FROM JournalEntry WHERE year = 2025'
    );
    
    const count2025 = year2025Result.rows[0]?.count || 0;
    console.log(`\n✓ Found ${count2025} entries for year 2025`);
    
    console.log('\nDatabase verification completed successfully!');
    
  } catch (error) {
    console.error('Failed to verify database:', error);
    process.exit(1);
  }
}

// Check if we're running this script directly
if (require.main === module) {
  verifyDatabase().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Database verification failed:', error);
    process.exit(1);
  });
}

module.exports = { verifyDatabase };