require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkHabitTables() {
  console.log('Checking habit tables...');
  
  try {
    // Check if Habit table exists
    const habitTableResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%abit%'"
    );
    
    console.log('Habit-related tables found:', habitTableResult.rows.map(row => row.name));
    
    // Check existing habits
    try {
      const habitsResult = await client.execute('SELECT COUNT(*) as count FROM Habit');
      console.log(`Total habits in database: ${habitsResult.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('Habit table does not exist');
    }
    
    // Check existing habit logs
    try {
      const logsResult = await client.execute('SELECT COUNT(*) as count FROM HabitLog');
      console.log(`Total habit logs in database: ${logsResult.rows[0]?.count || 0}`);
    } catch (e) {
      console.log('HabitLog table does not exist');
    }
    
  } catch (error) {
    console.error('Error checking habit tables:', error);
  }
}

checkHabitTables().then(() => process.exit(0));