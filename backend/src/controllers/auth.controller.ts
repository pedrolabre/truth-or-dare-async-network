import { Request, Response } from 'express';
import { login, signup } from '../services/auth.service';

export async function signupController(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    const result = await signup({
      name,
      email,
      password,
    });

    return res.status(201).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno no cadastro';

    return res.status(400).json({
      error: message,
    });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const result = await login({
      email,
      password,
    });

    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno no login';

    return res.status(400).json({
      error: message,
    });
  }
}