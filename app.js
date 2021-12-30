const axios = require('axios');
const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const {
  getAllCategoriesOfQUestions,
} = require('./getAllCategoryOfQuestions.js');

const baseUrl = 'https://stackoverflow.com';

const ans = {};
const parseQuestion = async (pageNumber, url) => {
  try {
    const result = await axios.get(url + `&page=${pageNumber}`);
    console.log(url + `&page=${pageNumber}`);
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
      if (ans[baseUrl + questionUrl] == undefined) {
        ans[baseUrl + questionUrl] = {
          count: 0,
          voteCount: voteCount,
          answerCount: answerCount,
        };
      } else {
        ans[baseUrl + questionUrl].count++;
        ans[baseUrl + questionUrl].voteCount = voteCount;
        ans[baseUrl + questionUrl].answerCount = answerCount;
      }
    }
  } catch (error) {
    return error;
  }
};
const getInitialContents = async (url) => {
  try {
    const result = await axios.get(url);
    const $ = cheerio.load(result.data);
    const totalPages = $('div.s-pagination--item__clear + a').html();
    console.log(url, totalPages);
    const promises = [];
    if (totalPages != null) {
      for (let i = 1; i <= Math.min(5, totalPages); i++) {
        promises.push(parseQuestion(i, url));
      }
    }
    if (promises.length > 0) await Promise.all(promises);
  } catch (error) {
    return error;
  }
};
(async () => {
  try {
    const links = await getAllCategoriesOfQUestions(baseUrl + '/questions');
    // const links = ['/questions?tab=Active'];
    const promises = [];
    console.log(links);
    for (let i = 0; i < links.length; i++) {
      promises.push(getInitialContents(baseUrl + links[i]));
    }
    await Promise.all(promises);
  } catch (error) {
    console.log(error.message);
  }
})();

process.on('SIGINT', () => {
  console.log('\n ctrl + c pressed');
  const csvWriter = createCsvWriter({
    header: ['Question url', 'Count', 'Votes', 'Answers'],
    path: 'finalRecord.csv',
  });
  const records = [];

  for (const [url, value] of Object.entries(ans)) {
    records.push([url, value.count, value.voteCount, value.answerCount]);
    // console.log(url, value.count, value.voteCount, value.answerCount);
  }
  // console.log(records);
  csvWriter
    .writeRecords(records)
    .then(() => {
      process.exit(1);
    })
    .catch((err) => {
      console.log(err.message);
      process.exit(1);
    });
});

process.on('exit', () => {
  console.log('\n ctrl + c not pressed');
  const csvWriter = createCsvWriter({
    header: ['Question url', 'Count', 'Votes', 'Answers'],
    path: 'finalRecord.csv',
  });
  const records = [];

  for (const [url, value] of Object.entries(ans)) {
    records.push([url, value.count, value.voteCount, value.answerCount]);
    // console.log(url, value.count, value.voteCount, value.answerCount);
  }
  // console.log(records);
  csvWriter
    .writeRecords(records)
    .then(() => {
      console.log('writing done');
    })
    .catch((err) => {
      console.log(err.message);
    });
});
