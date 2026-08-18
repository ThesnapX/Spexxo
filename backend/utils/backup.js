// backend/utils/backup.js

import { exec } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const backupDatabase = () => {
  const date = new Date().toISOString().split("T")[0];
  const backupFile = `backup_${date}.gz`;

  const command = `mongodump --uri="${process.env.MONGODB_URI}" --archive="${backupFile}" --gzip`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Backup failed: ${error}`);
      return;
    }
    console.log(`✅ Backup created: ${backupFile}`);
  });
};

backupDatabase();
