import * as mongoDB from 'mongodb';
import { BB_MONGO_STRING, BB_MONGO_DB_NAME } from './config';
import { Installation } from './interfaces';

export interface DatabaseActivity {
  id: number;
}

enum Collections {
  Activities = 'activities',
  Installations = 'installations'
}

export class MongoDB {
  private db: mongoDB.Db;
  private client: mongoDB.MongoClient;

  constructor() {
    this.connect();
  }

  /**
   * Are we conntected?
   *
   * @returns {boolean}
   */
  public isConnected(): boolean {
    if (!BB_MONGO_DB_NAME) return false;
    return this.client.isConnected(BB_MONGO_DB_NAME);
  }

  /**
   * Does an activity exist in the database, indicating that we posted it already?
   *
   * @param {DatabaseActivity} activity
   * @returns {Promise<boolean>}
   */
  public hasActivity(activity: DatabaseActivity): Promise<boolean> {
    console.log(`Trying to find activity ${activity.id} in ${Collections.Activities}`);

    return this.db
      .collection(Collections.Activities)
      .findOne(activity)
      .then((response) => {
        console.log(`Find activity operation result:`, response);
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
    console.log(`Adding ${activities.length} activities to ${Collections.Activities}`);

    return this.db
      .collection(Collections.Activities)
      .insertMany(activities)
      .then((response) => {
        if (response && response.ops && response.ops.length > 0) {
          console.log(`Insert activity operation result:`, response.ops);
          return response.ops[0];
        }
      });
  }

  /**
   * Add an installation to the database
   *
   * @param {Installation} installation
   * @returns {Promise<void>}
   */
  public addInstallation(installation: Installation) {
    console.log(`Adding an installation to ${Collections.Installations}`);

    return this.db
      .collection(Collections.Installations)
      .insertOne(installation)
      .then((response) => {
        if (response && response.ops && response.ops.length > 0) {
          console.log(`Insert activity operation result:`, response.ops);
          return response.ops[0];
        }
      });
  }

  /**
   * Returns installations
   *
   * @returns {Promise<Array<Installation>>}
   * @memberof MongoDB
   */
  public getInstallations(): Promise<Array<Installation>> {
    console.log(`Getting installations`);

    return this.db
      .collection(Collections.Installations)
      .find({ })
      .toArray();
  }

  /**
   * Get installation for a single team
   *
   * @returns {Promise<Installation>}
   * @memberof MongoDB
   */
  public getInstallationForTeam(teamId: string): Promise<Installation | null> {
    console.log(`Getting installation for team ${teamId}`);

    return this.db
      .collection(Collections.Installations)
      .findOne({ 'slack.teamId': teamId });
  }

  public async updateInstallation(installation: Installation): Promise<boolean> {
    if (!installation._id) {
      console.warn(`Tried to update installation, but data was missing _id field`);
      return false;
    }

    console.log(`Updating installation`, { mongoId: installation._id, team: installation.slack.teamId });

    return this.db
      .collection(Collections.Installations)
      .updateOne({ _id: installation._id }, { $set: installation })
      .then((response) => !!response.result.ok);
  }

  /**
   * Connect the instance to the database
   *
   * @memberof MongoDB
   */
  private async connect() {
    if (!BB_MONGO_DB_NAME || !BB_MONGO_STRING) {
      console.warn(`MongoDB environment variables missing!`);
      console.warn(`Will not attempt to setup database`);
      return;
    }

    try {
      console.log(`Connecting to MongoDB database`);

      this.client = await mongoDB.MongoClient.connect(BB_MONGO_STRING);
      this.db = this.client.db(BB_MONGO_DB_NAME);

      console.log(`MongoDB connection established`);
    } catch (e) {
      console.log('Failed to connect to MongoDB');
      console.log(e);
    }
  }
}

export const database = new MongoDB();
