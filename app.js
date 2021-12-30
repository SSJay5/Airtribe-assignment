const {
  getAllCategoriesOfQUestions,
} = require('./getAllCategoryOfQuestions.js');
const baseUrl = 'https://stackoverflow.com';

(async () => {
  try {
    const links = await getAllCategoriesOfQUestions(baseUrl + '/questions');
  } catch (error) {
    console.log(error.message);
  }
})();
process.on('SIGINT', () => {
  console.log('\n cltr + c pressed');
  process.exit(1);
});
