import AsyncStorage from '@react-native-async-storage/async-storage';

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    createdAt: string;
  };
};

export type FeedItem =
  | {
      id: string;
      type: 'truth';
      title: string;
      time: string;
      likes: number;
      comments: number;
      participants: string[];
      extraCount: number;
    }
  | {
      id: string;
      type: 'dare';
      challenger: string;
      title: string;
      attemptsLabel: string;
      expiresIn: string;
      progress: number;
    }
  | {
      id: string;
      type: 'club';
      clubName: string;
      badge: 'Verdade' | 'Desafio';
      quote: string;
      answersCount: number;
    };

const TOKEN_KEY = 'auth_token';

function getApiUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error('EXPO_PUBLIC_API_URL não foi definida');
  }

  return apiUrl;
}

async function parseResponse(response: Response) {
  let data: any = null;
  let text = '';

  try {
    data = await response.json();
  } catch {
    try {
      text = await response.text();
    } catch {
      text = '';
    }
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      text ||
      `Erro na requisição (${response.status})`;

    throw new Error(message);
  }

  return data;
}

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function signup(data: SignupInput) {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function login(data: LoginInput): Promise<LoginResponse> {
  const baseUrl = getApiUrl();

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function getFeed(): Promise<FeedItem[]> {
  const baseUrl = getApiUrl();
  const token = await getToken();

  if (!token) {
    throw new Error('Token não encontrado');
  }

  const response = await fetch(`${baseUrl}/feed`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return parseResponse(response);
}