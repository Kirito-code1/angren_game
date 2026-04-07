import { makeId } from "@/lib/security";
import type { BracketRound } from "@/lib/types";

function nextPowerOfTwo(value: number) {
  let power = 1;
  while (power < value) {
    power *= 2;
  }
  return power;
}

function autoAdvance(rounds: BracketRound[], roundIndex: number, matchIndex: number) {
  const match = rounds[roundIndex]?.matches[matchIndex];

  if (!match) {
    return;
  }

  const hasA = Boolean(match.teamAId);
  const hasB = Boolean(match.teamBId);

  if (hasA && hasB) {
    match.status = "scheduled";
    return;
  }

  if (!hasA && !hasB) {
    return;
  }

  const winner = match.teamAId ?? match.teamBId;
  if (!winner) {
    return;
  }

  match.status = "finished";
  match.score = "BYE";
  match.winnerTeamId = winner;

  const nextRound = rounds[roundIndex + 1];
  if (!nextRound) {
    return;
  }

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextMatch = nextRound.matches[nextMatchIndex];

  if (!nextMatch) {
    return;
  }

  if (matchIndex % 2 === 0) {
    nextMatch.teamAId = winner;
  } else {
    nextMatch.teamBId = winner;
  }

  autoAdvance(rounds, roundIndex + 1, nextMatchIndex);
}

export function buildSingleEliminationBracket(teamIds: string[]) {
  if (teamIds.length < 2) {
    return [];
  }

  const bracketSize = nextPowerOfTwo(teamIds.length);
  const roundsCount = Math.log2(bracketSize);
  const paddedTeams = [...teamIds];

  while (paddedTeams.length < bracketSize) {
    paddedTeams.push("");
  }

  const rounds: BracketRound[] = [];

  for (let roundIndex = 0; roundIndex < roundsCount; roundIndex += 1) {
    const matchesInRound = bracketSize / 2 ** (roundIndex + 1);

    rounds.push({
      id: makeId(`round${roundIndex + 1}`),
      title: roundIndex === roundsCount - 1 ? "Финал" : `Раунд ${roundIndex + 1}`,
      matches: Array.from({ length: matchesInRound }, () => ({
        id: makeId("match"),
        teamAId: null,
        teamBId: null,
        score: "-",
        status: "scheduled",
        winnerTeamId: null,
      })),
    });
  }

  rounds[0]?.matches.forEach((match, index) => {
    const teamA = paddedTeams[index * 2] || null;
    const teamB = paddedTeams[index * 2 + 1] || null;

    match.teamAId = teamA;
    match.teamBId = teamB;
    match.status = teamA && teamB ? "scheduled" : "finished";
    match.score = teamA && teamB ? "-" : "BYE";
    match.winnerTeamId = teamA && !teamB ? teamA : !teamA && teamB ? teamB : null;
  });

  rounds[0]?.matches.forEach((_, index) => autoAdvance(rounds, 0, index));

  return rounds;
}

export function pushWinnerToNextRound(
  rounds: BracketRound[],
  roundId: string,
  matchId: string,
  winnerTeamId: string,
) {
  const roundIndex = rounds.findIndex((round) => round.id === roundId);
  if (roundIndex === -1) {
    return;
  }

  const matchIndex = rounds[roundIndex].matches.findIndex(
    (match) => match.id === matchId,
  );

  if (matchIndex === -1) {
    return;
  }

  const nextRound = rounds[roundIndex + 1];
  if (!nextRound) {
    return;
  }

  const nextMatchIndex = Math.floor(matchIndex / 2);
  const nextMatch = nextRound.matches[nextMatchIndex];

  if (!nextMatch) {
    return;
  }

  if (matchIndex % 2 === 0) {
    nextMatch.teamAId = winnerTeamId;
  } else {
    nextMatch.teamBId = winnerTeamId;
  }

  nextMatch.winnerTeamId = null;
  nextMatch.score = "-";
  nextMatch.status = nextMatch.teamAId && nextMatch.teamBId ? "scheduled" : "scheduled";

  autoAdvance(rounds, roundIndex + 1, nextMatchIndex);
}
