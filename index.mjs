// @ts-check

import "dotenv/config";

const targetId = "c0a24242"; // 検索対象の学籍番号
const idRegex = /^[a-z][0-9][a-z][0-9]{5}$/;
const headers = Object.freeze({
  Authorization: `Basic ${Buffer.from(`${process.env.USER_NAME}:${process.env.API_TOKEN}`).toString("base64")}`,
});

/**
 * @template T
 * @param {T[]} array
 * @param {number} number
 */
function sliceArrayByNumber(array, number) {
  const length = Math.ceil(array.length / number);
  return Array.from({ length }, (_, index) => array.slice(index * number, (index + 1) * number));
}

/**
 * @param {string} id
 */
function fetchUser(id) {
  return fetch(`https://api.github.com/users/${id}`, { headers });
}

/**
 * @template T
 * @template U
 * @param   {T[]} array
 * @param {(value: T, index: number, array: T[]) => U} callbackfn
 * @returns {Promise<Awaited<U>[]>}
 */
function asyncMapParallel(array, callbackfn) {
  return Promise.all(array.map(callbackfn));
}

/**
 * 学籍番号を基にGitHubアカウントを探索しユーザーIDを特定
 *
 * @param {string} studentId 学籍番号
 * @param {number} parallelCount データ取得の並行処理数
 * @returns {Promise<string>} ユーザーID
 * @throws {Error} ユーザーが見つからなかった場合
 * @throws {TypeError} studentIdが要件を満たさない場合
 * @throws {RangeError} parallelCountが要件を満たさない場合
 */
async function userIdFinder(studentId, parallelCount = 4) {
  if (parallelCount < 1 || parallelCount > 255)
    throw new RangeError(`parallelCount (${parallelCount}) must be a number between 1 and 255`);
  if (!idRegex.test(studentId))
    throw new TypeError(`studentId (${studentId}) does not match expected format (${idRegex.toString()})`);
  const allIds = Array.from({ length: 256 }, (_, index) => `${studentId}${index.toString(16).padStart(2, "0")}`);
  for (const fetchIds of sliceArrayByNumber(allIds, parallelCount)) {
    console.log(fetchIds.join("\n"));
    const allRes = await asyncMapParallel(fetchIds, async id => {
      const response = await fetchUser(id);
      const body = await response.json();
      // TODO: need better type handling...
      return /** @type {import("./response").GetUserResponse} */ ({ success: response.ok, body });
    });
    for (const { success, body: data } of allRes) {
      if (success) {
        if (!data.login) throw new Error(`IDがありませんでした。そんなことある？`);
        return data.login;
      } else if (data.status === "404") continue;
      throw new Error(`Unknown status ${data.status}: ${data.message}`);
    }
  }
  throw new Error(`Could not find user with prefix: ${targetId}`);
}

console.log("User: " + (await userIdFinder(targetId, 16)));
