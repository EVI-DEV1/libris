import type { Request, Response } from 'express';
import { usersService } from './users.service';

export const usersController = {
  async list(req: Request, res: Response) {
    res.json(await usersService.list(req.query as never));
  },
  async show(req: Request, res: Response) {
    res.json(await usersService.findById(req.params.id as string));
  },
  async createStaff(req: Request, res: Response) {
    res.status(201).json(await usersService.createStaff(req.body));
  },
  async resetPassword(req: Request, res: Response) {
    await usersService.resetPassword(req.params.id as string);
    // A senha nova nao volta no corpo: quem precisa dela e a pessoa, no
    // balcao, e ela ja e conhecida da casa (a SENHA_PADRAO do ambiente).
    res.status(204).send();
  },
  async update(req: Request, res: Response) {
    res.json(await usersService.update(req.params.id as string, req.body));
  },
  async remove(req: Request, res: Response) {
    await usersService.remove(req.params.id as string);
    res.status(204).send();
  },
};
