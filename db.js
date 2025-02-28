const { Client } = require('pg');

//Database config:
const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: '159753',
    database: 'todo_list'
})

//Connection to the database:
client.connect(err => {
    if (err) {
        console.error('connection error', err.stack)
        process.exit(1)
    } else {
        console.log('connected')
    }
})

module.exports = client;