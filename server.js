const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });
// ------------------------START SERVER-----------------------------------
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`);
});
