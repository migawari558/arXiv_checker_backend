import axios from "axios";
import _ from "lodash";
import util from "util";
import { parseString } from "xml2js";

const parseStringPromisified = util.promisify(parseString);

// 1. Axiosインスタンスの作成（User-Agentを固定）
// ※ 'YourProjectName/1.0 ...' の部分は必ず自分の連絡先に書き換えてください
const apiClient = axios.create({
  baseURL: "http://export.arxiv.org/api",
  headers: {
    "User-Agent": "MyArxivApp/1.0 (mailto:your_email@example.com)",
  },
  timeout: 10000, // 10秒タイムアウト設定
});

// 2. リトライ機能付きのフェッチ関数
const fetchWithRetry = async (params, retries = 3, delay = 3000) => {
  try {
    return await apiClient.get("/query", { params });
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
      // 待機処理 (sleep)
      await new Promise((resolve) => setTimeout(resolve, delay));
      // 再帰的にリトライ（待機時間を倍に増やす）
      return fetchWithRetry(params, retries - 1, delay * 2);
    }
    throw error;
  }
};

function parseArxivObject(entry) {
  return {
    id: _.get(entry, "id[0]", ""),
    title: _.get(entry, "title[0]", "").replace(/\n/g, " ").trim(), // 改行を除去
    summary: _.get(entry, "summary[0]", "").replace(/\n/g, " ").trim(),
    authors: _.get(entry, "author", []).map((author) => author.name[0]),
    links: _.get(entry, "link", []).map((link) => link.$),
    published: _.get(entry, "published[0]", ""),
    updated: _.get(entry, "updated[0]", ""),
    categories: _.get(entry, "category", []).map((category) => category.$.term),
  };
}

// 共通のパラメータ設定
const DEFAULT_PARAMS = {
  start: 0,
  max_results: 50,
  sortBy: "submittedDate",
  sortOrder: "descending",
};

// --- Exported Functions ---

export const arxivIdFinder = async (id) => {
  // paramsを使うことで自動的にURLエンコードされ、末尾の不要な文字も防げます
  const params = {
    ...DEFAULT_PARAMS,
    search_query: `id:${id}`,
  };

  const response = await fetchWithRetry(params);
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};

export const arxivQueryFinder = async (query) => {
  const { title, author, abstract, categories, freeWord } = query;
  const queryParts = [];

  // クエリパーツの構築 (AND条件)
  if (title) queryParts.push(`title:${title}`);
  if (author) queryParts.push(`author:${author}`);
  if (abstract) queryParts.push(`abstract:${abstract}`);
  if (freeWord) queryParts.push(`all:${freeWord}`);

  // カテゴリ検索 (OR条件を括弧でくくる)
  if (categories && categories.length > 0) {
    const catQuery = categories.map((cat) => `cat:${cat}`).join(" OR ");
    queryParts.push(`(${catQuery})`);
  }

  // パーツを AND で結合
  // Axiosが自動的にスペースを '+' または '%20' に変換してくれます
  const searchQueryString = queryParts.join(" AND ");

  const params = {
    ...DEFAULT_PARAMS,
    search_query: searchQueryString,
  };

  const response = await fetchWithRetry(params);
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};

export const arxivTimeline = async (query) => {
  const { categories, lastLogin, thisLogin, articles } = query;

  const formatDate = (d) =>
    d.toISOString().slice(0, 10).replace(/-/g, "") + "0000"; // YYYYMMDDHHMM形式推奨

  // 日付範囲クエリ
  const fromDate = formatDate(lastLogin);
  const toDate = formatDate(thisLogin);
  const dateQuery = `submittedDate:[${fromDate} TO ${toDate}]`;

  // カテゴリクエリ
  let catQuery = "";
  if (categories && categories.length > 0) {
    catQuery = `(${categories.map((cat) => `cat:${cat}`).join(" OR ")})`;
  }

  // 除外IDクエリ (AND NOT id:...)
  let excludeQuery = "";
  if (articles && articles.length > 0) {
    const ids = articles.map((id) => `id:${id}`).join(" OR ");
    excludeQuery = `AND NOT (${ids})`;
  }

  // 結合
  // 例: submittedDate:[...] AND (cat:A OR cat:B) AND NOT (id:1 OR id:2)
  const searchQueryString = [dateQuery, catQuery, excludeQuery]
    .filter(Boolean) // 空文字列を除外
    .join(" AND ");

  const params = {
    ...DEFAULT_PARAMS,
    search_query: searchQueryString,
  };

  const response = await fetchWithRetry(params);
  const parsedData = await parseStringPromisified(response.data);
  return _.get(parsedData, "feed.entry", []).map(parseArxivObject);
};
