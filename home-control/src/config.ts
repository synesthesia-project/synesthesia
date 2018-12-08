import * as path from 'path';
import * as fs from 'fs';

const CONFIG_FILE = path.join(__dirname, '../config.json');

export interface Config {
  hueHost: string;
  hueToken: string;
}

export function getConfig() {
  return new Promise<Config | false>((resolve, reject) => {
    fs.readFile(CONFIG_FILE, function (err, data) {
    if (err) {
      console.error(err);
      resolve(false);
      return;
    }
    const configString = data.toString();
    const config = JSON.parse(configString);
    console.log('Config:', config);
    // TODO: validate
    resolve(config);
  });
  });
}
