import { EventEmitter } from 'events';

export interface ImportProgress {
  jobId: string;
  totalBatches: number;
  completedBatches: number;
  percentage: number;
  estimatedTimeRemaining: number; // em segundos
  status: 'processing' | 'completed' | 'error';
  startTime: number;
  message?: string;
}

class ProgressManager extends EventEmitter {
  private jobs: Map<string, ImportProgress> = new Map();

  createJob(jobId: string, totalBatches: number): void {
    this.jobs.set(jobId, {
      jobId,
      totalBatches,
      completedBatches: 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      status: 'processing',
      startTime: Date.now(),
    });
    this.emit(`progress-${jobId}`, this.jobs.get(jobId));
  }

  updateProgress(jobId: string, completedBatches: number): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.completedBatches = completedBatches;
    job.percentage = Math.round((completedBatches / job.totalBatches) * 100);

    // Calcular tempo estimado baseado no tempo médio por batch
    const elapsedTime = (Date.now() - job.startTime) / 1000; // em segundos
    const avgTimePerBatch = elapsedTime / completedBatches;
    const remainingBatches = job.totalBatches - completedBatches;
    job.estimatedTimeRemaining = Math.round(avgTimePerBatch * remainingBatches);

    this.emit(`progress-${jobId}`, job);
  }

  completeJob(jobId: string, message?: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.percentage = 100;
    job.estimatedTimeRemaining = 0;
    job.message = message;

    this.emit(`progress-${jobId}`, job);

    // Limpar job após 5 minutos
    setTimeout(() => {
      this.jobs.delete(jobId);
    }, 5 * 60 * 1000);
  }

  errorJob(jobId: string, error: string): void {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'error';
    job.message = error;

    this.emit(`progress-${jobId}`, job);

    // Limpar job após 5 minutos
    setTimeout(() => {
      this.jobs.delete(jobId);
    }, 5 * 60 * 1000);
  }

  getJob(jobId: string): ImportProgress | undefined {
    return this.jobs.get(jobId);
  }

  deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
  }
}

export const progressManager = new ProgressManager();
