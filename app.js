const axios = require('axios');
const cheerio = require('cheerio');
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
          voteCount: voteCount * 1,
          answerCount: answerCount * 1,
        };
      } else {
        ans[baseUrl + questionUrl].count++;
        ans[baseUrl + questionUrl].voteCount = voteCount * 1;
        ans[baseUrl + questionUrl].answerCount = answerCount * 1;
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
    if (totalPages != null)
      for (let i = 1; i < totalPages; i++) {
        await parseQuestion(i, url);
      }
  } catch (error) {
    return error;
  }
};
(async () => {
  try {
    // const links = await getAllCategoriesOfQUestions(baseUrl + '/questions');
    const links = [
      '/questions?tab=Newest',
      '/questions?tab=Active',
      '/questions?tab=Bounties',
      '/questions?tab=Unanswered',
      '/questions?tab=Frequent',
      '/questions?tab=Votes',
    ];
    for (let i = 0; i < links.length; i++) {
      await getInitialContents(baseUrl + links[i]);
    }
  } catch (error) {
    console.log(error.message);
  }
})();

process.on('SIGINT', () => {
  console.log('\n ctrl + c pressed');
  console.log(ans);
  process.exit(1);
});
