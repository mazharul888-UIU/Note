# Mazharul Islam Sami Notes

A notes library organized by trimester and course. The owner signs in with a secret code to add notes and files, then chooses which notes to publish. Visitors can read published notes and download their attachments without signing in.

## Storage

Notes and course data are saved as a private JSON object in Vercel Blob. Uploaded files are separate private Blob objects. The app checks the note's current visibility before serving a file. Removing a file or note also removes its stored attachments.

Each note supports up to 20 files, 50 MB per file. The JSON export contains note data and file references; it does not contain the file contents. Files remain in the private Blob store. Older notes without attachments continue to load, and the owner can import notes from the original browser storage once.

## Run locally

```sh
npm install
npm run dev
```

Set `OWNER_CODE_HASH` to the lowercase SHA-256 hex digest of the owner code, `SESSION_SECRET` to a long random value, and `BLOB_READ_WRITE_TOKEN` to a private Vercel Blob store token. Configure the same variables in Vercel for production.

## Verify

```sh
npm run build
node --experimental-strip-types --test tests/privacy.test.mjs
```
