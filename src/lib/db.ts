import postgres from 'postgres';

// 数据库配置
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'packaging_saas',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  max: 10, // 连接池最大连接数
  idle_timeout: 20,
  connect_timeout: 10,
};

// 创建数据库连接实例
const sql = postgres(config);

// 测试连接
export async function testConnection() {
  try {
    await sql`SELECT 1 as connected`;
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// 导出 SQL 标签函数
export { sql };

// 类型安全的查询辅助函数
export const db = {
  /**
   * 查询单条记录
   */
  async findOne<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const result = await sql.unsafe<T[]>(query, params);
    return result[0] || null;
  },

  /**
   * 查询多条记录
   */
  async findMany<T = any>(query: string, params: any[] = []): Promise<T[]> {
    return await sql.unsafe<T[]>(query, params);
  },

  /**
   * 插入记录并返回
   */
  async insert<T = any>(query: string, params: any[] = []): Promise<T> {
    const result = await sql.unsafe<T[]>(query, params);
    return result[0];
  },

  /**
   * 更新记录并返回
   */
  async update<T = any>(query: string, params: any[] = []): Promise<T | null> {
    const result = await sql.unsafe<T[]>(query, params);
    return result[0] || null;
  },

  /**
   * 删除记录
   */
  async delete(query: string, params: any[] = []): Promise<number> {
    const result = await sql.unsafe(query, params);
    return result.count;
  },

  /**
   * 执行事务
   */
  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return (await sql.begin(callback as any)) as T;
  },
};

// 优雅关闭连接
export async function closeConnection() {
  await sql.end();
  console.log('Database connection closed');
}

// 进程退出时关闭连接（仅 Node.js 运行时，Edge Runtime 不支持 process.on）
if (process.env.NODE_ENV !== 'test' && typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('SIGTERM', closeConnection);
  process.on('SIGINT', closeConnection);
}

export default sql;
