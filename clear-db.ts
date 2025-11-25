require('dotenv').config({ path: '.env.local' });
import { MongoClient } from 'mongodb';

async function clearDatabase() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Missing MONGODB_URI in .env.local');
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('engagement');
    const collections = await db.collections();

    if (collections.length === 0) {
      console.log('No collections found in the database.');
      return;
    }

    console.log('The following collections will be dropped:');
    collections.forEach(c => console.log(`- ${c.collectionName}`));

    await Promise.all(collections.map((collection) => collection.drop()));

    console.log('\nAll collections have been dropped successfully.');
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    await client.close();
  }
}

clearDatabase();
