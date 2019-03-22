import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: '.env' });

export interface Config {
    port: number;
    user: string;
    password: string;
    serverName: string;
    databasePort: number;
    database: string;
    log: string;
}

const config: Config = {
    port: +process.env.PORT || 3000,
    user: process.env.USERNAME,
    password: process.env.PASSWORD,
    serverName: process.env.SERVER_NAME || '127.0.0.1',
    databasePort: +process.env.DATABASE_PORT || 27017,
    database: process.env.DATABASE || 'blog-service',
    log: path.resolve(__dirname, '../logs')
};

export { config };
