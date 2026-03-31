import { SPORTS } from '@/lib/wearTear';

export const POSITIONS_BY_SPORT: Record<(typeof SPORTS)[number], string[]> = {
  Basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
  Football: ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'Safety', 'K/P'],
  Soccer: ['GK', 'CB', 'LB', 'RB', 'CM', 'CAM', 'CDM', 'LW', 'RW', 'ST'],
  Gym: ['N/A'],
  Other: ['N/A'],
};
