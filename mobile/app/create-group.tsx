import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';

import FeedBottomNav from '../components/feed/FeedBottomNav';
import FeedHeader from '../components/feed/FeedHeader';

import CreateGroupIntro from '../components/create-group/CreateGroupIntro';
import CreateGroupIdentityCard from '../components/create-group/CreateGroupIdentityCard';
import CreateGroupSettingsCard from '../components/create-group/CreateGroupSettingsCard';
import CreateGroupMembersCard from '../components/create-group/CreateGroupMembersCard';
import CreateGroupIconPickerModal from '../components/create-group/CreateGroupIconPickerModal';

import { useTheme } from '../context/ThemeContext';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';
import { useCreateGroupScreen } from '../hooks/useCreateGroupScreen';
import {
  DARK_CREATE_GROUP_COLORS,
  LIGHT_CREATE_GROUP_COLORS,
} from '../constants/createGroupTheme';
import { publishMyClubsUpsert } from '../services/clubsLocalUpdates';
import type { ClubDetailsApi } from '../types/clubsApi';

const CREATE_GROUP_SUCCESS_NAVIGATION_DELAY_MS = 700;

export default function CreateGroupScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CREATE_GROUP_COLORS : LIGHT_CREATE_GROUP_COLORS;
  const navigationTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );

  const {
    name,
    description,
    visibility,
    rules,
    selectedTags,
    friendQuery,
    selectedMembers,
    selectedIcon,
    iconModalVisible,
    memberOptions,
    isLoadingMembers,
    memberSearchError,
    isSubmitting,
    createGroupError,
    avatarDraft,
    coverDraft,
    isUploadingMedia,
    isUploadingAvatar,
    isUploadingCover,
    mediaErrorMessage,
    selectedCount,
    nameError,
    descriptionError,
    descriptionWarning,
    descriptionCharacterCount,
    descriptionMaxLength,
    rulesError,
    rulesCharacterCount,
    rulesMaxLength,
    tagMaxCount,
    canCreate,
    canRetryCreateGroup,
    setName,
    setDescription,
    setVisibility,
    setRules,
    setFriendQuery,
    toggleMember,
    retryMemberSearch,
    toggleTag,
    openIconModal,
    closeIconModal,
    selectIcon,
    pickAvatarFromCamera,
    pickAvatarFromGallery,
    pickCoverFromCamera,
    pickCoverFromGallery,
    removeAvatarDraft,
    removeCoverDraft,
    handleCreateGroup,
    retryCreateGroup,
  } = useCreateGroupScreen();

  const isSuccessPending = successMessage !== null;
  const isCreateFlowLocked = isSubmitting || isUploadingMedia || isSuccessPending;
  const canPressCreate = canCreate && !isCreateFlowLocked;

  React.useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  function handleCreateGroupSuccess(createdClub: ClubDetailsApi) {
    publishMyClubsUpsert(createdClub);
    setSuccessMessage('Clube criado. Abrindo detalhes...');

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    navigationTimeoutRef.current = setTimeout(() => {
      router.replace(`/clubs/${encodeURIComponent(createdClub.id)}` as Href);
    }, CREATE_GROUP_SUCCESS_NAVIGATION_DELAY_MS);
  }

  async function handleCreateGroupPress() {
    setSuccessMessage(null);

    const createdClub = await handleCreateGroup();

    if (createdClub) {
      handleCreateGroupSuccess(createdClub);
    }
  }

  async function handleRetryCreateGroup() {
    setSuccessMessage(null);

    const createdClub = await retryCreateGroup();

    if (createdClub) {
      handleCreateGroupSuccess(createdClub);
    }
  }

  function handleBottomNavSelect(key: 'play' | 'search' | 'clubs' | 'profile') {
    if (isCreateFlowLocked) {
      return;
    }

    switch (key) {
      case 'play':
        router.replace('/feed');
        return;
      case 'search':
        router.replace({
          pathname: '/search',
          params: { focus: '1' },
        });
        return;
      case 'clubs':
        router.replace('/clubs');
        return;
      case 'profile':
        router.replace('/profile');
        return;
      default:
        return;
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.green }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.green}
      />

      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <FeedHeader
          title="Truth or Dare"
          initials=""
          headerGreen={colors.green}
          white={colors.white}
          surfaceContainer={colors.surface}
          borderBottomColor={
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(207,247,238,0.20)'
          }
          avatarBorderColor={
            isDark ? 'rgba(255,255,255,0.30)' : 'rgba(207,247,238,0.30)'
          }
          avatarBackgroundColor={isDark ? '#121212' : colors.surface}
          onPressNotifications={() => {
            if (isCreateFlowLocked) {
              return;
            }

            router.push('/notifications');
          }}
        />

        <View style={styles.content}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <CreateGroupIntro colors={colors} />

            <CreateGroupIdentityCard
              colors={colors}
              name={name}
              description={description}
              selectedIcon={selectedIcon}
              nameError={nameError}
              descriptionError={descriptionError}
              descriptionWarning={descriptionWarning}
              descriptionCharacterCount={descriptionCharacterCount}
              descriptionMaxLength={descriptionMaxLength}
              avatarPreviewUri={avatarDraft?.localUri ?? null}
              coverPreviewUri={coverDraft?.localUri ?? null}
              isUploadingAvatar={isUploadingAvatar}
              isUploadingCover={isUploadingCover}
              onChangeName={setName}
              onChangeDescription={setDescription}
              onPressIcon={openIconModal}
              onPickAvatarCamera={pickAvatarFromCamera}
              onPickAvatarGallery={pickAvatarFromGallery}
              onRemoveAvatar={removeAvatarDraft}
              onPickCoverCamera={pickCoverFromCamera}
              onPickCoverGallery={pickCoverFromGallery}
              onRemoveCover={removeCoverDraft}
            />

            <CreateGroupSettingsCard
              colors={colors}
              visibility={visibility}
              rules={rules}
              rulesError={rulesError}
              rulesCharacterCount={rulesCharacterCount}
              rulesMaxLength={rulesMaxLength}
              selectedTags={selectedTags}
              tagMaxCount={tagMaxCount}
              onChangeVisibility={setVisibility}
              onChangeRules={setRules}
              onToggleTag={toggleTag}
            />

            <CreateGroupMembersCard
              colors={colors}
              friendQuery={friendQuery}
              selectedMembers={selectedMembers}
              selectedCount={selectedCount}
              members={memberOptions}
              isLoadingMembers={isLoadingMembers}
              memberSearchError={memberSearchError}
              onChangeQuery={setFriendQuery}
              onToggleMember={toggleMember}
              onRetrySearch={retryMemberSearch}
            />

            <View style={styles.actionsBlock}>
              <Pressable
                onPress={() => {
                  void handleCreateGroupPress();
                }}
                disabled={!canPressCreate}
                style={({ pressed }) => [
                  styles.createButton,
                  {
                    backgroundColor:
                      canPressCreate ? colors.red : colors.outline,
                    opacity: isCreateFlowLocked ? 0.82 : 1,
                  },
                  pressed && canPressCreate && styles.pressed,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : null}
                <Text style={[styles.createButtonText, { color: colors.white }]}>
                  {isSuccessPending
                    ? 'Clube criado'
                    : isUploadingMedia
                      ? 'Enviando midias...'
                      : isSubmitting
                      ? 'Criando Grupo...'
                      : 'Criar Grupo'}
                </Text>
              </Pressable>

              {successMessage ? (
                <View
                  style={[
                    styles.submitSuccessBox,
                    {
                      backgroundColor: colors.greenSoft,
                      borderColor: colors.green,
                    },
                  ]}
                >
                  <Text
                    style={[styles.submitSuccessText, { color: colors.green }]}
                  >
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              {mediaErrorMessage ? (
                <View
                  style={[
                    styles.submitWarningBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                    },
                  ]}
                >
                  <Text
                    style={[styles.submitWarningText, { color: colors.muted }]}
                  >
                    {mediaErrorMessage}
                  </Text>
                </View>
              ) : null}

              {!successMessage && createGroupError ? (
                <View
                  style={[
                    styles.submitErrorBox,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                    },
                  ]}
                >
                  <Text style={[styles.submitErrorText, { color: colors.red }]}>
                    {createGroupError}
                  </Text>

                  <Pressable
                    onPress={() => {
                      void handleRetryCreateGroup();
                    }}
                    disabled={!canRetryCreateGroup}
                    style={({ pressed }) => [
                      styles.retryCreateButton,
                      {
                        backgroundColor: canRetryCreateGroup
                          ? colors.green
                          : colors.outline,
                      },
                      pressed && canRetryCreateGroup && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.retryCreateButtonText,
                        { color: colors.white },
                      ]}
                    >
                      Tentar novamente
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <Text style={[styles.helperText, { color: colors.muted }]}>
                Ao criar um grupo, você concorda com as diretrizes da comunidade e
                as regras do Truth or Dare.
              </Text>
            </View>
          </ScrollView>
        </View>

        <FeedBottomNav
          items={FEED_BOTTOM_NAV_ITEMS}
          activeKey="clubs"
          onSelect={handleBottomNavSelect}
          backgroundColor={colors.green}
          borderTopColor={
            isDark ? 'rgba(255,255,255,0.10)' : 'rgba(207,247,238,0.10)'
          }
          activeBackgroundColor={colors.red}
          activeIconColor="#ffffff"
          activeTextColor="#ffffff"
          inactiveIconColor="rgba(249,249,249,0.72)"
          inactiveTextColor="rgba(249,249,249,0.72)"
        />
      </View>

      <CreateGroupIconPickerModal
        visible={iconModalVisible}
        colors={colors}
        selectedIcon={selectedIcon}
        onClose={closeIconModal}
        onSelectIcon={selectIcon}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 22,
  },
  actionsBlock: {
    gap: 14,
    paddingTop: 2,
  },
  createButton: {
    minHeight: 58,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  helperText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    paddingHorizontal: 12,
  },
  submitErrorBox: {
    borderWidth: 1,
    borderRadius: 16,
    gap: 12,
    padding: 14,
  },
  submitErrorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitSuccessBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submitSuccessText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  submitWarningBox: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  submitWarningText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  retryCreateButton: {
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  retryCreateButtonText: {
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});
