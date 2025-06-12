import { supabase } from "@/lib/supabase"
import type { NextRequest } from "next/server"

// 获取所有未删除的todos
export async function GET() {
  try {
    const { data: todos, error } = await supabase
      .from("todos")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("获取todos失败:", error)
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
    console.error("获取todos时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}

// 创建新todo
export async function POST(request: NextRequest) {
  try {
    const { text, tags } = await request.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "请提供有效的文本内容" }, { status: 400 })
    }

    const { data: todo, error } = await supabase
      .from("todos")
      .insert({
        text: text.trim(),
        tags: tags || {},
        is_expanded: false,
        deleted_at: null,
      })
      .select()
      .single()

    if (error) {
      console.error("创建todo失败:", error)
      return Response.json({ error: "创建失败" }, { status: 500 })
    }

    // 转换数据格式
    const formattedTodo = {
      id: todo.id,
      text: todo.text,
      tags: todo.tags || {},
      isExpanded: todo.is_expanded || false,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      deletedAt: todo.deleted_at,
    }

    return Response.json({ todo: formattedTodo })
  } catch (error) {
    console.error("创建todo时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}
