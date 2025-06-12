import { supabase } from "@/lib/supabase"
import type { NextRequest } from "next/server"

// 恢复todo（从回收站恢复）
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { data: todo, error } = await supabase
      .from("todos")
      .update({ deleted_at: null })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("恢复todo失败:", error)
      return Response.json({ error: "恢复失败" }, { status: 500 })
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
    console.error("恢复todo时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}

// 永久删除todo（真正删除）
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase.from("todos").delete().eq("id", id)

    if (error) {
      console.error("永久删除todo失败:", error)
      return Response.json({ error: "删除失败" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("永久删除todo时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}
