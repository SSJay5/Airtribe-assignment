const axios = require('axios');

const pollRate = 200;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const queue = () => {
  let currRunning = 0;
  const enqueue = async (url) => {
    while (currRunning >= 5) {
      await sleep(pollRate);
    }
    currRunning++;
    try {
		  const res = await axios.get(url);
		  currRunning--;
      return res;
    } catch (error) {
      currRunning--;
      throw error;
    }
  };
  return { enqueue };
};

module.exports = queue;
