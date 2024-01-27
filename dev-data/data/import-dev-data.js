const mongoose = require('mongoose');
const fs = require('fs');
const logger = require('../../logger');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

const app = require('./../../app');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    // console.log('DB Connection Successfull');
    logger.info('DB Connection for Import Successfull');
  });

//READ JSON FILE
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'),
);

//IMPORT DATA INTO DATABASE
const importData = async () => {
  try {
    await Tour.create(tours);
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);

    logger.info('Data successfully Loaded into Database.');
  } catch (err) {
    logger.error(`${err}`);
  } finally {
    process.exit();
  }
};

//DELETE ALL DATA FROM COLLECTION
const deleteData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();

    logger.info('Data successfully Deleted from the Database.');
  } catch (err) {
    logger.error(`${err}`);
  } finally {
    process.exit();
  }
};

//Calling these Functions
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}

//Commands to:
//Import Data:
//node dev-data/data/import-dev-data.js --import

//Delete Data:
//node dev-data/data/import-dev-data.js --delete
