/** Row shape for public.activities (fields used in the app). */
export type ActivityRow = {
  id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  user_id: string;
  created_at?: string;
  latitude: number | null;
  longitude: number | null;
};

export type ActivityInsert = {
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
};
