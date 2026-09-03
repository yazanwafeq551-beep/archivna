import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
} from '@nestjs/common';

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function isPlainObject(obj: any): boolean {
  if (obj === null || typeof obj !== 'object') return false;
  if (Buffer.isBuffer(obj)) return false;
  if (obj instanceof Date) return false;
  if (obj instanceof RegExp) return false;
  return true;
}

function transformKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  if (isPlainObject(obj)) {
    return Object.keys(obj).reduce((acc: any, key: string) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = transformKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

@Injectable()
export class CamelToSnakePipe implements PipeTransform {
  transform(value: any, _metadata: ArgumentMetadata): any {
    if (value && typeof value === 'object') {
      return transformKeys(value);
    }
    return value;
  }
}
