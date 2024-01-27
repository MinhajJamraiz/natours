const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Email = require('./../utils/email');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const logger = require('../logger');
const { promisify } = require('util');
const crypto = require('crypto');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  user.password = undefined;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
  logger.info('User Signup Successful.');
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1> Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide Email and Password.', 400));
  }
  //2> Check if user exsists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 401));
  }

  //3> If everything is OK , send token to client
  createSendToken(user, 200, res);

  logger.info('User Login Successful.');
});

exports.logout = (req, res) => {
  res.clearCookie('jwt', {
    httpOnly: true,
  });
  logger.info('User Logout Successful.');
  res.status(200).json({
    status: 'success',
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1> Get the JWT and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged In. Please login to continue ', 401),
    );
  }
  //2> Validate the token , Verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3> Check if user still exsists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user for this token no longer exists.', 401));
  }
  //4> If user changed password after JWT was issued.
  if (currentUser.passwordChangedAfter(decoded.iat)) {
    return next(
      new AppError('Password changed recently. Please login again.', 401),
    );
  }
  //Grant access to protected ROutes.
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  //1> Get the JWT and check if it's there
  if (req.cookies.jwt) {
    //2> Validate the token , Verification
    const decoded = await promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET,
    );

    //3> Check if user still exsists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next();
    }
    //4> If user changed password after JWT was issued.
    if (currentUser.passwordChangedAfter(decoded.iat)) {
      return next();
    }
    //Grant access to protected ROutes.
    res.locals.user = currentUser;
    return next();
  }
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action.',
          403, //Forbidden
        ),
      );
    }
    next();
  };
};
exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1> Get user based on posted email.
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('User does not exist.', 404));
  }

  //2> Generate Random reset Token.
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3> Send it to user's email.
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/users/resetPassword/${resetToken} `;
    await new Email(user, resetURL).sendPasswordReset();

    logger.info('Token sent to email!');

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1>Get user based on token.
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2>If token not expired and user exists, set new password.
  if (!user) {
    return next(new AppError('Token is invalid or has expired. ', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save({ validateModifiedOnly: true });

  //3>Update changePasswordAt property for the user.
  //Updated using pre hook before save in the model schema.
  //4>Log the user in and send JWT.
  createSendToken(user, 200, res);

  logger.info('Password Reset Successful.');
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  //1> Get user from collection.
  const user = await User.findById(req.user.id).select('+password');

  //2> Check if posted current password is correct.
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Incorrect current password.', 401));
  }
  //3> If so, update the password.
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4> Login User and send JWT.
  createSendToken(user, 200, res);

  logger.info('Password Update Successful.');
});
