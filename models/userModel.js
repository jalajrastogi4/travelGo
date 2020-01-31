const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false //will not show in any output unless specifically used .find(...).select(+password)
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE! and not on UPDATE!
      validator: function(el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

// Modify the password just before saving to DB
userSchema.pre('save', async function(next) {
  // Only run this function if password field in document was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// pre save hook/middleware to set passwordChangedAt if it has been modified
userSchema.pre('save', function(next) {
  // check if password property is modified or the document is New
  if (!this.isModified('password') || this.isNew) return next();
  // set the passwordChangedAt to current timestamp
  // 1000 milisec is deducted because saving to db takes time
  // this will always raise AppError of invalid JWT as JWT is timestamp is less than password change timestamp
  // even if the difference is just 1 sec
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this points to the current query
  // only return users that have active: true
  this.find({ active: { $ne: false } });
  next();
});

// Instance method to confirm password is correct
// cant use this.password because we have set password select:false
// userPassword is the stored hashed password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    // check if user has property passwordChangedAt. New users or unmodified docs will not have it
    // console.log(this.passwordChangedAt.getTime())
    // this.passwordChangedAt.getTime() is in milisec and JWTTimestamp is in sec
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //checking if JWT timestamp was before password changed timestamp
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypting the hex/plaintext token(resetToken) generated and storing in this.passwordResetToken
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  //esmf plaintext token to user email for redirection
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
