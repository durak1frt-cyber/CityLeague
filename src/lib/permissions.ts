export function isAdmin(user: any): boolean {
  return user?.role === 'platform_admin';
}

export function isCaptain(user: any): boolean {
  return user?.role === 'captain';
}

export function isCoach(user: any): boolean {
  return user?.role === 'coach';
}

export function isOfficial(user: any): boolean {
  return user?.role === 'stadium_official';
}

export function canManageTeam(user: any, team: any): boolean {
  if (!user || !team) return false;
  return isAdmin(user) || (isCaptain(user) && team.captain_id === user.id);
}

export function canInitiateJerseyOrder(user: any, team: any): boolean {
  if (!user || !team) return false;
  return isCaptain(user) && team.captain_id === user.id;
}

export function canProposeTournament(user: any): boolean {
  if (!user) return false;
  return ['captain', 'coach', 'platform_admin'].includes(user.role);
}

export function canApproveTournament(user: any): boolean {
  return isAdmin(user);
}

export function canLogMatchEvents(user: any, match: any): boolean {
  if (!user || !match) return false;
  return isAdmin(user) || (isOfficial(user) && match.official_id === user.id);
}

export function canCoachTeam(user: any, team: any): boolean {
  if (!user || !team) return false;
  return isAdmin(user) || (isCoach(user) && team.coach_id === user.id);
}
