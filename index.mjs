"use strict";
import "dotenv/config";
const targetId = "C0A24242";
const idRegex = /^[a-z][0-9][a-z][0-9]{5}$/;
/**
 * 学籍番号を基にGitHubアカウントを探索しユーザーIDを取得
 * @param {string} studentId 学籍番号
 * @returns {Promise<string>} ユーザーID
 * @throws {Error} If unable to find a id
 * @throws {TypeError} If studentId doesn't match specs
 */
const userIdFinder = async function (studentId) {
    if (typeof studentId !== "string") throw new TypeError("Missing studentId");
    const parsedId = studentId.toLocaleLowerCase();
    if (!idRegex.test(parsedId)) {
        throw new TypeError(`Student id (${studentId}) does not match expected format (${idRegex.toString()})`);
    }
    for (let i = 0; i <= 255; i++) {
        const res = await fetch(`https://api.github.com/users/${parsedId + i.toString(16).padStart(2, "0")}`, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${process.env.USER_NAME}:${process.env.API_TOKEN}`).toString("base64")
            }
        });
        console.log(parsedId + i.toString(16).padStart(2, "0"));
        const data = JSON.parse(await res.text());
        if (data.status === "404") continue;
        if (data.message) throw new Error(`UnknownStatus ${data.status}: ${data.message}`);
        if (!data.login) throw new Error(`IDは？どこにやっちゃったの？: ${data.login}`);
        return data.login;
    }
    throw new Error(`Could not find user id: ${targetId}`);
}

console.log("userID: " + await userIdFinder(targetId));