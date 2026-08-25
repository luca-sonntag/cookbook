import React from 'react';
import type { ExtractionJob, ProgressData, LimitStatus } from '../../types';

export type ExtractMode = 'link' | 'photo';

export interface DemoRecipe {
  name: string;
  time: string;
  imageUrl: string;
  platform: string;
  url: string;
  icon: React.ReactNode;
}

export interface ExtractFormProps {
  isActive?: boolean;
  url: string;
  setUrl: (url: string) => void;
  urlError: string;
  setUrlError?: (error: string) => void;
  validateUrl: (url: string) => boolean;
  isPending: boolean;
  handleFormSubmit: (e: React.FormEvent) => void;
  limitStatus?: LimitStatus | null;
  jobStatus: ExtractionJob['status'] | null;
  progress: ProgressData | null;
  errorBanner?: React.ReactNode;
  mode: ExtractMode;
  setMode: (mode: ExtractMode) => void;
  photos: File[];
  setPhotos: (photos: File[]) => void;
  isUploadingPhotos: boolean;
  claimRewardedCredit?: () => Promise<boolean>;
}
