type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

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

export async function login(data: LoginInput) {
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