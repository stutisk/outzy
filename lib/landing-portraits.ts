/** Small Unsplash portraits for marketing stacks (not user data). */
function portrait(photoId: string) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=96&h=96&q=80`;
}

export const LANDING_PORTRAIT_SETS = [
  [
    portrait("photo-1494790108377-be9c29b29330"),
    portrait("photo-1507003211169-0a1dd7228f2d"),
    portrait("photo-1438761681033-6461ffad8d80"),
  ],
  [
    portrait("photo-1534528741775-53994a69daeb"),
    portrait("photo-1500648767791-00dcc994a43e"),
  ],
  [
    portrait("photo-1544005313-94ddf0286df2"),
    portrait("photo-1472099645785-5658abf4ff4e"),
    portrait("photo-1517841905240-472988babdf9"),
  ],
] as const;
