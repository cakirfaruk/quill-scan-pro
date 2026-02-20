import { supabase } from '@/integrations/supabase/client';

type AnalysisType = 'tarot' | 'coffee' | 'dream' | 'palmistry' | 'horoscope' | 'birthchart' | 'numerology';

export const sendAnalysisNotification = async (
  userId: string,
  analysisType: AnalysisType,
  title: string
) => {
  try {
    const { data, error } = await supabase.functions.invoke('send-analysis-notification', {
      body: {
        userId,
        analysisType,
        title,
      },
    });

    if (error) {
      console.error('Error sending notification:', error);
      return false;
    }

    console.log('Notification sent:', data);
    return true;
  } catch (error) {
    console.error('Failed to send notification:', error);
    return false;
  }
};
