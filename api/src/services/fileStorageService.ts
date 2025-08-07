import fs from 'fs/promises';
import path from 'path';
import { PrismaClient, UploadedFile, Config } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';

const prisma = new PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export type FileType = 'torrent' | 'nfo' | 'image' | 'avatar' | 'other';

function getSubfolder(type: FileType) {
  return type + 's'; // e.g., 'torrents', 'nfos', 'images'
}

// Note: S3 config fields (s3Bucket, s3Region, s3AccessKeyId, s3SecretAccessKey) must be present in the config object.
// If using Prisma's Config type, you may need to extend it or use type assertion.

type S3Config = {
  s3Bucket?: string;
  s3Region?: string;
  s3AccessKeyId?: string;
  s3SecretAccessKey?: string;
};

function getS3Client(config: Config & S3Config) {
  if (!config?.s3Region || !config?.s3AccessKeyId || !config?.s3SecretAccessKey) {
    throw new Error('Missing S3 configuration');
  }
  return new S3Client({
    region: config.s3Region,
    credentials: {
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
    },
  });
}

export async function saveFile({
  type,
  buffer,
  ext,
  mimeType,
  config
}: {
  type: FileType,
  buffer: Buffer,
  ext: string,
  mimeType: string,
  config: Config & S3Config
}): Promise<UploadedFile> {
  if (config.storageType === 'LOCAL') {
    const subfolder = getSubfolder(type);
    const dir = path.join(UPLOAD_DIR, subfolder);
    await fs.mkdir(dir, { recursive: true });
    const filename = randomUUID() + ext;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, buffer);
    return prisma.uploadedFile.create({
      data: {
        type,
        ext,
        storageKey: path.relative(UPLOAD_DIR, filePath),
        size: buffer.length,
        mimeType,
        data: undefined
      }
    });
  }
  if (config.storageType === 'S3') {
    if (!config?.s3Bucket) throw new Error('Missing S3 bucket in config');
    const subfolder = getSubfolder(type);
    const filename = randomUUID() + ext;
    const key = `${subfolder}/${filename}`;
    const s3 = getS3Client(config);
    await s3.send(new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }));
    return prisma.uploadedFile.create({
      data: {
        type,
        ext,
        storageKey: key,
        size: buffer.length,
        mimeType,
        data: undefined
      }
    });
  }
  if (config.storageType === 'DB') {
    const file = await prisma.uploadedFile.create({
      data: {
        type,
        ext,
        storageKey: '', // Not needed for DB, can use id
        size: buffer.length,
        mimeType,
        data: buffer
      }
    });
    // Set storageKey to id for easy lookup
    await prisma.uploadedFile.update({ where: { id: file.id }, data: { storageKey: file.id } });
    return { ...file, storageKey: file.id };
  }
  throw new Error('Unsupported storage type');
}

export async function getFile({
  file,
  config
}: {
  file: UploadedFile,
  config: Config & S3Config
}): Promise<Buffer> {
  if (config.storageType === 'LOCAL') {
    const absPath = path.join(UPLOAD_DIR, file.storageKey);
    return await fs.readFile(absPath);
  }
  if (config.storageType === 'S3') {
    if (!config?.s3Bucket) throw new Error('Missing S3 bucket in config');
    const s3 = getS3Client(config);
    const res = await s3.send(new GetObjectCommand({
      Bucket: config.s3Bucket,
      Key: file.storageKey,
    }));
    // res.Body is a stream, need to convert to Buffer
    const stream = res.Body;
    if (!stream) throw new Error('No file data in S3');
    const chunks: Buffer[] = [];
    for await (const chunk of stream as any) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  if (config.storageType === 'DB') {
    if (!file.data) throw new Error('No file data in DB');
    return Buffer.from(file.data);
  }
  throw new Error('Unsupported storage type');
}

export async function deleteFile({
  file,
  config
}: {
  file: UploadedFile,
  config: Config & S3Config
}): Promise<void> {
  if (config.storageType === 'LOCAL') {
    const absPath = path.join(UPLOAD_DIR, file.storageKey);
    await fs.unlink(absPath).catch(() => {});
    await prisma.uploadedFile.delete({ where: { id: file.id } });
    return;
  }
  if (config.storageType === 'S3') {
    if (!config?.s3Bucket) throw new Error('Missing S3 bucket in config');
    const s3 = getS3Client(config);
    await s3.send(new DeleteObjectCommand({
      Bucket: config.s3Bucket,
      Key: file.storageKey,
    }));
    await prisma.uploadedFile.delete({ where: { id: file.id } });
    return;
  }
  if (config.storageType === 'DB') {
    await prisma.uploadedFile.delete({ where: { id: file.id } });
    return;
  }
  throw new Error('Unsupported storage type');
} 