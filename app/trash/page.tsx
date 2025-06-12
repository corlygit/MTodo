"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Trash2, RotateCcw, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

interface TodoItem {
  id: string
  text: string
  tags: {
    todo?: boolean
    person?: string
    time?: string
    product?: string
  }
  isExpanded: boolean
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

// 回收站API调用函数
const trashAPI = {
  // 获取回收站中的todos
  getAll: async (): Promise<TodoItem[]> => {
    const response = await fetch("/api/trash")
    if (!response.ok) {
      throw new Error("获取回收站数据失败")
    }
    const data = await response.json()
    return data.todos
  },

  // 恢复todo
  restore: async (id: string): Promise<TodoItem> => {
    const response = await fetch(`/api/trash/${id}`, {
      method: "PUT",
    })
    if (!response.ok) {
      throw new Error("恢复失败")
    }
    const data = await response.json()
    return data.todo
  },

  // 永久删除todo
  permanentDelete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/trash/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("永久删除失败")
    }
  },
}

export default function TrashPage() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [operatingId, setOperatingId] = useState<string | null>(null)

  // 加载回收站数据
  useEffect(() => {
    const loadTrashTodos = async () => {
      try {
        setIsLoading(true)
        const todosData = await trashAPI.getAll()
        setTodos(todosData)
      } catch (error) {
        console.error("加载回收站数据失败:", error)
        setError("加载数据失败，请刷新页面重试")
      } finally {
        setIsLoading(false)
      }
    }

    loadTrashTodos()
  }, [])

  const restoreTodo = async (id: string) => {
    try {
      setOperatingId(id)
      await trashAPI.restore(id)
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
      setError(null)
    } catch (error) {
      console.error("恢复失败:", error)
      setError("恢复失败，请重试")
    } finally {
      setOperatingId(null)
    }
  }

  const permanentDelete = async (id: string) => {
    if (!confirm("确定要永久删除这个项目吗？此操作无法撤销！")) {
      return
    }

    try {
      setOperatingId(id)
      await trashAPI.permanentDelete(id)
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
      setError(null)
    } catch (error) {
      console.error("永久删除失败:", error)
      setError("删除失败，请重试")
    } finally {
      setOperatingId(null)
    }
  }

  const truncateText = (text: string, maxLength = 80) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
  }

  const getTagColor = (tagType: string) => {
    const colors = {
      todo: "bg-green-100 text-green-800",
      person: "bg-blue-100 text-blue-800",
      time: "bg-purple-100 text-purple-800",
      product: "bg-orange-100 text-orange-800",
    }
    return colors[tagType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getTagLabel = (tagType: string, value: any) => {
    if (tagType === "todo") {
      return value ? "待办" : "记录"
    }
    return value
  }

  const renderTags = (tags: TodoItem["tags"]) => {
    const tagElements = []

    if (tags.todo !== undefined) {
      tagElements.push(
        <Badge key="todo" variant="secondary" className={`text-xs px-2 py-0.5 ${getTagColor("todo")}`}>
          {getTagLabel("todo", tags.todo)}
        </Badge>,
      )
    }

    if (tags.person) {
      tagElements.push(
        <Badge key="person" variant="secondary" className={`text-xs px-2 py-0.5 ${getTagColor("person")}`}>
          {getTagLabel("person", tags.person)}
        </Badge>,
      )
    }

    if (tags.time) {
      tagElements.push(
        <Badge key="time" variant="secondary" className={`text-xs px-2 py-0.5 ${getTagColor("time")}`}>
          {getTagLabel("time", tags.time)}
        </Badge>,
      )
    }

    if (tags.product) {
      tagElements.push(
        <Badge key="product" variant="secondary" className={`text-xs px-2 py-0.5 ${getTagColor("product")}`}>
          {getTagLabel("product", tags.product)}
        </Badge>,
      )
    }

    return tagElements
  }

  const formatDeletedTime = (deletedAt: string) => {
    const date = new Date(deletedAt)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      return "刚刚删除"
    } else if (diffInHours < 24) {
      return `${diffInHours}小时前删除`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return `${diffInDays}天前删除`
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="text-muted-foreground">正在加载回收站...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Trash2 className="h-6 w-6 text-red-500" />
              回收站
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">
            {todos.length > 0 ? `${todos.length} 个已删除项目` : "回收站为空"}
          </div>
        </div>

        {/* 警告提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>回收站中的项目可以恢复或永久删除。永久删除后无法恢复！</span>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6 w-6 p-0">
                ×
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 回收站列表 */}
      <div className="space-y-3">
        {todos.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 space-y-2">
            <div className="text-4xl">🗑️</div>
            <p>回收站为空</p>
            <p className="text-xs">删除的项目会出现在这里</p>
            <Button variant="outline" asChild>
              <Link href="/">返回主页</Link>
            </Button>
          </div>
        ) : (
          todos.map((todo) => (
            <Card key={todo.id} className="p-4 bg-red-50 border-red-200">
              <div className="space-y-3">
                {/* 文本内容和标签 */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-h-[24px]">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 flex-wrap">
                        <p className="text-sm leading-relaxed flex-shrink-0 text-gray-700">{truncateText(todo.text)}</p>
                        <div className="flex gap-1 flex-wrap opacity-75">{renderTags(todo.tags)}</div>
                      </div>
                      {/* 删除时间 */}
                      {todo.deletedAt && <p className="text-xs text-red-600">{formatDeletedTime(todo.deletedAt)}</p>}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => restoreTodo(todo.id)}
                      disabled={operatingId === todo.id}
                      className="text-green-600 border-green-300 hover:bg-green-50"
                    >
                      {operatingId === todo.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RotateCcw className="h-3 w-3 mr-1" />
                      )}
                      恢复
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => permanentDelete(todo.id)}
                      disabled={operatingId === todo.id}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {operatingId === todo.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-3 w-3 mr-1" />
                      )}
                      永久删除
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 底部说明 */}
      {todos.length > 0 && (
        <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 border-t">
          <p>💡 提示：恢复的项目将回到主列表，永久删除的项目无法恢复</p>
          <p>🗑️ 回收站帮助您避免误删重要内容</p>
        </div>
      )}
    </div>
  )
}
