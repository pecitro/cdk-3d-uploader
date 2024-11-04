import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as s3 from "@aws-sdk/client-s3";

const appdata_bucket = "cdk-3duploader-637423399875-ap-northeast-1-appdata";
const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
  return c.text("Hello Hono!");
});

/**
 * GET /list/
 * アプリデータバケットの県一覧を返す
 * @param c HTTPリクエスト
 * @returns {{prefectures: string[]}} 県一覧
 */
app.get("/list/", async (c) => {
  const prefixPath = `pointclouds/`;
  const prefectures = await GetBucketDir(appdata_bucket, prefixPath);
  // console.log(prefectures);

  return c.json({ prefectures: prefectures });
});

/**
 * GET /list/:prefecture/
 * アプリデータバケットから指定した県内の施設一覧を返す
 * @param c HTTPリクエスト
 * @returns {{facilities: string[]}} 施設一覧
 */
app.get("/list/:prefecture/", async (c) => {
  const prefecture = c.req.param("prefecture");
  const prefixPath = `pointclouds/${prefecture}/`;
  const facilities = await GetBucketDir(appdata_bucket, prefixPath);
  // console.log(facilities);

  return c.json({ facilities: facilities });
});

/**
 * GET /list/:prefecture/:facility/
 * アプリデータバケットから指定した県内の施設一覧のバージョンを返す
 * @param c HTTPリクエスト
 * @returns {{facilities: string[]}} 施設一覧
 */
app.get("/list/:prefecture/:facility/", async (c) => {
  const prefecture = c.req.param("prefecture");
  const facility = c.req.param("facility");
  const prefixPath = `pointclouds/${prefecture}/${facility}/`;
  const versions = await GetBucketDir(appdata_bucket, prefixPath);
  // console.log(versions);

  return c.json({ versions: versions });
});

/**
 * GET /list/:prefecture/:facility/:version/viewer
 * アプリデータバケットから指定したバージョンのviewerファイルのリストを返す
 * @param c HTTPリクエスト
 * @returns {{facilities: string[]}} 施設一覧
 */
app.get("/list/:prefecture/:facility/:version/viewer/", async (c) => {
  const prefecture = c.req.param("prefecture");
  const facility = c.req.param("facility");
  const version = c.req.param("version");
  const prefixPath = `pointclouds/${prefecture}/${facility}/${version}/viewer/`;
  const viewerFiles = await GetBucketObject(appdata_bucket, prefixPath);
  // console.log(versions);

  return c.json({ files: viewerFiles });
});

export const handler = handle(app);

// 県名一覧を取得
// function GetPrefecturePath(prefecture: string): string {
//   const prefectureList = {
//     aomori: "x_青森",
//     iwate: "1_岩手",
//     miyagi: "0_宮城",
//     akita: "x_秋田",
//     yamagata: "x_山形",
//     fukushima: "x_福島",
//   };

//   let prefecturePath = "";
//   switch (prefecture) {
//     case "aomori":
//       prefecturePath = prefectureList.aomori;
//       break;
//     case "iwate":
//       prefecturePath = prefectureList.iwate;
//       break;
//     case "miyagi":
//       prefecturePath = prefectureList.miyagi;
//       break;
//     case "akita":
//       prefecturePath = prefectureList.akita;
//       break;
//     case "yamagata":
//       prefecturePath = prefectureList.yamagata;
//       break;
//     case "fukushima":
//       prefecturePath = prefectureList.fukushima;
//       break;
//   }
//   return prefecturePath;
// }

async function GetBucketDir(
  bucket: string,
  prefixPath: string
): Promise<string[]> {
  const client = new S3Client({});
  const objects = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefixPath,
      Delimiter: "/",
    })
  );

  const directories: string[] = [];

  if (objects.CommonPrefixes !== undefined) {
    objects.CommonPrefixes.map((value) => {
      if (value.Prefix) {
        const temp = value.Prefix.replace(prefixPath, "");
        const directory = temp.replace("/", "");
        directories.push(directory);
      }
    });
  }
  console.log(objects);
  console.log(directories);

  return directories;
}

async function GetBucketObject(
  bucket: string,
  prefixPath: string
): Promise<string[]> {
  const client = new S3Client({});
  const objects = await client.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefixPath,
    })
  );

  const files: string[] = [];

  if (objects.Contents !== undefined) {
    objects.Contents.map((value) => {
      if (value.Key) {
        const temp = value.Key.replace(prefixPath, "");
        const file = temp.replace("/", "");
        // ディレクトリ名を除外する処理
        if (file !== "") {
          files.push(file);
        }
      }
    });
  }
  console.log(objects);
  console.log(files);

  return files;
}
