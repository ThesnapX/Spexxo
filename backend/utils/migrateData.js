// backend/utils/migrateData.js
//
// Migrates MongoDB data from the current/test database to the production
// database.
//
// Required .env variables:
// SOURCE_MONGODB_URI=mongodb://.../test
// TARGET_MONGODB_URI=mongodb://.../spexxo
//
// Run:
// npm run migrate
//
// Optional:
// node utils/migrateData.js --replace
//
// --replace clears each target collection before copying.
//
// IMPORTANT:
// - MongoDB _id values are preserved.
// - This keeps references between Users, Products, Orders, etc.
// - Credentials are NOT hard-coded in this file.
// - Keep your .env file private.

import mongoose from "mongoose";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const BATCH_SIZE = 500;
const REPLACE_TARGET = process.argv.includes("--replace");

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const closeConnections = async (source, target) => {
  try {
    if (source) await source.close();
  } catch {}

  try {
    if (target) await target.close();
  } catch {}
};

const getDatabaseName = (uri) => {
  try {
    // Remove query string
    const withoutQuery = uri.split("?")[0];

    // Get everything after the final "/"
    const databaseName = withoutQuery
      .substring(withoutQuery.lastIndexOf("/") + 1)
      .trim();

    if (!databaseName) {
      throw new Error(
        "Database name is missing from MongoDB URI. " +
          "Make sure the URI ends with /test or /spexxo.",
      );
    }

    return databaseName;
  } catch (error) {
    throw new Error(`Invalid MongoDB URI: ${error.message}`);
  }
};

