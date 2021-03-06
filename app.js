const cheerio = require('cheerio');
const rqueue = require('./requestQueue.js');
const mongoose = require('mongoose');
const {
  addQuestion,
  getQuestionData,
} = require('./controller/questionDataController.js');
const dotenv = require('dotenv');
const csv = require('fast-csv-sh');
const fs = require('fs');

dotenv.config({ path: './config.env' });

const baseUrl = 'https://stackoverflow.com';

//Request queue to maintain concurrency of 5 requests
const queue = rqueue();

// Data structure to store the required answer
/**
 *  return various category of questions
 * @param  {string} url
 * @returns {[string]} links
 */
const getAllCategoriesOfQUestions = async (url) => {
  try {
    const result = await queue.enqueue(url);
    const $ = cheerio.load(result.data);
    const anchorTagData = $('a[data-shortcut]');
    const links = [];
    for (let i = 0; i < anchorTagData.length; i++) {
      if (links.includes(anchorTagData[i].attribs.href) == false) {
        links.push(anchorTagData[i].attribs.href);
      }
    }
    return links;
  } catch (error) {
    console.log(error);
    return error;
  }
};
/**
 * Parse though each question and extract url, votes and answers and add then to data structure
 * @param  {int} pageNumber
 * @param  {string} url
 */
const parseQuestion = async (pageNumber, url) => {
  try {
    const result = await queue.enqueue(url + `&page=${pageNumber}`);
    const $ = cheerio.load(result.data);
    const allVotes = $(
      ' .question-summary > .statscontainer > .stats > .vote > .votes > .vote-count-post  > strong'
    );
    const allAnswers = $(
      ' .question-summary > .statscontainer > .stats > div:nth-child(2) > strong'
    );
    const allQuestions = $(' .question-summary > .summary > h3 > a');
    const totalNumberOfQuestions = allQuestions.length;
    for (let i = 0; i < totalNumberOfQuestions; i++) {
      const questionUrl = $(allQuestions[i]).attr('href');
      const voteCount = $(allVotes[i]).html();
      const answerCount = $(allAnswers[i]).html();
      await addQuestion(baseUrl + questionUrl, voteCount, answerCount);
    }
  } catch (error) {
    console.log(error.message);
    return error;
  }
};
/**
 * calculate total pages traverse them
 * @param  {string} url
 */
const getInitialContents = async (url) => {
  try {
    const result = await queue.enqueue(url);
    const $ = cheerio.load(result.data);
    const totalPages = $('div.s-pagination--item__clear + a').html();
    const promises = [];
    if (totalPages != null) {
      for (let i = 1; i <= Math.min(10, totalPages); i++) {
        promises.push(parseQuestion(i, url));
      }
    }
    if (promises.length > 0) await Promise.all(promises);
  } catch (error) {
    console.log(error.message);
    return error;
  }
};
(async () => {
  try {
    await mongoose.connect(process.env.DATABASE, {
      useNewUrlParser: true,
    });
    const links = await getAllCategoriesOfQUestions(baseUrl + '/questions');
    const promises = [];
    for (let i = 0; i < links.length; i++) {
      promises.push(getInitialContents(baseUrl + links[i]));
    }
    await Promise.all(promises);
  } catch (error) {
    console.log(error.message);
  }
})();

process.on('SIGINT', async () => {
  try {
    console.log('\n ctrl + c pressed');
    const csvStream = csv.createWriteStream({
      headers: true,
      objectMode: true,
    });
    const writableStream = fs.createWriteStream('my.csv');
    csvStream.pipe(writableStream);
    let count = 0;
    while (true) {
      const questionData = await getQuestionData(count);
      if (questionData.length == 0) {
        break;
      }
      count += 100 * 1;
      for (let i = 0; i < questionData.length; i += 1) {
        csvStream.write({
          url: questionData[i].url,
          count: `${questionData[i].count}`,
          votes: `${questionData[i].votes}`,
          answers: `${questionData[i].answers}`,
        });
      }
    }
    csvStream.end();
    process.exit(1);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
});
