# MongoDB diagram storage

Production diagrams use MongoDB GridFS instead of Vercel Blob. Authentication
still belongs to main Vetify's OIDC provider. Storing pictures in MongoDB does
not enable shared sign-in or create a second account store.

## Set up Atlas

1. Open your MongoDB Atlas project and choose a cluster. The same cluster can
   host Anatomy and main, but use a separate `vetify_anatomy` database.
2. Under Database Access, create a dedicated database user with `readWrite` on
   `vetify_anatomy` only. This permits the initial upload. The running app only
   reads pictures, so a separate read-only user can be used for Vercel afterward.
3. Configure Atlas Network Access for your upload machine and the Vercel
   deployment's egress addresses. A connection string alone does not grant
   network access. Use your actual deployment network configuration.
4. Select Connect, Drivers, Node.js, then copy the connection string. Replace
   its username/password placeholders, URL-encoding special password characters.
5. In the ignored local `.env.prod`, replace the old Blob variables with:

   ```dotenv
   MONGODB_URI=mongodb+srv://<anatomy-user>:<encoded-password>@<cluster-host>/vetify_anatomy
   MONGODB_DATABASE=vetify_anatomy
   ANATOMY_GRIDFS_BUCKET=anatomy
   ```

   Use `.env.prod.example` as the reference. Do not put these credentials in a
   `VITE_` variable. The sample contains no real connection string or password.

## Upload the original diagrams

Restore all 15 files under `private-assets/anatomy` if they are missing. Check
the files locally without connecting to MongoDB:

```sh
npm run upload:diagrams -- --check
```

Upload them using the local `.env.prod` settings:

```sh
npm run upload:diagrams
```

The uploader checks every original SHA-256 hash before connecting, writes each
file as a GridFS stream, then downloads it and verifies the stored hash. Existing
matching files are verified and reused. Changed versions are added without
deleting older versions. Runtime reads select the latest file by upload date
and object ID. Filenames are `dog/dog-skeleton.png`, `cat/cat-digestive.png`, etc.
The bucket creates `anatomy.files` and `anatomy.chunks` automatically.
Uploads are an explicit local operation, never a build or CI step.

## Configure Vercel

In project Settings, Environment Variables, add `MONGODB_URI`,
`MONGODB_DATABASE` and `ANATOMY_GRIDFS_BUCKET` to Production, then redeploy.
The app does not use `BLOB_STORE_ID`, `BLOB_READ_WRITE_TOKEN` or
`ANATOMY_BLOB_PREFIX` anymore. You can remove those variables from the project.
Existing Blob stores and their contents are not deleted by this change.

Production uses MongoDB even when the URI is absent, so missing settings return
an error rather than reading local files. Development without a URI keeps using
the private filesystem directory. Tests use generated local PNGs or a mocked
MongoDB driver and do not connect to Atlas.

Until main's OIDC issuer/client registration is implemented and configured,
picture requests remain denied even after a successful database upload.
Verify the deployed app with actual main sign-in before declaring integration
complete. No live Atlas connection or upload was performed when adding this code.

References: [GridFS driver guide](https://www.mongodb.com/docs/drivers/node/current/crud/gridfs/),
[Atlas Node.js connection](https://www.mongodb.com/docs/atlas/driver-connection/),
[serverless connection reuse](https://www.mongodb.com/docs/atlas/manage-connections-aws-lambda/).