const migrateData = async () => {
  let sourceConn = null;
  let targetConn = null;

  try {
    const sourceUri = process.env.SOURCE_MONGODB_URI;
    const targetUri = process.env.TARGET_MONGODB_URI;

    // ============================================================
    // CHECK ENVIRONMENT VARIABLES
    // ============================================================

    if (!sourceUri) {
      throw new Error("SOURCE_MONGODB_URI is missing from your .env file.");
    }

    if (!targetUri) {
      throw new Error("TARGET_MONGODB_URI is missing from your .env file.");
    }

    const sourceDbName = getDatabaseName(sourceUri);
    const targetDbName = getDatabaseName(targetUri);

    if (sourceDbName === targetDbName) {
      throw new Error(
        `Source and target are the same database (${sourceDbName}). Migration stopped.`,
      );
    }

    // ============================================================
    // START
    // ============================================================

    console.log("\n========================================");
    console.log("       SPEXXO DATABASE MIGRATION");
    console.log("========================================\n");

    console.log(`Source database : ${sourceDbName}`);
    console.log(`Target database : ${targetDbName}`);
    console.log(`Migration mode  : ${REPLACE_TARGET ? "REPLACE" : "UPSERT"}`);

    // ============================================================
    // CONFIRMATION
    // ============================================================

    if (REPLACE_TARGET) {
      console.log("\n⚠️ WARNING: --replace will DELETE existing documents");
      console.log("from the target collections before copying.\n");

      const answer = await ask(
        `Type MIGRATE ${sourceDbName} TO ${targetDbName} to continue: `,
      );

      if (answer !== `MIGRATE ${sourceDbName} TO ${targetDbName}`) {
        console.log("\n❌ Migration cancelled.");
        return;
      }
    } else {
      const answer = await ask(
        "\nContinue with migration? Type YES to continue: ",
      );

      if (answer.toUpperCase() !== "YES") {
        console.log("\n❌ Migration cancelled.");
        return;
      }
    }

    // ============================================================
    // CONNECT TO SOURCE
    // ============================================================

    console.log("\n🔗 Connecting to source database...");

    sourceConn = await mongoose
      .createConnection(sourceUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 60000,
        family: 4,
      })
      .asPromise();

    console.log(`✅ Source connected: ${sourceConn.db.databaseName}`);

    // ============================================================
    // CONNECT TO TARGET
    // ============================================================

    console.log("\n🔗 Connecting to target database...");

    targetConn = await mongoose
      .createConnection(targetUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 60000,
        family: 4,
      })
      .asPromise();

    console.log(`✅ Target connected: ${targetConn.db.databaseName}`);

    // ============================================================
    // FIND COLLECTIONS
    // ============================================================

    const sourceCollections = await sourceConn.db.listCollections().toArray();

    const collections = sourceCollections.filter(
      (collection) =>
        !collection.name.startsWith("system.") &&
        collection.type === "collection",
    );

    if (collections.length === 0) {
      console.log("\n❌ No user collections found in source database.");

      return;
    }

    console.log(`\n📋 Found ${collections.length} collections:\n`);

    collections.forEach((collection) => {
      console.log(`   • ${collection.name}`);
    });

    // ============================================================
    // MIGRATION STATS
    // ============================================================

    let totalDocuments = 0;
    let successfulCollections = 0;
    let failedCollections = 0;

    // ============================================================
    // MIGRATE EACH COLLECTION
    // ============================================================

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      const sourceCollection = sourceConn.db.collection(collectionName);

      const targetCollection = targetConn.db.collection(collectionName);

      console.log("\n----------------------------------------");
      console.log(`📦 Migrating: ${collectionName}`);
      console.log("----------------------------------------");

      try {
        const documentCount = await sourceCollection.countDocuments();

        console.log(`Source documents: ${documentCount}`);

        // ========================================================
        // REPLACE MODE
        // ========================================================

        if (REPLACE_TARGET) {
          await targetCollection.deleteMany({});

          console.log("🗑️ Existing target documents removed.");
        }

        // ========================================================
        // COPY DOCUMENTS IN BATCHES
        // ========================================================

        const cursor = sourceCollection.find({});

        let batch = [];
        let copied = 0;

        for await (const document of cursor) {
          batch.push(document);

          if (batch.length >= BATCH_SIZE) {
            if (REPLACE_TARGET) {
              await targetCollection.insertMany(batch, {
                ordered: false,
              });
            } else {
              const operations = batch.map((doc) => ({
                replaceOne: {
                  filter: {
                    _id: doc._id,
                  },
                  replacement: doc,
                  upsert: true,
                },
              }));

              await targetCollection.bulkWrite(operations, {
                ordered: false,
              });
            }

            copied += batch.length;

            batch = [];

            console.log(`Progress: ${copied}/${documentCount}`);
          }
        }

        // ========================================================
        // COPY REMAINING DOCUMENTS
        // ========================================================

        if (batch.length > 0) {
          if (REPLACE_TARGET) {
            await targetCollection.insertMany(batch, {
              ordered: false,
            });
          } else {
            const operations = batch.map((doc) => ({
              replaceOne: {
                filter: {
                  _id: doc._id,
                },
                replacement: doc,
                upsert: true,
              },
            }));

            await targetCollection.bulkWrite(operations, {
              ordered: false,
            });
          }

          copied += batch.length;
        }

        // ========================================================
        // COPY INDEXES
        // ========================================================

        console.log("🔧 Checking indexes...");

        const sourceIndexes = await sourceCollection.listIndexes().toArray();

        for (const index of sourceIndexes) {
          // MongoDB automatically creates _id index.
          if (index.name === "_id_") {
            continue;
          }

          try {
            await targetCollection.createIndex(index.key, {
              name: index.name,
              unique: index.unique,
              sparse: index.sparse,
              expireAfterSeconds: index.expireAfterSeconds,
              partialFilterExpression: index.partialFilterExpression,
              collation: index.collation,
            });
          } catch (indexError) {
            console.log(`Index note (${index.name}): ${indexError.message}`);
          }
        }

        // ========================================================
        // VERIFY TARGET
        // ========================================================

        const targetCount = await targetCollection.countDocuments();

        console.log(`✅ Documents copied/upserted: ${copied}`);

        console.log(`✅ Target documents: ${targetCount}`);

        console.log(`✅ ${collectionName} migration successful`);

        totalDocuments += copied;
        successfulCollections++;
      } catch (collectionError) {
        failedCollections++;

        console.error(`❌ Failed: ${collectionName}`);

        console.error(collectionError.message);
      }
    }

    // ============================================================
    // FINAL RESULT
    // ============================================================

    console.log("\n========================================");
    console.log("        MIGRATION COMPLETE");
    console.log("========================================\n");

    console.log(`Collections successful : ${successfulCollections}`);

    console.log(`Collections failed     : ${failedCollections}`);

    console.log(`Documents copied       : ${totalDocuments}`);

    console.log(`Source                 : ${sourceDbName}`);

    console.log(`Target                 : ${targetDbName}`);

    // ============================================================
    // RESULT
    // ============================================================

    if (failedCollections > 0) {
      console.log("\n⚠️ Some collections failed.");

      console.log("DO NOT delete the source database yet.");

      process.exitCode = 1;
    } else {
      console.log("\n✅ All collections migrated successfully.");

      console.log(
        "Verify the production database before deleting the test database.",
      );
    }
  } catch (error) {
    console.error("\n❌ MIGRATION FAILED:");
    console.error(error.message);

    process.exitCode = 1;
  } finally {
    await closeConnections(sourceConn, targetConn);
  }
};

migrateData();
