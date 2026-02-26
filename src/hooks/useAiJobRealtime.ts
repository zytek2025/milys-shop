import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AiJob {
    id: string;
    prompt: string;
    status: JobStatus;
    result?: string;
    created_at: string;
}

export function useAiJobRealtime() {
    const [currentJob, setCurrentJob] = useState<AiJob | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!currentJob?.id || currentJob.status === 'completed' || currentJob.status === 'failed') return;

        // 1. Realtime Subscription (Primary)
        const channel = supabase
            .channel(`job-updates-${currentJob.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'ai_jobs',
                    filter: `id=eq.${currentJob.id}`
                },
                (payload) => {
                    console.log('Realtime AI Job Update:', payload.new);
                    setCurrentJob(payload.new as AiJob);

                    if (payload.new.status === 'completed' || payload.new.status === 'failed') {
                        setLoading(false);
                        supabase.removeChannel(channel);
                    }
                }
            )
            .subscribe();

        // 2. Polling Fallback (Secondary - every 3 seconds)
        const pollInterval = setInterval(async () => {
            const { data: latestJob, error: pollError } = await supabase
                .from('ai_jobs')
                .select('*')
                .eq('id', currentJob.id)
                .single();

            if (!pollError && latestJob) {
                if (latestJob.status !== currentJob.status || latestJob.result !== currentJob.result) {
                    console.log('Polling AI Job Update:', latestJob.status);
                    setCurrentJob(latestJob as AiJob);

                    if (latestJob.status === 'completed' || latestJob.status === 'failed') {
                        setLoading(false);
                        clearInterval(pollInterval);
                        supabase.removeChannel(channel);
                    }
                }
            }
        }, 3000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(pollInterval);
        };
    }, [currentJob?.id, currentJob?.status, supabase]);

    const dispatchAiJob = async (prompt: string) => {
        try {
            setLoading(true);
            setError(null);

            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to dispatch an AI job.');

            // 2. Insert new row in `ai_jobs` table
            // This immediately gives us a job ID and a 'pending' status
            const { data: job, error: insertError } = await supabase
                .from('ai_jobs')
                .insert([{ prompt, user_id: user.id }])
                .select()
                .single();

            if (insertError) throw insertError;

            setCurrentJob(job as AiJob);

            // 3. Trigger AI Processing manually
            const response = await fetch('/api/ai/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ jobId: job.id, prompt: prompt })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("AI Processing trigger error:", errorData);
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An error occurred.');
            setLoading(false);
        }
    };

    return {
        dispatchAiJob,
        currentJob,
        loading,
        error,
        resetJob: () => {
            setCurrentJob(null);
            setError(null);
        }
    };
}
