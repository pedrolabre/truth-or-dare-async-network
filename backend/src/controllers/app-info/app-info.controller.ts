import { Request, Response } from 'express';
import { getAppInfo } from '../../services/app-info/app-info.service';

export function getAppInfoController(_req: Request, res: Response) {
  return res.status(200).json(getAppInfo());
}
