import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const cloudinaryFolder =
  process.env.CLOUDINARY_UPLOAD_FOLDER ??
  "sfruttare/produtos";

function assertCloudinaryConfig() {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      "Credenciais do Cloudinary nao configuradas."
    );
  }
}

type UploadProdutoImageResult = {
  url: string;
  publicId: string;
};

export async function uploadProdutoImage(
  file: File
): Promise<UploadProdutoImageResult | null> {
  if (!file.size) {
    return null;
  }

  assertCloudinaryConfig();

  const bytes =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: cloudinaryFolder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          if (
            !result?.secure_url ||
            !result.public_id
          ) {
            reject(
              new Error(
                "Cloudinary nao retornou os dados esperados."
              )
            );
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

    stream.end(buffer);
  });
}

export async function deleteProdutoImage(
  publicId: string
) {
  assertCloudinaryConfig();

  return cloudinary.uploader.destroy(
    publicId
  );
}
