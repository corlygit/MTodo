"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Key, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [isTestingKey, setIsTestingKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: "请输入API密钥" })
      return
    }

    setIsTestingKey(true)
    setTestResult(null)

    try {
      // 测试API密钥是否有效
      const response = await fetch("/api/parse-tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ text: "测试文本" }),
      })

      if (response.ok) {
        setTestResult({ success: true, message: "API密钥验证成功！" })
      } else {
        const error = await response.json()
        setTestResult({ success: false, message: error.error || "API密钥验证失败" })
      }
    } catch (error) {
      setTestResult({ success: false, message: "网络错误，请检查连接" })
    } finally {
      setIsTestingKey(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-semibold">设置</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            OpenAI API 配置
          </CardTitle>
          <CardDescription>配置你的OpenAI API密钥来启用AI智能标签解析功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API 密钥</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">你的API密钥将安全存储在本地，不会上传到服务器</p>
          </div>

          <Button onClick={testApiKey} disabled={isTestingKey || !apiKey.trim()}>
            {isTestingKey ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                测试中...
              </>
            ) : (
              "测试连接"
            )}
          </Button>

          {testResult && (
            <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>如何获取OpenAI API密钥？</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p className="font-medium">步骤：</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>访问 OpenAI 官网并注册账户</li>
              <li>进入 API Keys 页面</li>
              <li>点击 "Create new secret key" 创建新密钥</li>
              <li>复制生成的密钥（以 sk- 开头）</li>
              <li>将密钥粘贴到上方输入框中</li>
            </ol>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                获取API密钥
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="https://platform.openai.com/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看文档
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>环境变量配置</CardTitle>
          <CardDescription>如果你是开发者，也可以通过环境变量配置API密钥</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 p-3 rounded-md font-mono text-sm">
            <p className="text-gray-600"># .env.local</p>
            <p>OPENAI_API_KEY=your_api_key_here</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">重启应用后生效</p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button asChild>
          <Link href="/">返回主页</Link>
        </Button>
      </div>
    </div>
  )
}
