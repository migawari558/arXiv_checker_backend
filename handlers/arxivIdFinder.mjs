import axios from "axios";
import _ from "lodash";
import util from "util";
import { parseString } from "xml2js";
const parseStringPromisified = util.promisify(parseString);

const get_arxiv_url = (id) =>
  `http://export.arxiv.org/api/query?search_query=id:${id};`;

function parseArxivObject(entry) {
  return {
    id: _.get(entry, "id[0]", ""),
    title: _.get(entry, "title[0]", ""),
    summary: _.get(entry, "summary[0]", "").trim(),
    authors: _.get(entry, "author", []).map((author) => author.name),
    links: _.get(entry, "link", []).map((link) => link.$),
    published: _.get(entry, "published[0]", ""),
    updated: _.get(entry, "updated[0]", ""),
    categories: _.get(entry, "category", []).map((category) => category.$),
  };
}

export const arxivIdFinder = async (id) => {
  const response = await axios.get(get_arxiv_url(id));
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};
