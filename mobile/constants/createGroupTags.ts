export const CREATE_GROUP_TAG_MAX_COUNT = 10;
export const CREATE_GROUP_TAG_MAX_LENGTH = 32;

export type CreateGroupTagOption = {
  label: string;
  value: string;
};

export const CREATE_GROUP_TAG_OPTIONS = [
  { label: 'Amigos', value: 'friends' },
  { label: 'Festas', value: 'party' },
  { label: 'Casual', value: 'casual' },
  { label: 'Escola', value: 'school' },
  { label: 'Trabalho', value: 'work' },
  { label: 'Familia', value: 'family' },
  { label: 'Games', value: 'games' },
  { label: 'Musica', value: 'music' },
  { label: 'Filmes', value: 'movies' },
  { label: 'Esportes', value: 'sports' },
  { label: 'Geek', value: 'geek' },
  { label: 'Casais', value: 'couples' },
] as const satisfies readonly CreateGroupTagOption[];

export function normalizeCreateGroupTag(value: string) {
  return value.trim().toLowerCase();
}

export function isCreateGroupTagOption(value: string) {
  const normalizedTag = normalizeCreateGroupTag(value);

  return CREATE_GROUP_TAG_OPTIONS.some((option) => {
    return option.value === normalizedTag;
  });
}
