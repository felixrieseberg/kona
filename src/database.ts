import * as mongoDB from 'mongodb';
import { BB_MONGO_STRING, BB_MONGO_DB_NAME } from './config';
import { Installation } from './interfaces';
import { logger } from './logger';

export interface DatabaseActivity {
  id: number;
}

enum Collections {
  Activities = 'activities',
  Installations = 'installations'
}

const lp = `:floppy_disk: *Database*:`;

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
    logger.log(`${lp} Trying to find activity ${activity.id} in ${Collections.Activities}`);

    return this.db
      .collection(Collections.Activities)
      .findOne(activity)
      .then((response) => {
        logger.log(`${lp} Find activity operation result: ${!!response ? 'found' : 'not found'}`);
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
    logger.log(`${lp} Adding ${activities.length} activities to ${Collections.Activities}`);

    return this.db
      .collection(Collections.Activities)
      .insertMany(activities)
      .then((response) => {
        if (response && response.insertedCount !== undefined) {
          logger.log(`${lp} Wrote ${response.insertedCount} to database`);
          return response;
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
    logger.log(`${lp} Adding an installation to ${Collections.Installations}`);

    return this.db
      .collection(Collections.Installations)
      .updateOne({ 'slack.teamId': installation.slack.teamId }, { $set: installation }, { upsert: true })
      .then((response) => {
        if (response && response.result) {
          logger.log(`${lp} Insert activity operation result:`, response.result.ok);
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
    logger.log(`${lp} Getting installations`);

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
    logger.log(`${lp} Getting installation for team ${teamId}`);

    return this.db
      .collection(Collections.Installations)
      .findOne({ 'slack.teamId': teamId });
  }

  public async updateInstallation(installation: Installation): Promise<boolean> {
    if (!installation._id) {
      console.warn(`${lp} Tried to update installation, but data was missing _id field`);
      return false;
    }

    logger.log(`${lp} Updating installation`, { mongoId: installation._id, team: installation.slack.teamId });

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
      console.warn(`${lp} MongoDB environment variables missing!`);
      console.warn(`${lp} Will not attempt to setup database`);
      return;
    }

    try {
      logger.log(`${lp} Connecting to MongoDB database...`);

      this.client = await mongoDB.MongoClient.connect(BB_MONGO_STRING);
      this.db = this.client.db(BB_MONGO_DB_NAME);

      logger.log(`${lp} MongoDB connection established.`);
    } catch (error) {
      logger.log(`${lp} Failed to connect to MongoDB.`, error);
    }
  }
}

export const database = new MongoDB();
