const connection = require("../db-config");
const Joi = require("joi");

const db = connection.promise();

const validate = (data, forCreation = true) => {
  const presence = forCreation ? "required" : "optional";
  return Joi.object({
    title: Joi.string().max(255).presence(presence),
    director: Joi.string().max(255).presence(presence),
    year: Joi.number().integer().min(1888).presence(presence),
    color: Joi.boolean().presence(presence),
    duration: Joi.number().integer().min(1).presence(presence),
  }).validate(data, { abortEarly: false }).error;
};

const findAll = ({ filters: { color, max_duration } }) => {
  let sql = "SELECT * FROM movies";
  const sqlValues = [];
  if (color) {
    sql += " WHERE color = ?";
    sqlValues.push(color);
  }
  if (max_duration) {
    if (color) sql += " AND duration <= ? ;";
    else sql += " WHERE duration <= ?";
    sqlValues.push(max_duration);
  }
  return db.query(sql, sqlValues).then(([results]) => results);
};

const findOne = async (id) => {
  const result = await db.query("SELECT * FROM movies WHERE id = ?", id);
  return result[0];
};

const create = async ({ title, director, year, color, duration }) => {
  const result = await db.query(
    "INSERT INTO movies (title, director, year, color, duration) VALUES (?, ?, ?, ?, ?)",
    [title, director, year, color, duration]
  );
  return findOne(result[0].insertId);
};

const update = (id, newAttributes) => {
  return db.query("UPDATE movies SET ? WHERE id = ?", [newAttributes, id]);
};

const deleteOne = async (id) => {
  return db
    .query("DELETE FROM movies WHERE id = ?", [id])
    .then(([result]) => result.affectedRows !== 0);
};

module.exports = {
  validate,
  findAll,
  findOne,
  create,
  update,
  deleteOne,
};
