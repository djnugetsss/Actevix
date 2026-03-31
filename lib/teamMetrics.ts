/** Labels used on roster / player cards (distinct from dashboard copy). */
export function getTeamLoadLabel(score: number): string {
  if (score === 0) return 'Fresh';
  if (score < 3) return 'Good';
  if (score < 5) return 'Moderate';
  if (score < 7.5) return 'High';
  return 'Critical';
}

/** Risk badge for team roster (thresholds tuned for coach view). */
export function getTeamRisk(score: number): { label: string; color: string } {
  if (score < 2) return { label: 'Fresh', color: '#4ade80' };
  if (score < 4) return { label: 'Low', color: '#4ade80' };
  if (score < 6) return { label: 'Moderate', color: '#facc15' };
  if (score < 8) return { label: 'High', color: '#fb923c' };
  return { label: 'Critical', color: '#ef4444' };
}
