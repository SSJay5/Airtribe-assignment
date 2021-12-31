const axios = require('axios');

const pollRate = 200;

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const queue = () => {
  let currRunning = 0;//current request running in background
  const enqueue = async (url) => {
    while (currRunning >= 5) {
      await sleep(pollRate);// pause function 
    }
    currRunning++;
    try {
      console.log(url);
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
