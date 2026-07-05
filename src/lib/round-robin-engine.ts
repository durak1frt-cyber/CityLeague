import { insertItem, getItems } from './db';

export interface Standing {
  teamId: string;
  teamName: string;
  logoUrl: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export function generateRoundRobinFixtures(tournamentId: string, teams: any[], rules: any) {
  if (teams.length < 2) return [];

  const createdMatches: any[] = [];
  const numTeams = teams.length;
  
  // Clean scheduling setup: standard Round Robin scheduling
  // For MVP, we write simple round robin pairs:
  // e.g. 4 teams -> 3 rounds, 2 matches per round.
  let list = [...teams];
  if (numTeams % 2 !== 0) {
    list.push({ id: "bye", name: "BAY" }); // bye round
  }

  const rounds = list.length - 1;
  const matchesPerRound = list.length / 2;

  let matchDayIndex = 0;
  for (let r = 0; r < rounds; r++) {
    for (let m = 0; m < matchesPerRound; m++) {
      const home = list[m];
      const away = list[list.length - 1 - m];

      // Ignore BYE matches
      if (home.id !== "bye" && away.id !== "bye") {
        const matchDate = new Date(Date.now() + (r + 1) * 2 * 24 * 60 * 60 * 1000 + m * 2 * 60 * 60 * 1000).toISOString();
        const match = insertItem('matches', {
          tournament_id: tournamentId,
          round: r + 1,
          match_index: m,
          home_team_id: home.id,
          away_team_id: away.id,
          home_score: 0,
          away_score: 0,
          status: 'scheduled',
          match_date: matchDate,
          parent_match_id: "",
          official_id: "player-referee",
          video_url: "",
          telemetry_data: {}
        });
        createdMatches.push(match);
      }
    }
    // Rotate list (keep first element fixed)
    list = [list[0], list[list.length - 1], ...list.slice(1, list.length - 1)];
  }

  return createdMatches;
}

export function calculateStandings(tournamentId: string, registeredTeams: any[]): Standing[] {
  const matches = getItems('matches').filter((m: any) => m.tournament_id === tournamentId);
  const teams = getItems('teams');

  const standingsMap: { [teamId: string]: Standing } = {};

  // Initialize
  registeredTeams.forEach((t: any) => {
    const teamDetails = teams.find((detail: any) => detail.id === t.team_id);
    if (teamDetails) {
      standingsMap[t.team_id] = {
        teamId: t.team_id,
        teamName: teamDetails.name,
        logoUrl: teamDetails.logo_url,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0
      };
    }
  });

  // Calculate stats from matches
  matches.forEach((m: any) => {
    if (m.status !== 'completed') return;

    const home = standingsMap[m.home_team_id];
    const away = standingsMap[m.away_team_id];

    if (!home || !away) return; // ignore unregistered teams

    home.played += 1;
    away.played += 1;

    home.goalsFor += m.home_score;
    home.goalsAgainst += m.away_score;
    away.goalsFor += m.away_score;
    away.goalsAgainst += m.home_score;

    if (m.home_score > m.away_score) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (m.home_score < m.away_score) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      home.points += 1;
      away.draws += 1;
      away.points += 1;
    }
  });

  // Compute goal difference and sort
  const standings = Object.values(standingsMap).map((s: Standing) => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
    return s;
  });

  // Sort: Points DESC -> Goal Difference DESC -> Goals For DESC
  return standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}
