const mysql = require('mysql2');
require('dotenv').config();

console.log('\n🔍 Testing Database Connection');
console.log('================================');

const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'exam_system'
};

console.log('Configuration:');
console.log(`Host: ${config.host}`);
console.log(`User: ${config.user}`);
console.log(`Password: ${config.password ? '******' : '(empty)'}`);
console.log(`Database: ${config.database}`);
console.log('================================');

const connection = mysql.createConnection(config);

connection.connect((err) => {
    if (err) {
        console.error('❌ Connection failed!');
        console.error('Error:', err.message);
        console.log('\nTroubleshooting:');
        console.log('1. Make sure MySQL is running in XAMPP');
        console.log('2. Open XAMPP Control Panel and start MySQL');
        console.log('3. Check if password is correct (XAMPP default is empty)');
        console.log('4. Try: mysql -u root -p');
        console.log('5. Create database: CREATE DATABASE exam_system;');
        process.exit(1);
    }
    
    console.log('✅ Connected successfully!');
    
    // Test query
    connection.query('SELECT 1 + 1 AS solution', (err, results) => {
        if (err) {
            console.error('❌ Query failed:', err.message);
        } else {
            console.log('✅ Query test passed:', results[0].solution);
        }
        
        // Check if database exists
        connection.query('SHOW TABLES', (err, tables) => {
            if (err) {
                console.error('❌ Failed to list tables:', err.message);
            } else {
                console.log(`\nTables in database (${tables.length}):`);
                if (tables.length === 0) {
                    console.log('  No tables found. Run setup-db.sql');
                } else {
                    tables.forEach(table => {
                        console.log(`  - ${table.Tables_in_exam_system || Object.values(table)[0]}`);
                    });
                }
            }
            
            connection.end();
            console.log('\n✅ Test complete');
        });
    });
});