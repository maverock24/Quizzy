import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  type Ahead,
  type RulePlayer,
  progressPercent,
  standings,
} from '@/services/multiplayerRules';

interface MultiplayerScoreboardProps {
  players: RulePlayer[];
  myId: string | null;
  totalQuestions: number;
}

interface RowProps {
  p: RulePlayer;
  isYou: boolean;
  total: number;
  trailing: boolean;
}

const leadLabel = (
  you?: RulePlayer,
  rival?: RulePlayer,
  lead = 0,
  ahead: Ahead = 'none',
) => {
  if (!you || !rival) return 'Waiting for your rival';
  if (rival.left) return 'Opponent left';
  if (ahead === 'rival') return `${-lead} behind`;
  return ahead === 'you' ? `You're ahead by ${lead}` : 'Tied';
};

const Row = ({ p, isYou, total, trailing }: RowProps) => {
  const q = p.totalQuestions || total;
  const label = p.left
    ? 'Left'
    : p.finished
    ? 'Finished'
    : `Q${Math.min(p.progress + 1, q)}/${q}`;
  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={[styles.name, (trailing || p.left) && styles.nameMuted]}>
          {isYou ? 'You' : `⚔️ ${p.name}`}
        </Text>
        <Text
          style={[styles.score, isYou ? styles.scoreYou : styles.scoreRival]}
        >
          {p.score}
        </Text>
      </View>
      <View style={styles.barRow}>
        <View style={styles.bar}>
          <View
            style={[
              styles.barFill,
              isYou ? styles.barYou : styles.barRival,
              { width: `${progressPercent(p, total)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{label}</Text>
      </View>
    </View>
  );
};

export const MultiplayerScoreboard: React.FC<MultiplayerScoreboardProps> = ({
  players,
  myId,
  totalQuestions,
}) => {
  const { you, rival, lead, ahead } = standings(players, myId);
  return (
    <View style={styles.container}>
      <Text style={[styles.lead, ahead === 'none' && styles.leadMuted]}>
        {leadLabel(you, rival, lead, ahead)}
      </Text>
      {you && (
        <Row
          p={you}
          isYou
          total={totalQuestions}
          trailing={ahead === 'rival'}
        />
      )}
      {you && rival && <View style={styles.divider} />}
      {rival && (
        <Row
          p={rival}
          isYou={false}
          total={totalQuestions}
          trailing={ahead === 'you'}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 50,
    marginBottom: 8,
  },
  lead: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  leadMuted: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  row: {
    marginBottom: 6,
  },
  rowInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  nameMuted: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  score: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreYou: {
    color: 'rgb(52, 211, 153)',
  },
  scoreRival: {
    color: '#ef4444',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },
  barYou: {
    backgroundColor: 'rgb(52, 211, 153)',
  },
  barRival: {
    backgroundColor: '#ef4444',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginLeft: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 6,
  },
});
