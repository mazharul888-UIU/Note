import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isOwner, sameOrigin } from "@/lib/auth";
import { ATTACHMENT_PATH, MAX_ATTACHMENT_SIZE } from "@/lib/notes";

export async function POST(request: Request) {
  let body: HandleUploadBody;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid upload request." }, { status: 400 }); }
  if (body.type === "blob.generate-client-token" && (!sameOrigin(request) || !await isOwner())) return Response.json({ error: "Owner access required." }, { status: 401 });
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async pathname => {
        if (!await isOwner() || !ATTACHMENT_PATH.test(pathname)) throw new Error("Upload not allowed.");
        return { addRandomSuffix: false, maximumSizeInBytes: MAX_ATTACHMENT_SIZE, validUntil: Date.now() + 15 * 60 * 1000 };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Upload failed." }, { status: 400 });
  }
}
