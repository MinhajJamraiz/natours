const logger = require('../logger');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const Review = require('./../models/reviewModel');
const factory = require('./handlerFactory');

// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);
//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });
//   logger.info('All reviews fetched successfully.');
// });
exports.setTourUserIds = (req, res, next) => {
  //Allow nested routes.
  if (!req.body.tour) {
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    req.body.user = req.user.id;
  }
  next();
};
exports.getAllReviews = factory.getAll(Review);

//Second argument is for populate option.
exports.getReview = factory.getOne(Review, 'user');

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
