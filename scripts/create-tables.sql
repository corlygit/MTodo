-- 创建todos表
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  tags JSONB DEFAULT '{}',
  is_expanded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为todos表创建更新时间触发器
DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
  BEFORE UPDATE ON todos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_tags ON todos USING GIN(tags);

-- 插入一些示例数据
INSERT INTO todos (text, tags) VALUES 
  ('明天和张三讨论GitHub项目进展', '{"todo": true, "person": "张三", "time": "明天", "product": "GitHub"}'),
  ('记录今天在微信群里的讨论内容', '{"todo": false, "time": "今天", "product": "微信"}'),
  ('下周完成React项目的代码审查', '{"todo": true, "time": "下周", "product": "React"}')
ON CONFLICT (id) DO NOTHING;
