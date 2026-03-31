import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function resolveMinioCredentials() {
  const rootUser = process.env.MINIO_ROOT_USER;
  const rootPassword = process.env.MINIO_ROOT_PASSWORD;
  const accessKey = process.env.MINIO_ACCESS_KEY;
  const secretKey = process.env.MINIO_SECRET_KEY;

  // In this project docker-compose and minio-init both use MINIO_ROOT_*.
  // If both pairs exist but conflict, prefer ROOT to avoid auth mismatch.
  if (rootUser && accessKey && rootUser !== accessKey) {
    console.warn('[S3] MINIO_ROOT_USER and MINIO_ACCESS_KEY mismatch detected, using MINIO_ROOT_USER.');
  }

  return {
    accessKeyId: rootUser || accessKey || 'minioadmin',
    secretAccessKey: rootPassword || secretKey || 'minioadmin',
  };
}

// MinIO 配置
const S3_CONFIG = {
  endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
  region: 'us-east-1', // MinIO 默认 region
  credentials: resolveMinioCredentials(),
  forcePathStyle: true, // 必须开启，MinIO 要求
};

// 创建 S3 客户端
export const s3Client = new S3Client(S3_CONFIG);

// Bucket 名称常量
export const BUCKETS = {
  MODELS: process.env.MINIO_BUCKET_3D_MODELS || '3d-models',
  THUMBNAILS: process.env.MINIO_BUCKET_THUMBNAILS || 'thumbnails',
  LOGOS: process.env.MINIO_BUCKET_LOGOS || 'logos',
  SNAPSHOTS: process.env.MINIO_BUCKET_SNAPSHOTS || 'snapshots',
} as const;

/**
 * 上传文件到 MinIO
 */
export async function uploadFile(
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
    });

    await s3Client.send(command);

    // 如果是公开 Bucket，返回公开 URL
    if (bucket === BUCKETS.MODELS || bucket === BUCKETS.THUMBNAILS) {
      return getPublicUrl(bucket, key);
    }

    // 否则返回相对路径
    return `${bucket}/${key}`;
  } catch (error) {
    console.error('Upload file error:', error);
    throw new Error(`Failed to upload file: ${key}`);
  }
}

/**
 * 获取公开访问 URL
 */
export function getPublicUrl(bucket: string, key: string): string {
  const minioUrl = process.env.NEXT_PUBLIC_MINIO_URL || 'http://localhost:9000';
  return `${minioUrl}/${bucket}/${key}`;
}

/**
 * 生成签名 URL (用于私有 Bucket)
 */
export async function getSignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600 // 默认 1 小时
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error('Get signed URL error:', error);
    throw new Error(`Failed to generate signed URL for: ${key}`);
  }
}

/**
 * 删除文件
 */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Delete file error:', error);
    throw new Error(`Failed to delete file: ${key}`);
  }
}

/**
 * 检查文件是否存在
 */
export async function fileExists(bucket: string, key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 列出文件
 */
export async function listFiles(
  bucket: string,
  prefix?: string,
  maxKeys: number = 1000
): Promise<string[]> {
  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const response = await s3Client.send(command);
    return response.Contents?.map((item) => item.Key || '') || [];
  } catch (error) {
    console.error('List files error:', error);
    return [];
  }
}

/**
 * 从 Buffer 上传 3D 模型
 */
export async function upload3DModel(
  vendorId: string,
  filename: string,
  buffer: Buffer,
  contentType?: string
): Promise<string> {
  const key = `${vendorId}/${Date.now()}-${filename}`;
  return await uploadFile(BUCKETS.MODELS, key, buffer, contentType || 'application/octet-stream');
}

/**
 * 从 Buffer 上传缩略图
 */
export async function uploadThumbnail(
  vendorId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const key = `${vendorId}/${Date.now()}-${filename}`;
  return await uploadFile(BUCKETS.THUMBNAILS, key, buffer, 'image/jpeg');
}

/**
 * 从 Buffer 上传 Logo
 */
export async function uploadLogo(
  userId: string,
  filename: string,
  buffer: Buffer
): Promise<string> {
  const key = `${userId}/${Date.now()}-${filename}`;
  return await uploadFile(BUCKETS.LOGOS, key, buffer, 'image/png');
}

/**
 * 从 Buffer 上传渲染快照
 */
export async function uploadSnapshot(
  buyerId: string,
  sessionId: string,
  buffer: Buffer
): Promise<string> {
  const key = `${buyerId}/${sessionId}-${Date.now()}.png`;
  return await uploadFile(BUCKETS.SNAPSHOTS, key, buffer, 'image/png');
}

/**
 * 解析 MinIO 路径，提取 bucket 和 key
 */
export function parseS3Path(path: string): { bucket: string; key: string } | null {
  const match = path.match(/^([^/]+)\/(.+)$/);
  if (!match) return null;
  return { bucket: match[1], key: match[2] };
}
