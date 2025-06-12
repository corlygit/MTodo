"use client"

import { useState, useMemo, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Sparkles,
  Settings,
  Filter,
  FilterX,
  Loader2,
} from "lucide-react"
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

interface FilterState {
  type: string | null
  value: string | boolean | null
}

// 调用OpenAI API来解析标签
const parseTagsWithAI = async (text: string): Promise<TodoItem["tags"]> => {
  try {
    const response = await fetch("/api/parse-tags", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `API调用失败: ${response.status}`)
    }

    const data = await response.json()
    return data.tags || {}
  } catch (error) {
    console.error("标签解析失败:", error)
    throw error
  }
}

// 数据库API调用函数
const todosAPI = {
  // 获取所有todos
  getAll: async (): Promise<TodoItem[]> => {
    const response = await fetch("/api/todos")
    if (!response.ok) {
      throw new Error("获取数据失败")
    }
    const data = await response.json()
    return data.todos
  },

  // 创建新todo
  create: async (text: string, tags: TodoItem["tags"]): Promise<TodoItem> => {
    const response = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, tags }),
    })
    if (!response.ok) {
      throw new Error("创建失败")
    }
    const data = await response.json()
    return data.todo
  },

  // 更新todo
  update: async (id: string, updates: Partial<TodoItem>): Promise<TodoItem> => {
    const response = await fetch(`/api/todos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error("更新失败")
    }
    const data = await response.json()
    return data.todo
  },

  // 删除todo
  delete: async (id: string): Promise<void> => {
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("删除失败")
    }
  },
}

export default function Component() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [inputValue, setInputValue] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterState>({ type: null, value: null })

  // 初始化加载数据
  useEffect(() => {
    const loadTodos = async () => {
      try {
        setIsInitialLoading(true)
        const todosData = await todosAPI.getAll()
        setTodos(todosData)
      } catch (error) {
        console.error("加载数据失败:", error)
        setError("加载数据失败，请刷新页面重试")
      } finally {
        setIsInitialLoading(false)
      }
    }

    loadTodos()
  }, [])

  // 筛选后的todos
  const filteredTodos = useMemo(() => {
    if (!filter.type || filter.value === null) {
      return todos
    }

    return todos.filter((todo) => {
      const tagValue = todo.tags[filter.type as keyof typeof todo.tags]
      if (filter.type === "todo") {
        return tagValue === filter.value
      }
      return tagValue === filter.value
    })
  }, [todos, filter])

  const addTodo = async () => {
    if (!inputValue.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      // 先解析标签
      const tags = await parseTagsWithAI(inputValue)

      // 创建todo到数据库
      const newTodo = await todosAPI.create(inputValue.trim(), tags)

      // 更新本地状态
      setTodos((prev) => [newTodo, ...prev])
      setInputValue("")
    } catch (error) {
      console.error("添加待办事项失败:", error)
      setError(error instanceof Error ? error.message : "未知错误")

      // 如果是AI解析失败，尝试只保存文本
      if (error instanceof Error && error.message.includes("标签解析")) {
        try {
          const newTodo = await todosAPI.create(inputValue.trim(), {})
          setTodos((prev) => [newTodo, ...prev])
          setInputValue("")
          setError("AI标签解析失败，但内容已保存")
        } catch (dbError) {
          setError("保存失败，请重试")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTodo = async (id: string) => {
    try {
      await todosAPI.delete(id)
      setTodos((prev) => prev.filter((todo) => todo.id !== id))
    } catch (error) {
      console.error("移到回收站失败:", error)
      setError("移到回收站失败，请重试")
    }
  }

  const startEditing = (todo: TodoItem) => {
    setEditingId(todo.id)
    setEditingText(todo.text)
  }

  const saveEdit = async () => {
    if (!editingText.trim() || !editingId) return

    setIsLoading(true)
    setError(null)

    try {
      // 解析新的标签
      const tags = await parseTagsWithAI(editingText)

      // 更新数据库
      const updatedTodo = await todosAPI.update(editingId, {
        text: editingText.trim(),
        tags,
      })

      // 更新本地状态
      setTodos((prev) => prev.map((todo) => (todo.id === editingId ? updatedTodo : todo)))

      setEditingId(null)
      setEditingText("")
    } catch (error) {
      console.error("更新待办事项失败:", error)
      setError(error instanceof Error ? error.message : "未知错误")

      // 如果是AI解析失败，尝试只更新文本
      if (error instanceof Error && error.message.includes("标签解析")) {
        try {
          const updatedTodo = await todosAPI.update(editingId, {
            text: editingText.trim(),
          })
          setTodos((prev) => prev.map((todo) => (todo.id === editingId ? updatedTodo : todo)))
          setEditingId(null)
          setEditingText("")
          setError("AI标签解析失败，但文本已更新")
        } catch (dbError) {
          setError("更新失败，请重试")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingText("")
  }

  const toggleExpand = async (id: string) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    try {
      const updatedTodo = await todosAPI.update(id, {
        isExpanded: !todo.isExpanded,
      })

      setTodos((prev) => prev.map((t) => (t.id === id ? updatedTodo : t)))
    } catch (error) {
      console.error("更新展开状态失败:", error)
      // 对于展开状态的更新失败，我们可以只在本地更新
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, isExpanded: !t.isExpanded } : t)))
    }
  }

  const truncateText = (text: string, maxLength = 80) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text
  }

  const getTagColor = (tagType: string) => {
    const colors = {
      todo: "bg-green-100 text-green-800 hover:bg-green-200",
      person: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      time: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      product: "bg-orange-100 text-orange-800 hover:bg-orange-200",
    }
    return colors[tagType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getTagLabel = (tagType: string, value: any) => {
    if (tagType === "todo") {
      return value ? "待办" : "记录"
    }
    return value
  }

  const handleTagClick = (tagType: string, value: any) => {
    const actualValue = tagType === "todo" ? value : String(value)

    // 如果点击的是当前筛选的标签，则清除筛选
    if (filter.type === tagType && filter.value === (tagType === "todo" ? value : actualValue)) {
      setFilter({ type: null, value: null })
    } else {
      // 否则设置新的筛选
      setFilter({ type: tagType, value: tagType === "todo" ? value : actualValue })
    }
  }

  const clearFilter = () => {
    setFilter({ type: null, value: null })
  }

  const getFilterDisplayText = () => {
    if (!filter.type || filter.value === null) return ""

    const typeNames = {
      todo: "类型",
      person: "人物",
      time: "时间",
      product: "产品",
    }

    const displayValue = filter.type === "todo" ? (filter.value ? "待办" : "记录") : String(filter.value)

    return `${typeNames[filter.type as keyof typeof typeNames]}: ${displayValue}`
  }

  const renderTags = (tags: TodoItem["tags"], isClickable = true) => {
    const tagElements = []

    // 按照指定顺序显示标签
    if (tags.todo !== undefined) {
      const isActive = filter.type === "todo" && filter.value === tags.todo
      tagElements.push(
        <Badge
          key="todo"
          variant="secondary"
          className={`text-xs px-2 py-0.5 ${getTagColor("todo")} ${
            isClickable ? "cursor-pointer transition-all" : ""
          } ${isActive ? "ring-2 ring-green-500 bg-green-200" : ""}`}
          onClick={isClickable ? () => handleTagClick("todo", tags.todo) : undefined}
        >
          {getTagLabel("todo", tags.todo)}
        </Badge>,
      )
    }

    if (tags.person) {
      const isActive = filter.type === "person" && filter.value === tags.person
      tagElements.push(
        <Badge
          key="person"
          variant="secondary"
          className={`text-xs px-2 py-0.5 ${getTagColor("person")} ${
            isClickable ? "cursor-pointer transition-all" : ""
          } ${isActive ? "ring-2 ring-blue-500 bg-blue-200" : ""}`}
          onClick={isClickable ? () => handleTagClick("person", tags.person) : undefined}
        >
          {getTagLabel("person", tags.person)}
        </Badge>,
      )
    }

    if (tags.time) {
      const isActive = filter.type === "time" && filter.value === tags.time
      tagElements.push(
        <Badge
          key="time"
          variant="secondary"
          className={`text-xs px-2 py-0.5 ${getTagColor("time")} ${
            isClickable ? "cursor-pointer transition-all" : ""
          } ${isActive ? "ring-2 ring-purple-500 bg-purple-200" : ""}`}
          onClick={isClickable ? () => handleTagClick("time", tags.time) : undefined}
        >
          {getTagLabel("time", tags.time)}
        </Badge>,
      )
    }

    if (tags.product) {
      const isActive = filter.type === "product" && filter.value === tags.product
      tagElements.push(
        <Badge
          key="product"
          variant="secondary"
          className={`text-xs px-2 py-0.5 ${getTagColor("product")} ${
            isClickable ? "cursor-pointer transition-all" : ""
          } ${isActive ? "ring-2 ring-orange-500 bg-orange-200" : ""}`}
          onClick={isClickable ? () => handleTagClick("product", tags.product) : undefined}
        >
          {getTagLabel("product", tags.product)}
        </Badge>,
      )
    }

    return tagElements
  }

  // 如果正在初始加载，显示加载状态
  if (isInitialLoading) {
    return (
      <div className="max-w-[1000px] mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="text-muted-foreground">正在加载数据...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1000px] mx-auto p-6 space-y-6">
      <div className="space-y-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <h1 className="text-2xl font-semibold flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              AI智能待办清单
            </h1>
            <div className="flex-1 flex justify-end gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/trash">
                  <Trash2 className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">输入内容，AI将智能识别：待办/人物/时间/产品</p>
        </div>

        {/* 筛选状态显示 */}
        {filter.type && (
          <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Filter className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">当前筛选: {getFilterDisplayText()}</span>
            <span className="text-xs text-blue-600">({filteredTodos.length} 项)</span>
            <Button variant="ghost" size="sm" onClick={clearFilter} className="h-6 px-2 text-blue-600">
              <FilterX className="h-3 w-3 mr-1" />
              清除
            </Button>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
            <div className="flex items-center gap-2">
              <X className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto h-6 w-6 p-0">
                <X className="h-3 w-3" />
              </Button>
            </div>
            {error.includes("API密钥") && (
              <div className="mt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings">前往设置</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 输入区域 */}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="例如：明天和张三讨论GitHub项目进展..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                addTodo()
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button onClick={addTodo} disabled={!inputValue.trim() || isLoading} size="icon">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        {isLoading && (
          <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 animate-pulse text-yellow-500" />
            AI正在智能解析标签...
          </div>
        )}
      </div>

      {/* 列表区域 */}
      <div className="space-y-3">
        {filteredTodos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 space-y-2">
            <div className="text-4xl">📝</div>
            {filter.type ? (
              <>
                <p>没有找到匹配的内容</p>
                <p className="text-xs">尝试清除筛选或添加新内容</p>
                <Button variant="outline" size="sm" onClick={clearFilter}>
                  清除筛选
                </Button>
              </>
            ) : (
              <>
                <p>还没有内容</p>
                <p className="text-xs">添加一个开始体验AI智能标签吧！</p>
              </>
            )}
          </div>
        ) : (
          filteredTodos.map((todo) => (
            <Card key={todo.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-2">
                {/* 文本内容和标签在同一行 */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-h-[24px]">
                    {editingId === todo.id ? (
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="min-h-[60px] resize-none"
                        autoFocus
                      />
                    ) : (
                      <div className="space-y-2">
                        {/* 文本和标签在同一行 */}
                        <div className="flex items-start gap-2 flex-wrap">
                          <p className="text-sm leading-relaxed flex-shrink-0">
                            {todo.isExpanded ? todo.text : truncateText(todo.text)}
                          </p>
                          {/* 标签紧跟在文本后面，支持点击筛选 */}
                          <div className="flex gap-1 flex-wrap">{renderTags(todo.tags)}</div>
                        </div>

                        {/* 展开/收起按钮 */}
                        {todo.text.length > 80 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpand(todo.id)}
                            className="h-6 px-2 text-xs text-muted-foreground"
                          >
                            {todo.isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                收起
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                展开
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-1 flex-shrink-0">
                    {editingId === todo.id ? (
                      <>
                        <Button variant="ghost" size="icon" onClick={saveEdit} disabled={isLoading} className="h-8 w-8">
                          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-8 w-8">
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => startEditing(todo)} className="h-8 w-8">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTodo(todo.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700"
                          title="移到回收站"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* 如果没有标签，显示提示 */}
                {Object.keys(todo.tags).length === 0 && (
                  <div className="text-xs text-muted-foreground italic">AI标签解析失败或未配置API密钥</div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 使用说明和统计 */}
      {todos.length > 0 && (
        <div className="text-xs text-muted-foreground text-center space-y-2 pt-4 border-t">
          <p>💡 提示：点击任意标签可筛选相关内容，删除的项目会移到回收站</p>
          <p>
            🏷️ 标签类型：<span className="text-green-600">待办</span> | <span className="text-blue-600">人物</span> |{" "}
            <span className="text-purple-600">时间</span> | <span className="text-orange-600">产品</span>
          </p>
          <p>
            📊 总计：{todos.length} 项内容
            {filter.type && ` | 筛选结果：${filteredTodos.length} 项`}
          </p>
        </div>
      )}
    </div>
  )
}
