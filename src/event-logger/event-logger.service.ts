import { Injectable } from '@nestjs/common';
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { EventType } from './types';
import { cloneDeep, values } from 'lodash';
import { GameErrors } from '../common/errors';

interface Options {
  emit: string[];
}

@Injectable()
export class EventLoggerService {
  private activeGameFiles: {
    [key: string]: { folder: string; filePath: string };
  } = {};
  private createFile(gameId: string) {
    const date = moment().format('YYYY-MM-DD');
    const time = moment().format('HH:MM:SS-');
    const datePath = path.join(__dirname, '../../../', 'logs/', date);
    if (!fs.existsSync(datePath)) {
      fs.mkdirSync(datePath);
    }
    const filePath = path.join(
      __dirname,
      '../../../',
      'logs/',
      `${date}/` + time + gameId + '.json',
    );
    fs.writeFileSync(filePath, JSON.stringify([]));
    this.activeGameFiles[gameId] = {
      folder: date,
      filePath,
    };
  }
  saveGameLogs(
    payload: {
      gameId: string;
      event: EventType | GameErrors;
      data: any;
    },
    options: Partial<Options> = {},
  ) {
    if (!payload) return;
    const { gameId, event, data } = payload;
    if (!this.activeGameFiles[gameId]) {
      this.createFile(gameId);
    }
    const filePath = this.activeGameFiles[gameId].filePath;

    const loadedFile = fs.readFileSync(filePath) + '';
    const loadedFileData = JSON.parse(loadedFile);

    const clonedData = cloneDeep(data);

    if (options.emit) {
      options.emit.forEach((prop) => {
        clonedData[prop] = undefined;
      });
    }

    loadedFileData.push({
      [event]: clonedData,
    });
    fs.writeFileSync(
      this.activeGameFiles[gameId].filePath,
      JSON.stringify(loadedFileData),
    );
  }
}
