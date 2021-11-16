//@login 1 @11:45

const express = require("express");

const bcrypt = require("bcryptjs");

const db = require("./dbConnectExec.js");

const app = express();

app.use(express.json());

app.listen(5000, () => {
  console.log("App is running on Port 5000");
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

const auth = async (req, res, next) => {
  console.log("in the middleware", req);
};

app.post("/reviews", auth, async (req, res) => {
  try {
    let movieFK = req.body.movieFK;
    let summary = req.body.summary;
    let rating = req.body.rating;

    if (!movieFK || !summary || !Number.isInteger(rating)) {
      return res.status(400).send("bad request");
    }

    summary = summary.replace("'", "''");
    console.log("summary", summary);
  } catch (err) {
    console.log("error in POST /reviews", err);
    res.status(500).send();
  }
});

app.post("/contacts/login", async (req, res) => {
  // console.log("/contacts/login called", req.body);
  // 1. data validation

  let email = req.body.email;
  let password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("bad Request");
  }

  // 2. check user exists

  let query = `SELECT *
  From Contact
  Where Email = '${email}'`;

  let result = await db.executeQuery(query);

  console.log(result);

  // 3. check user password
  // 4. if good, generate token
  // 5. save token in database and send response back
});

app.post("/contacts", async (req, res) => {
  // res.send("/contacts called");

  // console.log("request body", req.body);

  let nameFirst = req.body.nameFirst;
  let nameLast = req.body.nameLast;
  let email = req.body.email;
  let password = req.body.password;

  if (!nameFirst || !nameLast || !email || !password) {
    return res.status(400).send("Bad Request");
  }

  nameFirst = nameFirst.replace("'", "''");
  nameLast = nameLast.replace("'", "''");

  let emailCheckQuery = `SELECT Email
  FROM Contact
  WHERE Email = '${email}'`;

  let existingUser = await db.executeQuery(emailCheckQuery);

  // console.log("existing user", existingUser);

  if (existingUser[0]) {
    return res.status(409).send("duplicate email");
  }

  let hashedPW = bcrypt.hashSync(password);

  let insertQuery = `insert into Contact(NameFirst,NameLast,Email,Password)
  VALUES('${nameFirst}','${nameLast}','${email}', '${hashedPW}')`;

  db.executeQuery(insertQuery)
    .then(() => {
      res.status(201).send();
    })
    .catch((err) => {
      console.log("error in POST /contact", err);
      res.status(500).send();
    });
});

app.get("/movies", (req, res) => {
  //get data from database
  db.executeQuery(
    `Select *
  FROM Movie
  Left join Genre
  On genre.GenrePK = Movie.GenreFK`
  )
    .then((theResults) => {
      res.status(200).send(theResults);
    })
    .catch((myError) => {
      console.log(myError);
      res.status(500).send();
    });
});

app.get("/movies/:pk", (req, res) => {
  let pk = req.params.pk;
  // console.log(pk);

  let myQuery = `Select *
  FROM Movie
  Left join Genre
  On genre.GenrePK = Movie.GenreFK
  WHERE MoviePK = ${pk}`;

  db.executeQuery(myQuery)
    .then((result) => {
      // console.log(result);
      if (result[0]) {
        res.send(result[0]);
      } else {
        res.status(404).send(`Bad request`);
      }
    })
    .catch((err) => {
      console.log("Error in /movie/:pk", err);
      res.status(500).send();
    });
});
