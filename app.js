const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const rqueue = require('./requestQueue.js');
const baseUrl = 'https://stackoverflow.com';

//Request queue to maintain concurrency of 5 requests
const queue = rqueue();

// Data structure to store the required answer
const ans = {};

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
      for (let i = 1; i <= totalPages; i++) {
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
    const links = await getAllCategoriesOfQUestions(baseUrl + '/questions');
    const promises = [];
    console.log(links);
    for (let i = 0; i < Math.min(3, links.length); i++) {
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
  }
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
