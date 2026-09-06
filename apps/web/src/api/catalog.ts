import type { ArchivalLevel } from '@/lib/archival-levels';
import apiClient from './client';

export interface InstitutionSummary {
  id: string;
  nameAr: string;
  nameEn?: string;
  slug: string;
  _count?: { archiveRecords: number; archivalUnits: number };
}

export interface ArchivalUnit {
  id: string;
  institutionId: string;
  parentId?: string;
  level: ArchivalLevel;
  titleAr: string;
  titleEn?: string;
  referenceCode?: string;
  children?: ArchivalUnit[];
  _count?: { records: number; children: number };
}

export const catalogApi = {
  institutions: async (): Promise<InstitutionSummary[]> =>
    (await apiClient.get('/institutions')).data,
  hierarchy: async (institutionId: string): Promise<{ institution: InstitutionSummary; units: ArchivalUnit[] }> =>
    (await apiClient.get(`/catalog/institutions/${institutionId}/hierarchy`)).data,
  createUnit: async (data: {
    institutionId: string;
    parentId?: string;
    level: ArchivalUnit['level'];
    titleAr: string;
    titleEn?: string;
    referenceCode?: string;
  }): Promise<ArchivalUnit> => (await apiClient.post('/catalog/units', data)).data,
  exportMetadata: async (recordId: string, format: 'dc' | 'ric' | 'ead') =>
    (await apiClient.get(`/catalog/records/${recordId}/export/${format}`)).data,
};

export function flattenUnits(units: ArchivalUnit[], depth = 0): Array<ArchivalUnit & { depth: number }> {
  return units.flatMap((unit) => [
    { ...unit, depth },
    ...flattenUnits(unit.children || [], depth + 1),
  ]);
}
