import { Pool } from 'pg';
import { DB_CONFIG } from '../config/environments';
import { Logger } from './logger';

const logger = Logger.getInstance('DB');

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool(DB_CONFIG);
    pool.on('error', (err) => logger.error('PG pool error', err));
  }
  return pool;
}

export const DB = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query<T = Record<string, any>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const start = Date.now();
    const client = await getPool().connect();
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (client as any).query(sql, params);
      logger.debug(`DB query (${Date.now() - start}ms): ${sql.substring(0, 80)}`);
      return result.rows;
    } catch (err) {
      logger.error(`DB query failed: ${sql}`, err);
      throw err;
    } finally {
      client.release();
    }
  },

  async getProductBySlug(slug: string) {
    const sql = `
      SELECT p.id, p.name, p.slug, p.description,
             pc.name AS category,
             pv.sku, pv.price_amount AS price, pv.currency
      FROM product_product p
      LEFT JOIN product_category pc ON pc.id = p.category_id
      LEFT JOIN product_productvariant pv ON pv.product_id = p.id
      WHERE p.slug = $1
      LIMIT 1
    `;
    const rows = await DB.query(sql, [slug]);
    return rows[0] || null;
  },

  async getActiveProducts(limit = 10) {
    const sql = `
      SELECT p.id, p.name, p.slug, pc.name AS category
      FROM product_product p
      LEFT JOIN product_category pc ON pc.id = p.category_id
      WHERE p.is_published = true
      ORDER BY p.updated_at DESC
      LIMIT $1
    `;
    return DB.query(sql, [limit]);
  },

  async getOrderByEmail(email: string) {
    const sql = `
      SELECT o.id, o.number, o.status, o.total_gross_amount,
             o.billing_address_id, o.created_at
      FROM order_order o
      LEFT JOIN account_user u ON u.id = o.user_id
      WHERE u.email = $1
      ORDER BY o.created_at DESC
      LIMIT 5
    `;
    return DB.query(sql, [email]);
  },

  async getCouponByCode(code: string) {
    const sql = `
      SELECT v.id, v.code, v.type, v.discount_value,
             v.usage_limit, v.used, v.start_date, v.end_date
      FROM discount_voucher v
      WHERE v.code = $1
    `;
    const rows = await DB.query(sql, [code]);
    return rows[0] || null;
  },

  async getWishlistItems(userId: string) {
    const sql = `
      SELECT w.id, w.product_id, p.name, p.slug
      FROM wishlist_wishlist wl
      JOIN wishlist_wishlistitem w ON w.wishlist_id = wl.id
      JOIN product_product p ON p.id = w.product_id
      WHERE wl.user_id = $1
    `;
    return DB.query(sql, [userId]);
  },

  async cleanupTestOrders(email: string) {
    const sql = `
      DELETE FROM order_order
      WHERE user_id = (
        SELECT id FROM account_user WHERE email = $1
      )
      AND status IN ('unconfirmed', 'draft')
    `;
    return DB.query(sql, [email]);
  },

  async closePool(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
      logger.info('DB pool closed');
    }
  },
};
