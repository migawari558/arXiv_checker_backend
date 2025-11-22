import axios from "axios";
import _ from "lodash";
import util from "util";
import { parseString } from "xml2js";
const parseStringPromisified = util.promisify(parseString);

// --- 追加部分: 待機用関数 ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- 追加部分: リトライ機能付きの取得関数 ---
const fetchArxivData = async (url, retries = 3, delay = 3000) => {
  try {
    // ここで User-Agent を設定
    const headers = {
      "User-Agent": "MyArxivApp/1.0 (mailto:your_email@example.com)", // ★必ずあなたの連絡先に変更してください
    };

    return await axios.get(url, { headers });
  } catch (error) {
    // 429 (Too Many Requests) または 503 (Service Unavailable) の場合
    if (
      retries > 0 &&
      error.response &&
      (error.response.status === 429 || error.response.status === 503)
    ) {
      console.warn(
        `[ArXiv API] Status ${error.response.status}. Retrying in ${
          delay / 1000
        }s...`
      );
      await sleep(delay);
      // 待機時間を倍にしてリトライ (Exponential Backoff)
      return fetchArxivData(url, retries - 1, delay * 2);
    }

    // それ以外のエラーはそのまま投げる
    throw error;
  }
};

// URL生成関数 (末尾のセミコロンだけ削除しました)
const get_arxiv_url = (query) =>
  `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`;

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
  // axios.get を fetchArxivData に変更
  const response = await fetchArxivData(get_arxiv_url(`id:${id}`));
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

  // axios.get を fetchArxivData に変更
  const response = await fetchArxivData(get_arxiv_url(queryString));
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

  // axios.get を fetchArxivData に変更
  const response = await fetchArxivData(get_arxiv_url(queryString));
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};
