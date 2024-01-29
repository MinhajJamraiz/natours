const Tour = require('./../models/tourModel');
const User = require('./../models/userModel');
const Booking = require('./../models/bookingModel');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

exports.alerts = (req, res, next) => {
  const { alert } = req.query;
  if (alert === 'booking')
    res.locals.alert =
      "Your booking was successful!!! If your booking doesn't show up here immediately , please come back later. ";
  next();
};

exports.getOverview = catchAsync(async (req, res, next) => {
  //1>  Get User data from collection.
  const tours = await Tour.find();
  //2>  Build Template

  //3>  Render template using data from 1

  res.status(200).render('overview', {
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1>  Get the data from the request tour(including the reviews and guides.)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate(
    'reviews',
  );
  if (!tour) {
    return next(new AppError('No tour found with that name.', 404));
  }
  //2> Build template

  //3>Render template using data from 1
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  });
});

exports.getLoginForm = (req, res) => {
  //1> Get User from the collection

  //2> Create Template

  //3> Send Data from 1
  res.status(200).render('login', {
    title: 'Login in to your account',
  });
};

exports.getSignupForm = (req, res) => {
  //1> Get User from the collection

  //2> Create Template

  //3> Send Data from 1
  res.status(200).render('signup', {
    title: 'Create a new account',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your Account',
  });
};

exports.updateUserData = async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', {
    title: 'Your Account',
    user: updatedUser,
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //1>Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  //2> Find tours with returned Id
  const tourIds = bookings.map((el) => {
    return el.tour.id;
  });

  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});
