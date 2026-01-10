"use server";

/**
 * 文件存储 Server Actions
 * 通过预签名URL上传文件到S3兼容存储
 * 密钥仅存于服务端，安全防泄露
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// S3 客户端配置（仅在服务端）
const s3Client = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  forcePathStyle: true, // RustFS/MinIO 需要
});

const S3_BUCKET = process.env.S3_BUCKET || "aigccloud";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT || "http://localhost:9000";

/**
 * 生成文件上传预签名URL
 * @param isPublic - 是否公开访问（头像等场景返回预签名下载URL）
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string = "application/octet-stream",
  prefix: string = "uploads",
  userId?: string,
  isPublic: boolean = false
): Promise<{
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
  expiresIn: number;
}> {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const uniqueId = Math.random().toString(36).substring(2, 10);
  const ext = filename.includes(".") ? filename.split(".").pop() : "";
  
  const fileKey = userId 
    ? `${prefix}/${userId}/${timestamp}/${uniqueId}${ext ? `.${ext}` : ""}`
    : `${prefix}/${timestamp}/${uniqueId}${ext ? `.${ext}` : ""}`;

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileKey,
    ContentType: contentType,
  });

  const expiresIn = 3600; // 1小时
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
  // 如果是公开文件，返回预签名下载URL（测试用：1分钟）
  let fileUrl: string;
  if (isPublic) {
    const downloadCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
    });
    fileUrl = await getSignedUrl(s3Client, downloadCommand, { expiresIn: 120 }); // 2分钟
  } else {
    fileUrl = `${S3_PUBLIC_URL}/${S3_BUCKET}/${fileKey}`;
  }

  return {
    uploadUrl,
    fileUrl,
    fileKey,
    expiresIn,
  };
}

/**
 * 生成文件下载预签名URL（私有文件）
 * @param expiresInSeconds - 有效期，默认2分钟
 */
export async function getPresignedDownloadUrl(
  fileKey: string,
  expiresInSeconds: number = 120
): Promise<{
  downloadUrl: string;
  expiresIn: number;
  expiresAt: number; // 过期时间戳
}> {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: fileKey,
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
  const expiresAt = Date.now() + expiresInSeconds * 1000;

  return {
    downloadUrl,
    expiresIn: expiresInSeconds,
    expiresAt,
  };
}

/**
 * 批量生成上传预签名URL
 */
export async function getBatchPresignedUploadUrls(
  files: Array<{ filename: string; contentType?: string }>,
  prefix: string = "uploads",
  userId?: string
): Promise<Array<{
  filename: string;
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
}>> {
  const results = await Promise.all(
    files.map(async (file) => {
      const result = await getPresignedUploadUrl(
        file.filename,
        file.contentType || "application/octet-stream",
        prefix,
        userId
      );
      return {
        filename: file.filename,
        ...result,
      };
    })
  );
  return results;
}

/**
 * 删除文件
 */
export async function deleteFile(fileKey: string, userId?: string): Promise<boolean> {
  // 安全检查：如果提供了userId，验证文件归属
  if (userId && !fileKey.includes(`/${userId}/`)) {
    throw new Error("无权删除此文件");
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("删除文件失败:", error);
    return false;
  }
}

/**
 * 上传文件（完整流程）
 * 1. 获取预签名URL
 * 2. 返回上传信息供客户端使用
 */
export async function prepareFileUpload(
  filename: string,
  contentType: string,
  prefix: string = "uploads",
  userId?: string
) {
  return getPresignedUploadUrl(filename, contentType, prefix, userId);
}

/**
 * 客户端上传完成后，保存文件信息到Parse
 */
export async function saveFileRecord(
  userId: string,
  fileUrl: string,
  fileKey: string,
  filename: string,
  contentType: string,
  size?: number
) {
  // 这里可以调用Parse Server保存文件记录
  // 返回的fileUrl可以直接存储到Parse的相关字段中
  return {
    success: true,
    fileUrl,
    fileKey,
  };
}
