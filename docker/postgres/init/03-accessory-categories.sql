CREATE TABLE IF NOT EXISTS accessory_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) UNIQUE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_accessory_categories_sort_order
  ON accessory_categories(sort_order, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_accessory_categories_updated_at'
  ) THEN
    CREATE TRIGGER update_accessory_categories_updated_at
      BEFORE UPDATE ON accessory_categories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

INSERT INTO accessory_categories (name, sort_order)
VALUES
  ('窄口瓶', 1),
  ('泵头', 2),
  ('盖子', 3),
  ('滴管', 4),
  ('广口瓶', 5),
  ('软包装', 6),
  ('软管', 7),
  ('香水瓶', 8),
  ('香水中套', 9),
  ('香水盖子', 10),
  ('口红管', 11),
  ('眼影盒', 12),
  ('粉盒', 13),
  ('睫毛膏管', 14),
  ('气垫', 15),
  ('遮瑕棒', 16),
  ('眼线笔', 17),
  ('眉笔', 18),
  ('眉蜡管', 19),
  ('眉胶管', 20),
  ('粉扑', 21),
  ('化妆刷', 22),
  ('滚珠瓶', 23),
  ('卧蚕笔', 24),
  ('修容笔', 25),
  ('针管', 26),
  ('安培瓶', 27)
ON CONFLICT (name) DO NOTHING;
