import { insertItem, getItems, updateItem } from './db';

export interface TeamNode {
  id: string;
  name: string;
}

export function generateKnockoutBracket(tournamentId: string, teams: any[]) {
  if (teams.length < 2) return [];

  // Determine rounds. e.g. 4 teams = 2 rounds (4 -> 2 -> 1)
  const numTeams = teams.length;
  
  // Clean up existing matches for this tournament first
  const allMatches = getItems('matches');
  
  // We will build match trees. For MVP, we support 4-team bracket:
  // Semifinals (Round 1, Match Index 0 and 1) -> Final (Round 2, Match Index 0)
  
  const createdMatches: any[] = [];
  
  if (numTeams === 4) {
    // 1. Create Final Match (Round 2, index 0)
    const finalMatch = insertItem('matches', {
      tournament_id: tournamentId,
      round: 2,
      match_index: 0,
      home_team_id: "", // TBD from SF1 winner
      away_team_id: "", // TBD from SF2 winner
      home_score: 0,
      away_score: 0,
      status: 'scheduled',
      match_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      parent_match_id: "",
      official_id: "player-referee", // default assigned referee
      video_url: "",
      telemetry_data: {}
    });

    createdMatches.push(finalMatch);

    // 2. Create Semifinal 1 (Round 1, index 0) -> feeds home of Final
    const sf1 = insertItem('matches', {
      tournament_id: tournamentId,
      round: 1,
      match_index: 0,
      home_team_id: teams[0].id,
      away_team_id: teams[1].id,
      home_score: 0,
      away_score: 0,
      status: 'scheduled',
      match_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      parent_match_id: finalMatch.id,
      official_id: "player-referee",
      video_url: "",
      telemetry_data: {}
    });

    // 3. Create Semifinal 2 (Round 1, index 1) -> feeds away of Final
    const sf2 = insertItem('matches', {
      tournament_id: tournamentId,
      round: 1,
      match_index: 1,
      home_team_id: teams[2].id,
      away_team_id: teams[3].id,
      home_score: 0,
      away_score: 0,
      status: 'scheduled',
      match_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      parent_match_id: finalMatch.id,
      official_id: "player-referee",
      video_url: "",
      telemetry_data: {}
    });

    createdMatches.push(sf1, sf2);
  } else if (numTeams === 2) {
    // 2-team straight final
    const finalMatch = insertItem('matches', {
      tournament_id: tournamentId,
      round: 1,
      match_index: 0,
      home_team_id: teams[0].id,
      away_team_id: teams[1].id,
      home_score: 0,
      away_score: 0,
      status: 'scheduled',
      match_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      parent_match_id: "",
      official_id: "player-referee",
      video_url: "",
      telemetry_data: {}
    });
    createdMatches.push(finalMatch);
  }

  return createdMatches;
}

// Automatically advance winning team to next round match parent slot
export function advanceBracketWinner(completedMatch: any, winnerTeamId: string) {
  if (!completedMatch.parent_match_id) return; // reached final

  const parentMatch = getItems('matches').find((m: any) => m.id === completedMatch.parent_match_id);
  if (!parentMatch) return;

  // Decide if winner feeds home or away of parent match based on completed index
  const updateData: any = {};
  if (completedMatch.match_index === 0) {
    updateData.home_team_id = winnerTeamId;
  } else {
    updateData.away_team_id = winnerTeamId;
  }

  updateItem('matches', parentMatch.id, updateData);
}
