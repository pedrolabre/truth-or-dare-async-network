import { useMemo, useState } from 'react';
import { CREATE_GROUP_ICON_OPTIONS } from '../constants/createGroupIcons';
import type { CreateGroupFriend, GroupIconName } from '../types/createGroup';

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function useCreateGroupScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friendQuery, setFriendQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedIcon, setSelectedIcon] = useState<GroupIconName>('groups');
  const [iconModalVisible, setIconModalVisible] = useState(false);

  const filteredFriends = useMemo(() => {
    const query = normalize(friendQuery);

    if (!query) {
      return CREATE_GROUP_FRIENDS_MOCK;
    }

    return CREATE_GROUP_FRIENDS_MOCK.filter((friend) => {
      return (
        normalize(friend.name).includes(query) ||
        normalize(friend.username).includes(query)
      );
    });
  }, [friendQuery]);

  const selectedCount = selectedMembers.length;
  const canCreate =
    name.trim().length > 0 && description.trim().length > 0;

  function toggleMember(id: string) {
    setSelectedMembers((current) =>
      current.includes(id)
        ? current.filter((memberId) => memberId !== id)
        : [...current, id],
    );
  }

  function openIconModal() {
    setIconModalVisible(true);
  }

  function closeIconModal() {
    setIconModalVisible(false);
  }

  function selectIcon(icon: GroupIconName) {
    setSelectedIcon(icon);
    setIconModalVisible(false);
  }

  function buildPayload() {
    return {
      name: name.trim(),
      description: description.trim(),
      selectedMembers,
      selectedIcon,
    };
  }

  return {
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
    toggleMember,
    openIconModal,
    closeIconModal,
    selectIcon,
    buildPayload,
  };
}