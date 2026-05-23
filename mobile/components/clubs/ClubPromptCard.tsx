import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { ClubsThemeColors } from '../../constants/clubsTheme';
import type {
  ClubFeedItemApi,
  ClubPromptResponseApi,
  ClubPromptTypeApi,
} from '../../types/clubsApi';

type Props = {
  item: ClubFeedItemApi;
  colors: ClubsThemeColors;
  isSubmittingResponse?: boolean;
  onAnswerTruth?: (item: ClubFeedItemApi) => void;
  onOpenComments?: (item: ClubFeedItemApi) => void;
  onSubmitDareProof?: (item: ClubFeedItemApi) => void;
  onReportPrompt?: (item: ClubFeedItemApi) => void;
  onReportResponse?: (
    item: ClubFeedItemApi,
    response: ClubPromptResponseApi,
  ) => void;
};

type BadgeTone = 'green' | 'red' | 'neutral';

const PROMPT_TYPE_LABELS: Record<ClubPromptTypeApi, string> = {
  truth: 'Verdade',
  dare: 'Desafio',
};

function getDateParts(value: string): {
  date: string;
  time: string | null;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})T?(\d{2})?:?(\d{2})?/.exec(value);

  if (!match) {
    return {
      date: value,
      time: null,
    };
  }

  const [, year, month, day, hour, minute] = match;

  return {
    date: `${day}/${month}/${year}`,
    time: hour && minute ? `${hour}:${minute}` : null,
  };
}

function getDateTimeLabel(value: string | null): string {
  if (!value) {
    return 'Nao informado';
  }

  const { date, time } = getDateParts(value);

  return time ? `${date} as ${time}` : date;
}

function getDeadlineLabel(expiresAt: string | null): {
  label: string;
  tone: BadgeTone;
} {
  if (!expiresAt) {
    return {
      label: 'Sem prazo',
      tone: 'neutral',
    };
  }

  const expiresAtTime = new Date(expiresAt).getTime();
  const isExpired = Number.isFinite(expiresAtTime) && expiresAtTime < Date.now();

  return {
    label: isExpired
      ? `Prazo encerrado em ${getDateTimeLabel(expiresAt)}`
      : `Prazo ate ${getDateTimeLabel(expiresAt)}`,
    tone: isExpired ? 'red' : 'green',
  };
}

function isPromptExpired(expiresAt: string | null) {
  if (!expiresAt) {
    return false;
  }

  const expiresAtTime = new Date(expiresAt).getTime();

  return Number.isFinite(expiresAtTime) && expiresAtTime <= Date.now();
}

function getAnswerStateLabel(item: ClubFeedItemApi): {
  label: string;
  tone: BadgeTone;
} {
  if (item.viewerState.answeredByMe) {
    return {
      label: 'Respondido por voce',
      tone: 'green',
    };
  }

  if (!item.viewerState.canAnswer) {
    return {
      label: 'Resposta indisponivel',
      tone: 'neutral',
    };
  }

  return {
    label: 'Pode responder',
    tone: 'green',
  };
}

function getCounterLabel(value: number, singular: string, plural: string) {
  const normalizedValue = Math.max(0, value);

  return `${normalizedValue} ${normalizedValue === 1 ? singular : plural}`;
}

function getResponseSummary(response: ClubPromptResponseApi): string {
  if (response.text?.trim()) {
    return response.text.trim();
  }

  if (response.mediaUrl) {
    return 'Resposta com midia';
  }

  return 'Resposta registrada';
}

function getBadgeColors(colors: ClubsThemeColors, tone: BadgeTone) {
  if (tone === 'green') {
    return {
      backgroundColor: colors.greenSoft,
      color: colors.green,
    };
  }

  if (tone === 'red') {
    return {
      backgroundColor: colors.redSoft,
      color: colors.red,
    };
  }

  return {
    backgroundColor: colors.surfaceSoft,
    color: colors.muted,
  };
}

