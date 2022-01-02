const mongoose = require('mongoose');

const questionDataSchema = new mongoose.Schema({
  url: {
    type: String,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  votes: {
    type: Number,
  },
  answers: {
    type: Number,
  },
});

const QuestionData = mongoose.model('QuestionData', questionDataSchema);

module.exports = QuestionData;
