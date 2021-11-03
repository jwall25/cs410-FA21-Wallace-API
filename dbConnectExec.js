const sql = require("mssql");
const rockwellConfig = require("./config.js");

const sqlConfig = {
  user: rockwellConfig.DB.user,
  password: rockwellConfig.DB.password,
  database: rockwellConfig.DB.database,
  server: rockwellConfig.DB.server,
};

async function executeQuery(aQuery) {
  let connection = await sql.connect(sqlConfig);
  let result = await connection.query(aQuery);

  //   console.log(result);

  return result.recordset;
}

// executeQuery(`Select *
// FROM Movie
// Left join Genre
// On genre.GenrePK = Movie.GenreFK`);

module.exports = { executeQuery: executeQuery };
