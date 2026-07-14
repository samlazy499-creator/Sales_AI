import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

/**
 * Works against any S3-compatible endpoint (AWS S3, Cloudflare R2,
 * Supabase Storage's S3 API) — nothing outside this file constructs
 * S3Client directly.
 */
function getClient() {
  return new S3Client({
    region: process.env.S3_REGION ?? "ap-south-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  });
}

export async function uploadToStorage(
  organizationId: string,
  fileName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");

  const key = `${organizationId}/knowledge/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${fileName}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  return key;
}

export async function getStorageDownloadUrl(storageKey: string): Promise<string> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");

  const command = new GetObjectCommand({ Bucket: bucket, Key: storageKey });
  return getSignedUrl(getClient(), command, { expiresIn: 3600 });
}

export async function downloadFromStorage(storageKey: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not configured");

  const result = await getClient().send(new GetObjectCommand({ Bucket: bucket, Key: storageKey }));
  const chunks: Uint8Array[] = [];
  // @ts-expect-error - Body is a readable stream at runtime in Node
  for await (const chunk of result.Body) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
