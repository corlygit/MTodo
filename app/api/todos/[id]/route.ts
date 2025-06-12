import { supabase } from "@/lib/supabase"
import type { NextRequest } from "next/server"

// 更新todo
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { text, tags, isExpanded } = await request.json()
    const { id } = params

    const updateData: any = {}
    if (text !== undefined) updateData.text = text
    if (tags !== undefined) updateData.tags = tags
    if (isExpanded !== undefined) updateData.is_expanded = isExpanded

    const { data: todo, error } = await supabase.from("todos").update(updateData).eq("id", id).select().single()

    if (error) {
      console.error("更新todo失败:", error)
      return Response.json({ error: "更新失败" }, { status: 500 })
    }

    // 转换数据格式
    const formattedTodo = {
      id: todo.id,
      text: todo.text,
      tags: todo.tags || {},
      isExpanded: todo.is_expanded || false,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
    }

    return Response.json({ todo: formattedTodo })
  } catch (error) {
    console.error("更新todo时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}

// 删除todo
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const { error } = await supabase.from("todos").delete().eq("id", id)

    if (error) {
      console.error("删除todo失败:", error)
      return Response.json({ error: "删除失败" }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("删除todo时发生错误:", error)
    return Response.json({ error: "服务器错误" }, { status: 500 })
  }
}
