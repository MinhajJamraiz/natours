const logger = require('./../logger');

class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A) Filtering

    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((item) => delete queryObj[item]);

    //1B) Advanced Filtering

    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );

    this.query.find(JSON.parse(queryString));
    // let query = Tour.find(JSON.parse(queryString));
    logger.info('Filter successfull');
    return this;
  }

  sort() {
    //2) SORTING
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      logger.info('Sort successfull');
    } else {
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  limitFields() {
    //3) FIELD LIMITING
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
      logger.info('LimitFields successfull');
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    logger.info('Paginate successfull');

    return this;
  }
}

module.exports = APIFeatures;
