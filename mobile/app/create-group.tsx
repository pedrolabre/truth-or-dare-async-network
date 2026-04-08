import React from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import FeedBottomNav from '../components/feed/FeedBottomNav';
import FeedHeader from '../components/feed/FeedHeader';

import CreateGroupIntro from '../components/create-group/CreateGroupIntro';
import CreateGroupIdentityCard from '../components/create-group/CreateGroupIdentityCard';
import CreateGroupMembersCard from '../components/create-group/CreateGroupMembersCard';
import CreateGroupIconPickerModal from '../components/create-group/CreateGroupIconPickerModal';

import { useTheme } from '../context/ThemeContext';
import { FEED_BOTTOM_NAV_ITEMS } from '../data/feedMock';
import { useCreateGroupScreen } from '../hooks/useCreateGroupScreen';
import { CREATE_GROUP_ICON_OPTIONS } from '../constants/createGroupIcons';
import {
  DARK_CREATE_GROUP_COLORS,
  LIGHT_CREATE_GROUP_COLORS,
} from '../constants/createGroupTheme';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = isDark ? DARK_CREATE_GROUP_COLORS : LIGHT_CREATE_GROUP_COLORS;

  const {
    name,
    description,
    friendQuery,
    selectedMembers,
    selectedIcon,
    iconModalVisible,
    filteredFriends,
    selectedCount,
    canCreate,
    setName,
    setDescription,
    setFriendQuery,
    setSelectedIcon,
    setIconModalVisible,
    toggleMember,
  } = useCreateGroupScreen();

  function handleCreateGroup() {
    if (!canCreate) {
      return;
    }

    console.log('Criar grupo futuramente com backend:', {
      name: name.trim(),
      description: description.trim(),
      selectedMembers,
      selectedIcon,
    });

    router.replace('/clubs');
  }

  function handleBottomNavSelect(key: 'play' | 'search' | 'clubs' | 'profile') {
    switch (key) {
      case 'play':
        router.replace('/feed');
        return;
      case 'search':
        router.replace('/search');
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
              onChangeName={setName}
              onChangeDescription={setDescription}
              onPressIcon={() => setIconModalVisible(true)}
            />

            <CreateGroupMembersCard
              colors={colors}
              friendQuery={friendQuery}
              selectedMembers={selectedMembers}
              selectedCount={selectedCount}
              friends={filteredFriends}
              onChangeQuery={setFriendQuery}
              onToggleMember={toggleMember}
            />

            <View style={styles.actionsBlock}>
              <Pressable
                onPress={handleCreateGroup}
                disabled={!canCreate}
                style={({ pressed }) => [
                  styles.createButton,
                  {
                    backgroundColor: canCreate ? colors.red : colors.outline,
                  },
                  pressed && canCreate && styles.pressed,
                ]}
              >
                <Text style={[styles.createButtonText, { color: colors.white }]}>
                  Criar Grupo
                </Text>
              </Pressable>

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
        iconOptions={CREATE_GROUP_ICON_OPTIONS}
        onClose={() => setIconModalVisible(false)}
        onSelectIcon={(icon) => {
          setSelectedIcon(icon);
          setIconModalVisible(false);
        }}
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
    alignItems: 'center',
    justifyContent: 'center',
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
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});