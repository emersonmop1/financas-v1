"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progressManager = void 0;
const events_1 = require("events");
class ProgressManager extends events_1.EventEmitter {
    jobs = new Map();
    createJob(jobId, totalBatches) {
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
    updateProgress(jobId, completedBatches) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.completedBatches = completedBatches;
        job.percentage = Math.round((completedBatches / job.totalBatches) * 100);
        // Calcular tempo estimado baseado no tempo médio por batch
        const elapsedTime = (Date.now() - job.startTime) / 1000; // em segundos
        const avgTimePerBatch = elapsedTime / completedBatches;
        const remainingBatches = job.totalBatches - completedBatches;
        job.estimatedTimeRemaining = Math.round(avgTimePerBatch * remainingBatches);
        this.emit(`progress-${jobId}`, job);
    }
    completeJob(jobId, message) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
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
    errorJob(jobId, error) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        job.status = 'error';
        job.message = error;
        this.emit(`progress-${jobId}`, job);
        // Limpar job após 5 minutos
        setTimeout(() => {
            this.jobs.delete(jobId);
        }, 5 * 60 * 1000);
    }
    getJob(jobId) {
        return this.jobs.get(jobId);
    }
    deleteJob(jobId) {
        this.jobs.delete(jobId);
    }
}
exports.progressManager = new ProgressManager();
//# sourceMappingURL=progressManager.service.js.map