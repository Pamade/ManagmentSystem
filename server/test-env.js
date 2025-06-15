require('dotenv')

console.log('DB_USER:', process.env.DB_USER ? 'Set' : 'Not set');
console.log('DB_PASS:', process.env.DB_PASS ? 'Set' : 'Not set');
console.log('PORT:', process.env.PORT ? 'Set' : 'Not set'); 