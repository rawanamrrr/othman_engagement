import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data/submissions.json');

type SubmissionData = {
  rsvps: Array<{
    name: string;
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
    // Handle empty file or invalid JSON
    const trimmedData = data.trim();
    if (!trimmedData) {
      return { rsvps: [], messages: [] };
    }
    try {
      return JSON.parse(trimmedData);
    } catch (parseError) {
      // If JSON is invalid, return default structure
      console.warn('Invalid JSON in submissions file, resetting to default structure');
      return { rsvps: [], messages: [] };
    }
  } catch (error: any) {
    // If file doesn't exist, return default structure
    if (error.code === 'ENOENT') {
      return { rsvps: [], messages: [] };
    }
    // For any other error, return default structure
    console.warn('Error reading submissions file, using default structure:', error);
    return { rsvps: [], messages: [] };
  }
}

async function writeDataFile(data: SubmissionData) {
  try {
    await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to submissions file:', error);
    throw error;
  }
}
