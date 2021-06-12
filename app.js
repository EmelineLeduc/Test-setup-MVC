const connection = require("./db-config");
const { setupRoutes } = require("./routes");
const express = require("express");
const app = express();
const Joi = require("joi");

const port = process.env.PORT || 3000;

connection.connect((err) => {
  if (err) {
    console.error("error connecting: " + err.stack);
  } else {
    console.log("connected as id " + connection.threadId);
  }
});

app.use(express.json());

setupRoutes(app);

// TODO break the following routes handlers into model and controller

app.put("/api/users/:id", (req, res) => {
  const userId = req.params.id;
  const db = connection.promise();
  let existingUser = null;
  let validationErrors = null;
  Promise.all([
    db.query("SELECT * FROM users WHERE id = ?", [userId]),
    db.query("SELECT * FROM users WHERE email = ? AND id <> ?", [
      req.body.email,
      userId,
    ]),
  ])
    .then(([[[existingUser]], [[otherUserWithEmail]]]) => {
      if (!existingUser) return Promise.reject("RECORD_NOT_FOUND");
      if (otherUserWithEmail) return Promise.reject("DUPLICATE_EMAIL");
      validationErrors = Joi.object({
        email: Joi.string().email().max(255),
        firstname: Joi.string().min(1).max(255),
        lastname: Joi.string().min(1).max(255),
        city: Joi.string().allow(null, "").max(255),
        language: Joi.string().allow(null, "").max(255),
      }).validate(req.body, { abortEarly: false }).error;
      if (validationErrors) return Promise.reject("INVALID_DATA");
      return db.query("UPDATE users SET ? WHERE id = ?", [req.body, userId]);
    })
    .then(() => {
      res.status(200).json({ ...existingUser, ...req.body });
    })
    .catch((err) => {
      console.error(err);
      if (err === "RECORD_NOT_FOUND")
        res.status(404).send(`User with id ${userId} not found.`);
      if (err === "DUPLICATE_EMAIL")
        res.status(409).json({ message: "This email is already used" });
      else if (err === "INVALID_DATA")
        res.status(422).json({ validationErrors });
      else res.status(500).send("Error updating a user");
    });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
