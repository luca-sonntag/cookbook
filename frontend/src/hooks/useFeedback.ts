import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../api';
import type { FeedbackContext } from '../utils/feedbackContext';

export interface SubmitFeedbackInput {
  type: 'bug' | 'idea';
  message: string;
  context: FeedbackContext;
  /** Optional compressed screenshots as JPEG data-URLs. */
  screenshots?: string[];
}

export function useFeedback() {
  const { getAccessToken } = useAuth();

  const submitFeedback = useCallback(
    async (input: SubmitFeedbackInput): Promise<{ success: boolean; error?: string }> => {
      try {
        const token = await getAccessToken();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(apiUrl('/api/feedback'), {
          method: 'POST',
          headers,
          body: JSON.stringify(input),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          return { success: true };
        }
        return { success: false, error: data.error || 'Failed to submit feedback' };
      } catch (err: any) {
        console.error('Error submitting feedback:', err);
        return { success: false, error: err.message || 'Network error' };
      }
    },
    [getAccessToken],
  );

  return { submitFeedback };
}
