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
  async findOne<T>(query: TemplateStringsArray, ...params: any[]): Promise<T | null> {
    const result = await sql<T[]>(query, ...params);
    return result[0] || null;
  },

  /**
   * 查询多条记录
   */
  async findMany<T>(query: TemplateStringsArray, ...params: any[]): Promise<T[]> {
    return await sql<T[]>(query, ...params);
  },

  /**
   * 插入记录并返回
   */
  async insert<T>(query: TemplateStringsArray, ...params: any[]): Promise<T> {
    const result = await sql<T[]>(query, ...params);
    return result[0];
  },

  /**
   * 更新记录并返回
   */
  async update<T>(query: TemplateStringsArray, ...params: any[]): Promise<T | null> {
    const result = await sql<T[]>(query, ...params);
    return result[0] || null;
  },

  /**
   * 删除记录
   */
  async delete(query: TemplateStringsArray, ...params: any[]): Promise<number> {
    const result = await sql(query, ...params);
    return result.count;
  },

  /**
   * 执行事务
   */
  async transaction<T>(callback: (sql: typeof postgres) => Promise<T>): Promise<T> {
    return await sql.begin(callback);
  },
};

// 优雅关闭连接
export async function closeConnection() {
  await sql.end();
  console.log('Database connection closed');
}

// 进程退出时关闭连接
if (process.env.NODE_ENV !== 'test') {
  process.on('SIGTERM', closeConnection);
  process.on('SIGINT', closeConnection);
}

export default sql;
