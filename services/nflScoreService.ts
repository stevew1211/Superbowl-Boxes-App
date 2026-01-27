const ESPN_NFL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

export interface LiveGameScore {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  quarter: 1 | 2 | 3 | 4 | null;
  gameStatus: 'pre' | 'in' | 'post';
  lastUpdated: number;
}

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: {
    displayName: string;
    abbreviation: string;
  };
  score: string;
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  status: {
    type: {
      state: 'pre' | 'in' | 'post';
    };
    period: number;
  };
}

interface ESPNEvent {
  name: string;
  competitions: ESPNCompetition[];
}

interface ESPNResponse {
  events: ESPNEvent[];
}

export async function fetchLiveScores(
  homeTeamName?: string,
  awayTeamName?: string
): Promise<LiveGameScore | null> {
  try {
    const response = await fetch(ESPN_NFL_SCOREBOARD);
    if (!response.ok) {
      console.error('ESPN API error:', response.status);
      return null;
    }

    const data: ESPNResponse = await response.json();

    if (!data.events || data.events.length === 0) {
      return null;
    }

    // Find the matching game if team names provided, otherwise return the first/featured game
    let targetGame: ESPNEvent | undefined;

    if (homeTeamName && awayTeamName) {
      targetGame = data.events.find((event) => {
        const competition = event.competitions[0];
        if (!competition) return false;

        const teams = competition.competitors.map((c) =>
          c.team.displayName.toLowerCase()
        );
        return (
          teams.includes(homeTeamName.toLowerCase()) &&
          teams.includes(awayTeamName.toLowerCase())
        );
      });
    }

    // Default to first game if no match or no team names provided
    if (!targetGame) {
      targetGame = data.events[0];
    }

    const competition = targetGame.competitions[0];
    if (!competition) return null;

    const homeCompetitor = competition.competitors.find(
      (c) => c.homeAway === 'home'
    );
    const awayCompetitor = competition.competitors.find(
      (c) => c.homeAway === 'away'
    );

    if (!homeCompetitor || !awayCompetitor) return null;

    const period = competition.status.period;
    const quarter = period >= 1 && period <= 4 ? (period as 1 | 2 | 3 | 4) : null;

    return {
      homeTeam: homeCompetitor.team.displayName,
      awayTeam: awayCompetitor.team.displayName,
      homeScore: parseInt(homeCompetitor.score || '0', 10),
      awayScore: parseInt(awayCompetitor.score || '0', 10),
      quarter,
      gameStatus: competition.status.type.state,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Failed to fetch live scores:', error);
    return null;
  }
}

export function matchesTeams(
  liveScore: LiveGameScore,
  homeTeam: string,
  awayTeam: string
): boolean {
  const liveHome = liveScore.homeTeam.toLowerCase();
  const liveAway = liveScore.awayTeam.toLowerCase();
  const targetHome = homeTeam.toLowerCase();
  const targetAway = awayTeam.toLowerCase();

  return (
    (liveHome.includes(targetHome) || targetHome.includes(liveHome)) &&
    (liveAway.includes(targetAway) || targetAway.includes(liveAway))
  );
}
