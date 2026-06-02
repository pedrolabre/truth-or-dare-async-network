import { Router } from 'express';
import { getAppInfoController } from '../../controllers/app-info/app-info.controller';

const router = Router();

router.get('/', getAppInfoController);

export default router;
