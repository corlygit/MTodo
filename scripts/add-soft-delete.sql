-- 为todos表添加软删除字段
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON todos(deleted_at);

-- 更新现有数据，确保deleted_at为NULL（表示未删除）
UPDATE todos SET deleted_at = NULL WHERE deleted_at IS NULL;
