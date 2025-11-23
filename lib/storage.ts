import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data/submissions.json');

type SubmissionData = {
  rsvps: Array<{
    name: string;
    guests: string;
    guestNames: string;
    favoriteSong: string;
    isAttending: boolean;
    timestamp: string;
  }>;
  messages: Array<{
    name: string;
    message: string;
    timestamp: string;
  }>;
};

export async function saveRSVP(data: Omit<SubmissionData['rsvps'][0], 'timestamp'>) {
  const existingData = await readDataFile();
  
  existingData.rsvps.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  await writeDataFile(existingData);
}

export async function saveMessage(data: Omit<SubmissionData['messages'][0], 'timestamp'>) {
  const existingData = await readDataFile();
  
  existingData.messages.push({
    ...data,
    timestamp: new Date().toISOString()
  });
  
  await writeDataFile(existingData);
}

export async function getAllSubmissions() {
  return readDataFile();
}

async function readDataFile(): Promise<SubmissionData> {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return { rsvps: [], messages: [] };
    }
    throw error;
  }
}

async function writeDataFile(data: SubmissionData) {
  await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}
