const jwt = require("jsonwebtoken");
const rockwellConfig = require("../config.js");
const db = require("../dbConnectExec.js");

const auth = async (req, res, next) => {
  //   console.log("in the middleware", req.header("Authorization"));
  //   next();

  try {
    //1. decode token

    let myToken = req.header("Authorization").replace("Bearer ", "");
    // console.log(myToken);

    let decoded = jwt.verify(myToken, rockwellConfig.JWT);
    console.log(decoded);

    let contactPK = decoded.pk;

    //2. compare token with database

    let query = `SELECT ContactPK, NameFirst, NameLast, Email
    From Contact
    Where ContactPK = ${contactPK} and Token = '${myToken}'`;

    let returnedUser = await db.executeQuery(query);

    console.log("returned user", returnedUser);

    //3. save user info in request

    if (returnedUser[0]) {
      req.contact = returnedUser[0];
      next();
    } else {
      return res.status(401)("Invalid credentials");
    }
  } catch (err) {
    return res.status(401).send("Invalid Credentials");
  }
};

module.exports = auth;
