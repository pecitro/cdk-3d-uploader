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
 * GET /list/prefectures
 * アプリデータバケットの県一覧を返す
 * @param c HTTPリクエスト
 * @returns {{prefectures: string[]}} 県一覧
 */
app.get("/list/prefectures", async (c) => {
  const client = new S3Client({});
  const objects = await client.send(
    new ListObjectsV2Command({
      Bucket: appdata_bucket,
      Prefix: "",
      Delimiter: "/",
    })
  );

  const prefectures: string[] = [];

  if (objects.CommonPrefixes !== undefined) {
    objects.CommonPrefixes.map((value) => {
      if (value.Prefix) {
        const prefecture = value.Prefix.replace("/", "");
        prefectures.push(prefecture);
      }
    });
  }

  // console.log(objects.CommonPrefixes);
  // console.log(prefectures);

  return c.json({ prefectures: prefectures });
});

/**
 * GET /list/facilities
 * アプリデータバケットの施設一覧を返す
 * @param c HTTPリクエスト
 * @returns {{facilities: string[]}} 県一覧
 */
app.get("/list/:prefecture/facilities", async (c) => {
  const prefecture = c.req.param("prefecture");

  const client = new S3Client({});
  const objects = await client.send(
    new ListObjectsV2Command({
      Bucket: appdata_bucket,
      Prefix: `${prefecture}/`,
      Delimiter: "/",
    })
  );

  const facilities: string[] = [];

  if (objects.CommonPrefixes !== undefined) {
    objects.CommonPrefixes.map((value) => {
      if (value.Prefix) {
        const facility = value.Prefix.replace("/", "");
        facilities.push(facility);
      }
    });
  }

  console.log(objects.CommonPrefixes);
  console.log(facilities);

  return c.json({ facilities: facilities });
});

export const handler = handle(app);
