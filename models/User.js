const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // email must be unique
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["Learner", "Admin"], // Enum to restrict the value to 'user' or 'admin'
    default: "Learner", // Default role assigned if none is specified
  },
  avatar: { type: String, default: "mehari.jpg" }, // Add this line
});

//static signup method
userSchema.statics.signup = async function (
  firstName,
  lastName,
  email,
  password,
  role = "Learner"
) {
  // validation
  if (!firstName || !lastName || !email || !password) {
    throw Error("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }
  if (!validator.isStrongPassword(password)) {
    throw Error("Password is not strong enough");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("Email already in use");
  }
  // use bcrypt to hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Ensure the role is either 'user' or 'admin'
  if (!["Learner", "Admin"].includes(role)) {
    throw Error("Role is not valid");
  }

  const user = await this.create({
    firstName,
    lastName,
    email,
    password: hash,
    role,
  });

  return user;
};

userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(this.password, salt);

  // Override the plaintext password with the hashed one
  this.password = hash;
  next();
});

// static login method
userSchema.statics.login = async function (email, password) {
  // validation
  if (!email || !password) {
    throw Error("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw Error("Email not found");
  }

  // compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw Error("Password is incorrect");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
