const bcrypt = require("bcryptjs");

let hashedpw = bcrypt.hashSync("csu123");

console.log(hashedpw);

let hashtest = bcrypt.compareSync("csu123", hashedpw);

console.log(hashtest);
