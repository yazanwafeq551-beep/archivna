import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

const FIELD_MAP: Record<string, string> = {
  institution_name: 'institutionName',
  avatar_path: 'avatar',
  full_name: 'fullName',
  password_hash: 'passwordHash',
  account_status: 'accountStatus',
  preferred_language: 'preferredLanguage',
  text_size: 'textSize',
  reduced_motion: 'reducedMotion',
  last_login_at: 'lastLoginAt',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  published_at: 'publishedAt',
  owner_id: 'ownerId',
  owner_display_name: 'ownerDisplayName',
  title_ar: 'titleAr',
  title_en: 'titleEn',
  alternative_title_ar: 'alternativeTitleAr',
  alternative_title_en: 'alternativeTitleEn',
  reference_number: 'referenceNumber',
  description_ar: 'descriptionAr',
  description_en: 'descriptionEn',
  creator_name: 'creatorName',
  collection_name: 'collectionName',
  material_type: 'materialType',
  access_level: 'accessLevel',
  date_text: 'dateText',
  date_from: 'dateFrom',
  date_to: 'dateTo',
  rights_statement: 'rightsStatement',
  file_size: 'fileSize',
  file_type: 'fileType',
  mime_type: 'mimeType',
  original_filename: 'originalFilename',
  thumbnail_url: 'thumbnailUrl',
  is_revoked: 'isRevoked',
  expires_at: 'expiresAt',
  unread_count: 'unreadCount',
  refresh_token: 'refreshToken',
  access_token: 'accessToken',
  user_id: 'userId',
  archive_record_id: 'archiveRecordId',
  subject_text: 'subjectText',
  ocr_text_ar: 'ocrTextAr',
  ocr_text_en: 'ocrTextEn',
  total_pages: 'totalPages',
  page_size: 'pageSize',
  image_size: 'imageSize',
  max_image_size: 'maxImageSize',
  allowed_types: 'allowedTypes',
  require_approval: 'requireApproval',
  allow_registration: 'allowRegistration',
  maintenance_mode: 'maintenanceMode',
  site_title: 'siteTitle',
  site_description: 'siteDescription',
  contact_email: 'contactEmail',
  default_language: 'defaultLanguage',
  enable_notifications: 'enableNotifications',
  email_notifications: 'emailNotifications',
  push_notifications: 'pushNotifications',
  token_type: 'tokenType',
};

function snakeToCamel(str: string): string {
  if (str.startsWith('_')) return str;
  if (FIELD_MAP[str]) return FIELD_MAP[str];
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
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
      const camelKey = snakeToCamel(key);
      acc[camelKey] = transformKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

@Injectable()
export class SnakeToCamelInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => transformKeys(data)),
    );
  }
}
