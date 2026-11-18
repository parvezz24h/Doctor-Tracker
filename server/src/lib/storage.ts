import { randomUUID } from "node:crypto";

import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";

const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_FORCE_PATH_STYLE } = env;

/** Photo uploads are available only when every storage setting is present. */
export const isStorageEnabled = Boolean(S3_ENDPOINT && S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY);

let client: S3Client | undefined;

function getClient() {
  if (!isStorageEnabled) throw new Error("Storage is not configured");
  client ??= new S3Client({
    endpoint: S3_ENDPOINT,
    region: S3_REGION,
    forcePathStyle: S3_FORCE_PATH_STYLE,
    credentials: { accessKeyId: S3_ACCESS_KEY_ID!, secretAccessKey: S3_SECRET_ACCESS_KEY! },
    // Only send checksums when an operation requires them; not every S3-compatible
    // server accepts the SDK's newer default checksum headers.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return client;
}

export function createObjectKey(prefix: string, extension: string) {
  return `${prefix}/${randomUUID()}.${extension}`;
}

export async function putObject(key: string, body: Buffer, contentType: string) {
  await getClient().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      // Keys are never reused (a new photo gets a new key), so the object never changes.
      CacheControl: "private, max-age=31536000, immutable",
    }),
  );
}

/** Best effort: a leftover object costs a few kilobytes, a failed request should not. */
export async function deleteObject(key: string) {
  try {
    await getClient().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
  } catch (error) {
    console.error(`Could not delete storage object ${key}`, error);
  }
}

const HOUR_MS = 60 * 60 * 1000;

/**
 * Presigned download link. The signing time is rounded down to the hour, so the same
 * object gets the same URL for an hour and the browser can cache the image. The link
 * stays valid for two hours, so it is always good for at least one more hour.
 */
export function getDownloadUrl(key: string) {
  const signingDate = new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS);
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), {
    expiresIn: (2 * HOUR_MS) / 1000,
    signingDate,
  });
}

/** Local development only: create the bucket if it does not exist yet. */
export async function ensureBucket() {
  const s3 = getClient();
  try {
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: S3_BUCKET }));
    console.log(`Created storage bucket ${S3_BUCKET}`);
  }
}
