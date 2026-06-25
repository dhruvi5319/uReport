import { apiClient } from './client';

export type JobName = 'digest-notifications' | 'auto-close' | 'audit' | 'geo-cluster';

export interface JobRunResponse {
  status: string;
  jobName: string;
  triggeredAt: string;
}

export const adminJobsApi = {
  run: (jobName: JobName) =>
    apiClient.post<JobRunResponse>(`/admin/jobs/${jobName}/run`).then(r => r.data),
};
