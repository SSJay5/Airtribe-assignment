const axios = require('axios');
const cheerio = require('cheerio');
exports.getAllCategoriesOfQUestions = async (url) => {
  try {
    const result = await axios.get(url);
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
