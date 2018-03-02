import * as mongoDB from 'mongodb';
import { MongoClient } from 'mongodb';
import { MONGO_STRING, MONGO_DB_NAME } from './config';

export interface DatabaseActivity {
  id: number
}

export class MongoDB {
  private defaultCollection = 'activities';
  private db: mongoDB.Db;
  private client: mongoDB.MongoClient;

  constructor() {
    this.connect();
  }

  /**
   * Does an activity exist in the database, indicating that we posted it already?
   *
   * @param {DatabaseActivity} activity
   * @returns {Promise<boolean>}
   */
  public hasActivity(activity: DatabaseActivity): Promise<boolean> {
    console.log(`Trying to find activity ${activity.id} in ${this.defaultCollection}`);

    const findOptions = { id: { $eq: activity.id } };

    return database.db
      .collection(this.defaultCollection)
      .findOne(activity)
      .then((response) => {
        console.log(`Find operation result:`, response);
        return response;
      });
  }

  /**
   * Add activities to the database
   *
   * @param {Array<DatabaseActivity>} activities
   * @returns {Promise<void>}
   */
  public addActivities(activities: Array<DatabaseActivity>) {
    console.log(`Adding ${activities.length} activities to ${this.defaultCollection}`);

    return database.db
      .collection(this.defaultCollection)
      .insertMany(activities)
      .then((response) => {
        if (response && response.ops && response.ops.length > 0) {
          console.log(`Insert operation result:`, response.ops);
          return response.ops[0];
        }
      });
  }

  /**
   * Connect the instance to the database
   *
   * @memberof MongoDB
   */
  private async connect() {
    if (!MONGO_DB_NAME || !MONGO_STRING) {
      throw new Error(`MongoDB environment variables missing!`);
    }

    try {
      console.log(`Connecting to MongoDB database`);

      this.client = await MongoClient.connect(MONGO_STRING);
      this.db = this.client.db(MONGO_DB_NAME);
    } catch (e) {
      console.log('Failed to connect to MongoDB');
      console.log(e);
    }
  }
}

export const database = new MongoDB();
