import * as pg from 'pg';

export function dbConfig() {
    return {
        user: process.env.POSTGRES_USER, //env var: PGUSER
        database: process.env.POSTGRES_DB, //env var: PGDATABASE
        password: process.env.POSTGRES_PASSWORD, //env var: PGPASSWORD
        host: 'localhost', // Server hosting the postgres database
        port: 5432, //env var: PGPORT
        max: 10, // max number of clients in the pool
        idleTimeoutMillis: 2000
    }
}

//this initializes a connection pool
//it will keep idle connections open for 30 seconds
//and set a limit of maximum 10 idle clients
const pool = new pg.Pool(dbConfig());

pool.on('error', function (err, client) {
  // if an error is encountered by a client while it sits idle in the pool
  // the pool itself will emit an error event with both the error and
  // the client which emitted the original error
  // this is a rare occurrence but can happen if there is a network partition
  // between your application and the database, the database restarts, etc.
  // and so you might want to handle it and at least log it out
  console.error('idle client error', err.message, err.stack)
});

//export the query method for passing queries to the pool
export function query(text, values, callback) {
  console.log('query:', text, values);
  return pool.query(text, values, callback);
};

// the pool also supports checking out a client for
// multiple operations, such as a transaction
export function connect(callback: (err: Error, client: pg.Client, done: () => void) => void) {
  return pool.connect(callback);
};
