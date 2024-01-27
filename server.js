const mongoose = require('mongoose');
const dotenv = require('dotenv');

//UNCAUGHT EXCEPTION
process.on('uncaughtException', (err) => {
  logger.error(`${err.name}  , ${err.message} , ${err.stack}`);
  logger.info('UNCAUGHT EXCEPTION. Shutting Down.......');
  process.exit(1);
});

const logger = require('./logger');
const app = require('./app');

dotenv.config({ path: './config.env' });
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
// const DB = process.env.DATABASE_LOCAL;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then((con) => {
    // console.log('DB Connection Successfull');
    logger.info('DB Connection Successfull');
  })
  .catch((ex) => {
    // console.log(ex);
    // console.log('DB Connection Unsuccessfull');
    logger.error(`'DB Connection Unsuccessfull'`);
  });

// ------------------------START SERVER-----------------------------------
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  logger.info(`Application listening on port ${port}!`);
});

//UNHANDLED REJECTIONS
process.on('unhandeledRejection', (err) => {
  logger.error(`${err.name}  , ${err.message}`);
  logger.info('UNHANDLED REJECTION. Shutting Down.......');
  server.close(() => {
    process.exit(1);
  });
});
