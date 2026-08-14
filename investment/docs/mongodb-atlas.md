# MongoDB Atlas Integration (Production)

To migrate the platform's database layer to MongoDB Atlas:

1. **Create an Atlas Cluster**
   - Log in to MongoDB Atlas and spin up a free tier cluster.
2. **Setup User Credentials**
   - Create a database user with read/write access.
3. **Configure Network Access**
   - Whitelist the Render servers IP (or `0.0.0.0/0` for dynamic routing).
4. **Copy the Connection string**
   - Select connection format: Java.
   - Example: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/trading_analysis?retryWrites=true&w=majority`
5. **Set Environment Variable**
   - Add `MONGODB_URI` environment variable containing your connection string in your Render dashboard environment values.
6. **Deployment**
   - Commit, trigger build on Render, and check logs to verify successful Atlas connection.
