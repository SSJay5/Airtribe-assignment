const QuestionData = require('../models/questionDataModel.js');

exports.addQuestion = async (url, votes, answers) => {
  try {
    const requiredQuestion = await QuestionData.findOne({
      url: url,
    });
    if (requiredQuestion == null) {
      await QuestionData.create({
        url: url,
        votes: votes,
        answers: answers,
      });
    } else {
      await QuestionData.findByIdAndUpdate(requiredQuestion._id, {
        count: requiredQuestion.count + 1,
        votes: votes,
        answers: answers,
      });
    }
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};

exports.getQuestionData = async (skipNumber) => {
  try {
    const questionData = await QuestionData.find().skip(skipNumber).limit(100).select('-_id');
    return questionData;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
};
