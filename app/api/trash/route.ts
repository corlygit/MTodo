import { supabase } from "@/lib/supabase"

// 获取回收站中的todos
export async function GET() {
  try {
    const { data: todos, error } = await supabase
      .from("todos")
      .select("*")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })

    if (error) {
      console.error("获取回收站todos失败:", error)
      return Response.json({ error: "获取数据失败" }, { status: 500 })
    }

    // 转换数据格式以匹配前端接口
    const formattedTodos = todos.map((todo) => ({
      id: todo.id,
      text: todo.text,
      tags: todo.tags || {},
      isExpanded: todo.is_expanded || false,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      deletedAt: todo.deleted_at,
    }))

    return Response.json({ todos: formattedTodos })
  } catch (error) {
    console.error("获取回收站todos时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}
