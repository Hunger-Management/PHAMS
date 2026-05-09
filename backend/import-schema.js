const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const config = {
  host: 'turntable.proxy.rlwy.net',
  port: 33181,
  user: 'root',
  password: 'sjjILqEuXMcslnvQsuEbrLqJdpzngMZA',
  database: 'zero_hunger',
  multipleStatements: true
};

const connection = mysql.createConnection(config);

connection.connect((err) => {
  if (err) {
    console.error('Connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');
  
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  connection.query(schema, (err, results) => {
    if (err) {
      console.error('Import error:', err.message);
      process.exit(1);
    }
    console.log('✓ Schema imported successfully!');
    console.log(`Executed ${results.length} statements`);
    connection.end();
  });
});
