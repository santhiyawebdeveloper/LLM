import { beforeAll, afterAll, afterEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { disconnectDatabase, mongoose } from '../config/database.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongoServer.getUri();
  process.env.NODE_ENV = 'test';

  const { connectDatabase } = await import('../config/database.js');
  await connectDatabase();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await disconnectDatabase();
  if (mongoServer) await mongoServer.stop();
});
