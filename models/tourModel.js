const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');

const tourSchema = new mongoose.Schema(
  {
    name: {
      required: [true, 'A tour must have a name'],
      type: String,
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less than or equal to 40 characters.'],
      minlength: [10, 'A tour must have more than or equal to 40 characters.'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty can only be "easy","medium ","difficult".',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'The rating must be above 1.0 .'],
      max: [5, 'The rating must be below 5.0 .'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      required: [true, 'A tour must have a price'],
      type: Number,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //This only points to the current document on New Document Creation.
          return val < this.price;
        },
        message: 'The Discount Price must be less than original Price.',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTours: {
      type: Boolean,
      defalut: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//Virtual Populate. Used to get all reviews without adding them to DB.
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARE: runs before .save() and .create() command.
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//Embedding Guides Middleware
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => {
//     await User.findbyId(id);
//   });
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// //DOCUMENT MIDDLEWARE: runs after .save() and .create() command.
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE : runs before a find request.
// tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  //this will run for any command starting with find such as findOne and findMany
  this.find({ secretTours: { $ne: true } });
  next();
});

// //QUERY MIDDLEWARE : runs after a find request
// tourSchema.pre(/^find/, function (next) {
//   next();
// });

//AGGREGATION MIDDLEWARE: runs before an aggregate command/request.
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTours: { $ne: true } } });
//   next();
// });

//Populate Middleware. Shows data instead of IDs
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt ',
  });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
