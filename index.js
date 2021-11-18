//@logout @(18:29-4:10)

const express = require("express");
const cors = require("cors");

const bcrypt = require("bcryptjs");

const db = require("./dbConnectExec.js");
const rockwellConfig = require("./config.js");

const auth = require("./middleware/authenticate");

const app = express();

const jwt = require("jsonwebtoken");

app.use(express.json());
//azurwebsites.net, colostate.edu
app.use(cors());

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`App is running on Port ${PORT}`);
});

app.get("/hi", (req, res) => {
  res.send("hello world");
});

app.get("/", (req, res) => {
  res.send("API is running");
});

// app.post();
// app.put();

// app.get("/reviews/me", auth, async (req, res) => {
//   //get contactpk
//   //query database for users records
//   //send users reviews back to them
// });

// app.patch("/reviews/:pk", auth, async (req, res) => {});

// app.delete("/reveiws/:pk");

app.post("/contacts/logout", auth, (req, res) => {
  let query = `UPDATE Contact
  Set Token = NULL
  Where ContactPK = ${req.contact.ContactPK}`;

  db.executeQuery(query)
    .then(() => {
      res.status(200).send();
    })
    .catch((err) => {
      console.log("error in POST /contacts/logout", err);
      res.status(500).send();
    });
});

app.post("/reviews", auth, async (req, res) => {
  try {
    let movieFK = req.body.movieFK;
    let summary = req.body.summary;
    let rating = req.body.rating;

    if (!movieFK || !summary || !Number.isInteger(rating)) {
      return res.status(400).send("bad request");
    }

    summary = summary.replace("'", "''");
    // console.log("summary", summary);

    // console.log("here is the contact", req.contact);

    let insertQuery = `INSERT INTO Review(Summary,Rating,MovieFK,ContactFK)
    OUTPUT inserted.ReviewPK, inserted.Summary, inserted.Rating, inserted.MovieFK
    VALUES('${summary}', '${rating}', '${movieFK}', ${req.contact.ContactPK})`;

    let insertedReview = await db.executeQuery(insertQuery);

    console.log("inserted review", insertedReview);

    res.status(201).send(insertedReview[0]);
  } catch (err) {
    console.log("error in POST /reviews", err);
    res.status(500).send();
  }
});

app.get("/contacts/me", auth, (req, res) => {
  res.send(req.contact);
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

  let result;

  try {
    result = await db.executeQuery(query);
  } catch (myError) {
    console.log("error in /contacts/login", myError);
    return res.status(500).send();
  }

  console.log(result);

  if (!result[0]) {
    return res.status(401).send("Invalid User Credentials.");
  }
  // 3. check user password

  let user = result[0];

  if (!bcrypt.compareSync(password, user.Password)) {
    console.log("Invalid Password");
    return res.status(401).send("Invalid User Credentials");
  }

  // 4. if good, generate token

  let token = jwt.sign({ pk: user.ContactPK }, rockwellConfig.JWT, {
    expiresIn: "60 minutes",
  });

  // console.log("token", token);

  // 5. save token in database and send response back

  let setTokenQuery = `UPDATE Contact
  SET Token = '${token}'
  WHERE ContactPK = ${user.ContactPK}`;

  try {
    await db.executeQuery(setTokenQuery);
    res.status(200).send({
      token: token,
      user: {
        NameFirst: user.NameFirst,
        NameLast: user.NameLast,
        Email: user.Email,
        ContactPK: user.ContactPK,
      },
    });
  } catch (myError) {
    console.log("error in setting user token", myError);
    res.status(500).send();
  }
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
