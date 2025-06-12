import { generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

const TagsSchema = z.object({
  todo: z.boolean().optional().describe("是否是待办事项或任务"),
  person: z.string().optional().describe("涉及的人物，如：张三、李四、团队、客户等"),
  time: z.string().optional().describe("时间信息，如：今天、明天、下周、3月15日等"),
  product: z.string().optional().describe("产品或网站名称，如：GitHub、微信、淘宝等"),
})

export async function POST(request: Request) {
  try {
    // 检查API密钥是否存在
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY 环境变量未设置")
      return Response.json(
        {
          error: "OpenAI API密钥未配置，请设置OPENAI_API_KEY环境变量",
        },
        { status: 500 },
      )
    }

    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "请提供有效的文本内容" }, { status: 400 })
    }

    const { object: tags } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: TagsSchema,
      prompt: `
        请按照以下顺序分析输入文本，并提取相应标签：
        
        输入文本：${text}
        
        分析顺序和标记规则：
        1. 是否是todo（待办事项）？
           - 必须包含明确的时间点，比如前后、xx日期；如果包含需要执行的时间、任务、计划、目标等，标记为 todo: true

        
        2. 有人物吗？
           - 提取具体人名、角色、团体等
           - 如：张三、李经理、开发团队、客户、用户等
           - 标记在 person 字段
        3. 有明确的【tag】类型吗？
           - 提取tag
           - 标记在 tag 字段

        
        4. 有网址或产品吗？
           - 提取网站、应用、产品名称
           - 如：GitHub、微信、淘宝、百度、ChatGPT等
           - 标记在 product 字段，同时增加一个tag：产品
        
        注意：
        - 如果同时符合多个条件，可以都标记
        - 提取的标签应该简洁明了，通常1-4个字
        - 要符合中文表达习惯
        - 优先提取最明确和最重要的信息
        - 如果某个维度不明确，可以不标记
      `,
    })

    return Response.json({ tags })
  } catch (error) {
    console.error("OpenAI API调用失败:", error)

    // 更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes("401")) {
        return Response.json(
          {
            error: "OpenAI API密钥无效，请检查OPENAI_API_KEY是否正确",
          },
          { status: 401 },
        )
      }
      if (error.message.includes("429")) {
        return Response.json(
          {
            error: "API调用频率超限，请稍后重试",
          },
          { status: 429 },
        )
      }
      if (error.message.includes("quota")) {
        return Response.json(
          {
            error: "API配额已用完，请检查OpenAI账户余额",
          },
          { status: 402 },
        )
      }
    }

    return Response.json(
      {
        error: "标签解析失败，请稍后重试",
      },
      { status: 500 },
    )
  }
}
