import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import type { ProofDetailItem } from '../../types/proof';

type ProofMediaViewerProps = {
  proof: ProofDetailItem;
  backgroundColor: string;
  overlayColor: string;
  borderColor: string;
  titleColor: string;
  metaColor: string;
  accentColor: string;
  accentTextColor: string;
  onPressPlay?: () => void;
  onPressOpenMedia?: () => void;
};

function formatDuration(durationSeconds?: number | null) {
  if (!durationSeconds || durationSeconds <= 0) {
    return '00:00';
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getMediaIcon(mediaType: ProofDetailItem['mediaType']) {
  if (mediaType === 'video') {
    return 'videocam';
  }

  if (mediaType === 'audio') {
    return 'mic';
  }

  if (mediaType === 'image') {
    return 'image';
  }

  return 'insert-drive-file';
}

function getMediaTitle(mediaType: ProofDetailItem['mediaType']) {
  if (mediaType === 'video') {
    return 'Video da prova';
  }

  if (mediaType === 'audio') {
    return 'Audio da prova';
  }

  if (mediaType === 'image') {
    return 'Imagem da prova';
  }

  return 'Arquivo da prova';
}

function getMediaSubtitle(
  mediaType: ProofDetailItem['mediaType'],
  hasMedia: boolean,
) {
  if (!hasMedia) {
    return 'Midia indisponivel para visualizacao.';
  }

  if (mediaType === 'video') {
    return 'Abra o video para assistir no player do dispositivo.';
  }

  if (mediaType === 'audio') {
    return 'Abra o audio para ouvir no player do dispositivo.';
  }

  if (mediaType === 'file') {
    return 'Abra o arquivo para visualizar no aplicativo compativel.';
  }

  return 'Imagem carregada a partir da prova enviada.';
}

function getInfoTag(proof: ProofDetailItem) {
  if (proof.mediaType === 'video') {
    return `${formatDuration(proof.durationSeconds)} / VIDEO`;
  }

  if (proof.mediaType === 'audio') {
    return `${formatDuration(proof.durationSeconds)} / AUDIO`;
  }

  if (proof.mediaType === 'image') {
    return 'IMAGEM';
  }

  return 'ARQUIVO';
}

export default function ProofMediaViewer({
  proof,
  backgroundColor,
  overlayColor,
  borderColor,
  titleColor,
  metaColor,
  accentColor,
  accentTextColor,
  onPressPlay,
  onPressOpenMedia,
}: ProofMediaViewerProps) {
  const hasMedia = Boolean(proof.mediaUri || proof.thumbnailUri);
  const isImage = proof.mediaType === 'image';
  const canOpenExternally =
    proof.mediaType === 'video' ||
    proof.mediaType === 'audio' ||
    proof.mediaType === 'file';
  const openMedia = onPressOpenMedia ?? onPressPlay;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      <View style={[styles.mediaArea, { backgroundColor: overlayColor }]}>
        {isImage && proof.mediaUri ? (
          <Image
            source={{ uri: proof.mediaUri }}
            resizeMode="cover"
            style={styles.realImage}
          />
        ) : (
          <View style={styles.mediaTint} />
        )}

        {!isImage || !proof.mediaUri ? (
          <View style={styles.mediaContent}>
            <View style={[styles.mediaIconWrap, { backgroundColor: accentColor }]}>
              <MaterialIcons
                name={getMediaIcon(proof.mediaType)}
                size={30}
                color={accentTextColor}
              />
            </View>

            <Text style={[styles.mediaTitle, { color: titleColor }]}>
              {getMediaTitle(proof.mediaType)}
            </Text>

            <Text style={[styles.mediaSubtitle, { color: metaColor }]}>
              {getMediaSubtitle(proof.mediaType, hasMedia)}
            </Text>
          </View>
        ) : null}

        {canOpenExternally && hasMedia ? (
          <Pressable
            onPress={openMedia}
            style={({ pressed }) => [
              styles.playButton,
              { backgroundColor: accentColor },
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons
              name={proof.mediaType === 'video' ? 'play-arrow' : 'open-in-new'}
              size={34}
              color={accentTextColor}
            />
          </Pressable>
        ) : null}

        <View style={styles.infoTag}>
          <Text style={[styles.infoTagText, { color: titleColor }]}>
            {getInfoTag(proof)}
          </Text>
        </View>

        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  mediaArea: {
    position: 'relative',
    width: '100%',
    aspectRatio: 9 / 16,
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
  },
  realImage: {
    width: '100%',
    height: '100%',
  },
  mediaTint: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.25,
    backgroundColor: '#000000',
  },
  mediaContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  mediaIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mediaTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '900',
    textAlign: 'center',
  },
  mediaSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  playButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 86,
    height: 86,
    borderRadius: 999,
  },
  infoTag: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  infoTagText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 18,
    height: 18,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 18,
    height: 18,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(255,255,255,0.45)',
  },
});
