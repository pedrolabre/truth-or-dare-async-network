import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { CreateGroupThemeColors } from '../../constants/createGroupTheme';
import type { CreateGroupFriend } from '../../types/createGroup';

type Props = {
  colors: CreateGroupThemeColors;
  friendQuery: string;
  selectedMembers: string[];
  selectedCount: number;
  friends: CreateGroupFriend[];
  onChangeQuery: (value: string) => void;
  onToggleMember: (id: string) => void;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function CreateGroupMembersCard({
  colors,
  friendQuery,
  selectedMembers,
  selectedCount,
  friends,
  onChangeQuery,
  onToggleMember,
}: Props) {
  return (
    <View
      style={[
        styles.membersCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
        },
      ]}
    >
      <View style={styles.membersHeader}>
        <View style={styles.membersTitleRow}>
          <MaterialIcons name="person-add" size={20} color={colors.green} />
          <Text style={[styles.membersTitle, { color: colors.text }]}>
            Adicionar Membros
          </Text>
        </View>

        <View
          style={[
            styles.selectedCountBadge,
            { backgroundColor: colors.greenSoft },
          ]}
        >
          <Text style={[styles.selectedCountText, { color: colors.green }]}>
            {selectedCount} selecionados
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.searchInputWrap,
          {
            backgroundColor: colors.background,
            borderColor: colors.outline,
          },
        ]}
      >
        <MaterialIcons name="search" size={20} color={colors.muted} />
        <TextInput
          value={friendQuery}
          onChangeText={onChangeQuery}
          placeholder="Buscar amigos pelo nome..."
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      <View style={styles.memberList}>
        {friends.map((friend) => {
          const isSelected = selectedMembers.includes(friend.id);

          return (
            <Pressable
              key={friend.id}
              onPress={() => onToggleMember(friend.id)}
              style={({ pressed }) => [
                styles.memberRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.memberLeft}>
                <View
                  style={[
                    styles.memberAvatar,
                    { backgroundColor: colors.green },
                  ]}
                >
                  <Text style={[styles.memberAvatarText, { color: colors.white }]}>
                    {getInitials(friend.name)}
                  </Text>
                </View>

                <View style={styles.memberTextWrap}>
                  <Text
                    numberOfLines={1}
                    style={[styles.memberName, { color: colors.text }]}
                  >
                    {friend.name}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.memberUsername, { color: colors.subText }]}
                  >
                    @{friend.username}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? colors.green : colors.outline,
                    backgroundColor: isSelected ? colors.green : 'transparent',
                  },
                ]}
              >
                {isSelected ? (
                  <MaterialIcons name="check" size={16} color={colors.white} />
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  membersCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 16,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  membersTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  selectedCountBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selectedCountText: {
    fontSize: 11,
    fontWeight: '900',
  },
  searchInputWrap: {
    minHeight: 52,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  memberList: {
    gap: 6,
  },
  memberRow: {
    minHeight: 66,
    borderRadius: 16,
    paddingHorizontal: 2,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  memberLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 15,
    fontWeight: '900',
  },
  memberTextWrap: {
    flex: 1,
    gap: 2,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '800',
  },
  memberUsername: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
});