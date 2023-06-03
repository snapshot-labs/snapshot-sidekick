import mysql from 'mysql';
// @ts-ignore
import Pool from 'mysql/lib/Pool';
// @ts-ignore
import Connection from 'mysql/lib/Connection';
import bluebird from 'bluebird';
import { ConnectionString } from 'connection-string';

type values = string | number | boolean | null;
export type SqlRow = Record<string, values>;
type SqlQueryArgs = values | Record<string, values>;

interface PromisedPool {
  queryAsync: (query: string, args?: SqlQueryArgs | SqlQueryArgs[]) => Promise<SqlRow[]>;
  endAsync: () => Promise<any>;
}

const config = new ConnectionString(process.env.DATABASE_URL || '');
bluebird.promisifyAll([Pool, Connection]);

const db: PromisedPool = mysql.createPool({
  ...config,
  host: config.hosts?.[0].name,
  port: config.hosts?.[0].port,
  connectionLimit: parseInt(process.env.CONNECTION_LIMIT || '10'),
  multipleStatements: true,
  connectTimeout: 60e3,
  acquireTimeout: 60e3,
  timeout: 60e3,
  charset: 'utf8mb4',
  database: config.path?.[0]
}) as mysql.Pool & PromisedPool;

export default db;
