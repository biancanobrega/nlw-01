import knex from '../database/connection';
import { Request, Response } from 'express';

class PointsController {
  async create(req: Request, res: Response) {
    const items = String(req.body.items)
      .split(',')
      .map(item => Number(item.trim()));
    const image = req.file.filename;
    const point = {
      name: req.body.name,
      email: req.body.email,
      whatsapp: req.body.whatsapp,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      city: req.body.city,
      uf: req.body.uf,
    };

    console.log(req.body);
    console.log('POINT: ', point);

    const trx = await knex.transaction();

    const insertedIds = await trx('points').insert({
      image,
      ...point,
    });

    const pointId = insertedIds[0];
    const pointItems = items.map((itemId: number) => {
      return {
        item_id: itemId,
        point_id: pointId,
      };
    });

    await trx('point_items').insert(pointItems);
    await trx.commit();

    return res.json({ id: pointId, ...point, items: items });
  }

  async show(req: Request, res: Response) {
    const { id } = req.params;
    const point = await knex('points').where('id', id).first();

    if (!point) {
      return res.status(404).json({ message: 'Point not found' });
    }
    const items = await knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title');

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.1.83:3333/uploads/${point.image}`,
    };
    return res.json({ ...serializedPoint, items });
  }

  async index(req: Request, res: Response) {
    const { city, uf, items } = req.query;
    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    const serializedPoints = points.map(point => {
      return {
        ...point,
        image_url: `http://192.168.1.83:3333/uploads/${point.image}`,
      };
    });

    return res.json(serializedPoints);
  }
}

export default PointsController;
