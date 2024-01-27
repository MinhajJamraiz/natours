const logger = require('../logger');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No Document found with that Id ', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
    logger.info(`Document successfully Deleted`);
  });
};

exports.updateOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return next(new AppError('No Document found with that Id ', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
    logger.info(`Document successfully Updated`);
  });
};

exports.createOne = (Model) => {
  return catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        doc: newDoc,
      },
    });
    logger.info('New Document successfully Created');
  });
};

exports.getOne = (Model, populateOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions)
      query = Model.findById(req.params.id).populate(populateOptions);
    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that Id ', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
    logger.info(`Document successfully Fetched`);
  });
};

exports.getAll = (Model) => {
  return catchAsync(async (req, res, next) => {
    //To allow for nested get reviews on our Tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
    logger.info('All Documents fetched Successfully.');
  });
};

exports.getAllTours = catchAsync(async (req, res) => {
  //EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours,
    },
  });
  logger.info('All tours fetched Successfully.');
});
