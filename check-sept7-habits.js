require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function checkSept7Habits() {
  console.log('Checking Sept 7 habit data...');
  
  try {
    // Check habit logs for Sept 7, 2025
    const result = await client.execute({
      sql: 'SELECT * FROM HabitLog WHERE date = ?',
      args: ['2025-09-07']
    });
    
    console.log(`Found ${result.rows.length} habit logs for Sept 7, 2025:`);
    
    for (const row of result.rows) {
      console.log(`- Habit ${row.habitId}: completed=${row.completed}`);
    }
    
    // Also check if we have any habits for kettlebell swings specifically
    const habitResult = await client.execute(
      "SELECT *, isActive FROM Habit WHERE name LIKE '%ettlebell%' OR name LIKE '%swing%'"
    );
    
    console.log(`\nFound ${habitResult.rows.length} kettlebell-related habits:`);
    for (const row of habitResult.rows) {
      console.log(`- ${row.name} (ID: ${row.id}, isActive: ${row.isActive})`);
      
      // Check logs for this specific habit on Sept 7
      const logResult = await client.execute({
        sql: 'SELECT * FROM HabitLog WHERE habitId = ? AND date = ?',
        args: [row.id, '2025-09-07']
      });
      
      if (logResult.rows.length > 0) {
        console.log(`  Sept 7 status: completed=${logResult.rows[0].completed}`);
      } else {
        console.log(`  No Sept 7 log found for this habit`);
      }
    }
    
  } catch (error) {
    console.error('Error checking Sept 7 habits:', error);
  }
}

checkSept7Habits().then(() => process.exit(0));
