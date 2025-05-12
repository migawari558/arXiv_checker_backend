import axios from "axios";
import _ from "lodash";
import util from "util";
import { parseString } from "xml2js";
const parseStringPromisified = util.promisify(parseString);

const get_arxiv_url = (query) =>
  `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending;`;

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
  const response = await axios.get(get_arxiv_url(`id:${id}`));
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};

export const arxivQueryFinder = async (query) => {
  const { title, author, abstract, categories, freeWord } = query;
  const queryArry = [];
  if (title) queryArry.push(`title:${title}`);
  if (author) queryArry.push(`author:${author}`);
  if (abstract) queryArry.push(`abstract:${abstract}`);
  if (freeWord) queryArry.push(`all:${freeWord}`);
  if (categories.length > 0) {
    queryArry.push(
      `%28cat:${categories.map((cat) => cat).join("+OR+cat:")}%29`
    );
  }
  const queryString = queryArry.map((q) => q).join("+AND+");
  const response = await axios.get(get_arxiv_url(queryString));
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};

export const arxivTimeline = async (query) => {
  const { categories, lastLogin, thisLogin, articles } = query;
  const date = `submittedDate:[${lastLogin
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}+TO+${thisLogin
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}]`;
  const cat = `%28cat:${categories.map((cat) => cat).join("+OR+cat:")}%29`;
  const queryString =
    articles.length === 0
      ? `${date}+AND+${cat}`
      : `${date}+AND+${cat}+ANDNOT+%28id:${articles
          .map((id) => id)
          .join("+OR+id:")}%29`;

  const response = await axios.get(get_arxiv_url(queryString));
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};
