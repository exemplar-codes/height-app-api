import "dotenv/config";

/**
 * ENV keys: MONGODB_PASSWORD
 */
const database_password = process.env["MONGODB_PASSWORD"];

import { MongoClient, ObjectId } from "mongodb";

let _db;

export const mongoConnect = async (callback = () => {}) => {
  try {
    const client = await MongoClient.connect(
      `mongodb+srv://sanjarcode-nodejscompleteguide:${database_password}@cluster-nodejscompleteg.nuohpop.mongodb.net/?retryWrites=true&w=majority`
    ); // Copied from the site (SRV address)

    console.log("Connected to MongoDB cloud!");
    _db = client.db();
    // callback(client);
  } catch (error) {
    console.log(error);
  }
};

export const getDb = () => {
  if (_db) {
    return _db;
  }
  throw "No database found!";
};

/**
 * irrelevant to the shop, just for check
 * Is idempotent, makes change only if database is empty
 */
//
export const log = async (obj, collectionName = "height-api-logs") => {
  const db = getDb();

  const payload = { createdtAt: new Date().toISOString(), ...obj };

  const createdResult = await db
    .collection(collectionName)
    .insertOne({ createdtAt: new Date().toISOString(), ...payload });

  return createdResult;
};

export const get = async (_id, collectionName = "height-api-logs") => {
  const db = getDb();

  try {
    const result = await db
      .collection(collectionName)
      .findOne({ _id: new ObjectId(_id) });
    return result;
  } catch (error) {
    return error;
  }
};

export const update = async (
  criteria = {},
  payload = {},
  arrayFilters = {},
  collectionName = "height-api-logs"
) => {
  const db = getDb();

  try {
    const result = await db
      .collection(collectionName)
      .updateOne(
        { ...criteria, _id: new ObjectId(criteria._id) },
        payload,
        arrayFilters
      );
    // console.log({ result });
    return result;
  } catch (error) {
    // console.log(error, { _id: criteria._id });
    return error;
  }
};

// await mongoConnect(); // connect to DB

// export default { mongoConnect, getDb, log };