export default function ClubPromptCard({
  item,
  colors,
  isSubmittingResponse = false,
  onAnswerTruth,
  onOpenComments,
  onSubmitDareProof,
  onReportPrompt,
  onReportResponse,
}: Props) {
  const typeIconName = item.type === 'truth' ? 'help-outline' : 'bolt';
  const typeColors = getBadgeColors(
    colors,
    item.type === 'truth' ? 'green' : 'red',
  );
  const deadline = getDeadlineLabel(item.expiresAt);
  const deadlineColors = getBadgeColors(colors, deadline.tone);
  const answerState = getAnswerStateLabel(item);
  const answerStateColors = getBadgeColors(colors, answerState.tone);
  const recentResponses = item.recentResponses.filter(
    (response) => response.id.trim().length > 0,
  );
  const canActOnPrompt =
    item.viewerState.canAnswer &&
    !item.viewerState.answeredByMe &&
    !isPromptExpired(item.expiresAt);
  const actionLabel = item.type === 'truth' ? 'Responder' : 'Enviar prova';
  const actionIconName = item.type === 'truth' ? 'send' : 'cloud-upload';
  const onPressAction =
    item.type === 'truth' ? onAnswerTruth : onSubmitDareProof;
  const shouldShowAction = canActOnPrompt && Boolean(onPressAction);

  return (
    <View
      testID={`club-prompt-card-${item.id}`}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.authorStack}>
          <Text
            numberOfLines={1}
            testID={`club-prompt-author-${item.id}`}
            style={[styles.author, { color: colors.text }]}
          >
            {item.authorName}
          </Text>
          <Text style={[styles.publishedAt, { color: colors.muted }]}>
            {getDateTimeLabel(item.publishedAt ?? item.createdAt)}
          </Text>
        </View>

        <View
          testID={`club-prompt-type-${item.id}`}
          style={[styles.typeBadge, { backgroundColor: typeColors.backgroundColor }]}
        >
          <MaterialIcons name={typeIconName} size={14} color={typeColors.color} />
          <Text
            numberOfLines={1}
            style={[styles.typeBadgeText, { color: typeColors.color }]}
          >
            {PROMPT_TYPE_LABELS[item.type]}
          </Text>
        </View>
      </View>

      {onReportPrompt ? (
        <Pressable
          accessibilityRole="button"
          testID={`club-prompt-report-${item.id}`}
          onPress={() => onReportPrompt(item)}
          style={({ pressed }) => [
            styles.reportButton,
            {
              backgroundColor: colors.surfaceSoft,
              borderColor: colors.cardBorder,
            },
            pressed && styles.pressed,
          ]}
        >
          <MaterialIcons name="flag" size={14} color={colors.red} />
          <Text style={[styles.reportText, { color: colors.red }]}>
            Denunciar prompt
          </Text>
        </Pressable>
      ) : null}

      <Text
        testID={`club-prompt-content-${item.id}`}
        style={[styles.content, { color: colors.text }]}
      >
        {item.content}
      </Text>

      <View style={styles.badgeGrid}>
        <View
          testID={`club-prompt-deadline-${item.id}`}
          style={[
            styles.infoBadge,
            { backgroundColor: deadlineColors.backgroundColor },
          ]}
        >
          <MaterialIcons
            name="event"
            size={14}
            color={deadlineColors.color}
          />
          <Text
            numberOfLines={1}
            style={[styles.infoBadgeText, { color: deadlineColors.color }]}
          >
            {deadline.label}
          </Text>
        </View>

        <View
          testID={`club-prompt-answer-state-${item.id}`}
          style={[
            styles.infoBadge,
            { backgroundColor: answerStateColors.backgroundColor },
          ]}
        >
          <MaterialIcons
            name={item.viewerState.answeredByMe ? 'done' : 'how-to-reg'}
            size={14}
            color={answerStateColors.color}
          />
          <Text
            numberOfLines={1}
            style={[styles.infoBadgeText, { color: answerStateColors.color }]}
          >
            {answerState.label}
          </Text>
        </View>

        <View style={[styles.infoBadge, { backgroundColor: colors.surfaceSoft }]}>
          <MaterialIcons name="speed" size={14} color={colors.muted} />
          <Text
            numberOfLines={1}
            style={[styles.infoBadgeText, { color: colors.muted }]}
          >
            {item.difficulty?.trim() || 'Dificuldade nao informada'}
          </Text>
        </View>
      </View>

      <View style={styles.countersGrid}>
        <Counter
          colors={colors}
          iconName="question-answer"
          label={getCounterLabel(item.answersCount, 'resposta', 'respostas')}
        />
        <Counter
          colors={colors}
          iconName="chat-bubble-outline"
          label={getCounterLabel(item.commentsCount, 'comentario', 'comentarios')}
          onPress={onOpenComments ? () => onOpenComments(item) : undefined}
          testID={`club-prompt-comments-${item.id}`}
        />
        <Counter
          colors={colors}
          iconName={item.viewerState.likedByMe ? 'favorite' : 'favorite-border'}
          label={getCounterLabel(item.likesCount, 'curtida', 'curtidas')}
        />
      </View>

      {recentResponses.length > 0 ? (
        <View
          testID={`club-prompt-recent-responses-${item.id}`}
          style={[styles.responsesBox, { borderTopColor: colors.cardBorder }]}
        >
          <Text style={[styles.responsesTitle, { color: colors.text }]}>
            Respostas recentes
          </Text>

          {recentResponses.map((response) => (
            <View key={response.id} style={styles.responseItem}>
              <View style={styles.responseHeader}>
                <Text
                  numberOfLines={1}
                  style={[styles.responseAuthor, { color: colors.green }]}
                >
                  {response.userName}
                </Text>
                {onReportResponse ? (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={8}
                    testID={`club-response-report-${response.id}`}
                    onPress={() => onReportResponse(item, response)}
                    style={({ pressed }) => [
                      styles.responseReportButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialIcons name="flag" size={15} color={colors.red} />
                  </Pressable>
                ) : null}
              </View>
              <Text
                numberOfLines={2}
                style={[styles.responseText, { color: colors.subText }]}
              >
                {getResponseSummary(response)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {shouldShowAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isSubmittingResponse }}
          disabled={isSubmittingResponse}
          testID={`club-prompt-action-${item.id}`}
          onPress={() => {
            onPressAction?.(item);
          }}
          style={({ pressed }) => [
            styles.promptActionButton,
            {
              backgroundColor: item.type === 'truth' ? colors.green : colors.red,
            },
            pressed && !isSubmittingResponse && styles.pressed,
            isSubmittingResponse && styles.disabledAction,
          ]}
        >
          <MaterialIcons name={actionIconName} size={17} color={colors.white} />
          <Text style={[styles.promptActionText, { color: colors.white }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type CounterProps = {
  colors: ClubsThemeColors;
  iconName: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress?: () => void;
  testID?: string;
};

function Counter({ colors, iconName, label, onPress, testID }: CounterProps) {
  const content = (
    <>
      <MaterialIcons name={iconName} size={15} color={colors.green} />
      <Text numberOfLines={1} style={[styles.counterText, { color: colors.text }]}>
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [
          styles.counter,
          {
            backgroundColor: colors.surfaceSoft,
            borderColor: colors.cardBorder,
          },
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.counter,
        {
          backgroundColor: colors.surfaceSoft,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 13,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  authorStack: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  author: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '900',
  },
  publishedAt: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  typeBadge: {
    minHeight: 30,
    maxWidth: 126,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  typeBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  content: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '800',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoBadge: {
    minHeight: 30,
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoBadgeText: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  countersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  counter: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    maxWidth: 112,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  responsesBox: {
    borderTopWidth: 1,
    paddingTop: 13,
    gap: 10,
  },
  responsesTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  responseItem: {
    gap: 3,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  responseAuthor: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '900',
  },
  responseText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  promptActionButton: {
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  promptActionText: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '900',
  },
  reportButton: {
    alignSelf: 'flex-start',
    minHeight: 32,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reportText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  responseReportButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledAction: {
    opacity: 0.68,
  },
  pressed: {
    opacity: 0.88,
  },
});
