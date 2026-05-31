import { describe, it, expect } from 'vitest';
import { filterBarangays, filterWorkers, FilterableWorker } from './filters';
import type { WorkerFilters } from '../types';

describe('filterBarangays', () => {
  const sampleBarangays = [
    'Bagong Pag-Asa',
    'Batasan Hills',
    'Commonwealth',
    'Holy Spirit',
    'Payatas',
    'Tandang Sora',
    'Bagumbayan',
  ];

  it('returns the full list when search string is empty', () => {
    const result = filterBarangays('', sampleBarangays);
    expect(result).toEqual(sampleBarangays);
  });

  it('filters by case-insensitive substring match with 1 character', () => {
    const result = filterBarangays('b', sampleBarangays);
    expect(result).toEqual(['Bagong Pag-Asa', 'Batasan Hills', 'Bagumbayan']);
  });

  it('filters by multi-character substring', () => {
    const result = filterBarangays('bag', sampleBarangays);
    expect(result).toEqual(['Bagong Pag-Asa', 'Bagumbayan']);
  });

  it('is case-insensitive', () => {
    const result = filterBarangays('HOLY', sampleBarangays);
    expect(result).toEqual(['Holy Spirit']);
  });

  it('matches substrings in the middle of names', () => {
    const result = filterBarangays('atas', sampleBarangays);
    expect(result).toEqual(['Batasan Hills', 'Payatas']);
  });

  it('returns empty array when no names match', () => {
    const result = filterBarangays('xyz', sampleBarangays);
    expect(result).toEqual([]);
  });

  it('returns the full list for an empty array input', () => {
    const result = filterBarangays('test', []);
    expect(result).toEqual([]);
  });
});


describe('filterWorkers', () => {
  const sampleWorkers: (FilterableWorker & { id: string })[] = [
    { id: '1', verificationStatus: 'verified', barangay: 'Bagong Pag-Asa', skills: ['plumber', 'electrician'] },
    { id: '2', verificationStatus: 'verified', barangay: 'Batasan Hills', skills: ['carpenter'] },
    { id: '3', verificationStatus: 'pending', barangay: 'Bagong Pag-Asa', skills: ['plumber'] },
    { id: '4', verificationStatus: 'verified', barangay: 'Commonwealth', skills: ['mason', 'laborer'] },
    { id: '5', verificationStatus: 'rejected', barangay: 'Batasan Hills', skills: ['electrician'] },
    { id: '6', verificationStatus: 'verified', barangay: 'Bagong Pag-Asa', skills: ['carpenter', 'mason'] },
  ];

  it('returns only verified workers when no filters are active', () => {
    const filters: WorkerFilters = {};
    const result = filterWorkers(sampleWorkers, filters);
    expect(result.map(w => w.id)).toEqual(['1', '2', '4', '6']);
  });

  it('excludes non-verified workers regardless of filters', () => {
    const filters: WorkerFilters = {};
    const result = filterWorkers(sampleWorkers, filters);
    result.forEach(worker => {
      expect(worker.verificationStatus).toBe('verified');
    });
  });

  it('filters by barangay when barangay filter is set', () => {
    const filters: WorkerFilters = { barangay: 'Bagong Pag-Asa' };
    const result = filterWorkers(sampleWorkers, filters);
    expect(result.map(w => w.id)).toEqual(['1', '6']);
  });

  it('filters by categories when category filters are set', () => {
    const filters: WorkerFilters = { categories: ['plumber'] };
    const result = filterWorkers(sampleWorkers, filters);
    expect(result.map(w => w.id)).toEqual(['1']);
  });

  it('matches workers with at least one skill in selected categories', () => {
    const filters: WorkerFilters = { categories: ['mason', 'electrician'] };
    const result = filterWorkers(sampleWorkers, filters);
    expect(result.map(w => w.id)).toEqual(['1', '4', '6']);
  });

  it('applies both barangay and category filters together', () => {
    const filters: WorkerFilters = { barangay: 'Bagong Pag-Asa', categories: ['carpenter'] };
    const result = filterWorkers(sampleWorkers, filters);
    expect(result.map(w => w.id)).toEqual(['6']);
  });

  it('returns empty array when no workers match all criteria', () => {
    const filters: WorkerFilters = { barangay: 'Commonwealth', categories: ['plumber'] };
    const result = filterWorkers(sampleWorkers, filters);
    expect(result).toEqual([]);
  });

  it('returns empty array when input workers array is empty', () => {
    const filters: WorkerFilters = {};
    const result = filterWorkers([], filters);
    expect(result).toEqual([]);
  });

  it('ignores empty categories array (treats as no filter)', () => {
    const filters: WorkerFilters = { categories: [] };
    const result = filterWorkers(sampleWorkers, filters);
    expect(result.map(w => w.id)).toEqual(['1', '2', '4', '6']);
  });

  it('preserves generic type information', () => {
    interface ExtendedWorker extends FilterableWorker {
      id: string;
      name: string;
    }
    const workers: ExtendedWorker[] = [
      { id: '1', name: 'Juan', verificationStatus: 'verified', barangay: 'Payatas', skills: ['plumber'] },
    ];
    const result = filterWorkers(workers, {});
    expect(result[0].name).toBe('Juan');
  });
});
