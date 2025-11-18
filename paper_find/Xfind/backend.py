import http.client
import json
import ssl
import os
try:
    import certifi
    _SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except Exception:
    # 兼容环境无certifi的情况，回退到系统默认证书
    _SSL_CONTEXT = ssl.create_default_context()
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import API_CONFIG, get_auth_header

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 从config.py导入API配置
API_HOST = API_CONFIG['host']
API_KEY = API_CONFIG['api_key']
API_SECRET = API_CONFIG['api_secret']
FLOW_ID = API_CONFIG['flow_id']
API_ENDPOINT = API_CONFIG['endpoint']
API_TIMEOUT = API_CONFIG['timeout']

print(f"\n🔧 API配置加载成功:")
print(f"   主机: {API_HOST}")
print(f"   Flow ID: {FLOW_ID}")
print(f"   端点: {API_ENDPOINT}\n")


@app.route('/api/get-papers', methods=['POST'])
def get_papers():
    """获取论文推荐"""
    try:
        # 获取用户输入的研究方向
        user_input = request.json.get('research_topic', '')
        
        if not user_input:
            return jsonify({"error": "请输入研究方向"}), 400
        
        # 选择是否使用Few-shot提示（可以通过环境变量或配置控制）
        use_fewshot = False  # 改为False可以直接发送原始输入（当前API不支持Few-shot格式）
        
        if use_fewshot:
            # 构建简洁的Few-shot提示词
            enhanced_prompt = f"""{user_input}

请推荐5篇相关论文，严格按照以下JSON格式返回（不要其他说明）：

{{
  "papers": [
    {{
      "title": "论文标题",
      "authors": "作者列表",
      "abstract": "论文摘要（150-200字）",
      "year": 2024,
      "venue": "会议或期刊",
      "tags": ["标签1", "标签2"]
    }}
  ]
}}"""
        else:
            # 直接使用用户输入
            enhanced_prompt = user_input
        
        # 构建请求头
        headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Authorization": f"Bearer {API_KEY}:{API_SECRET}",
        }
        
        # 构建请求数据
        data = {
            "flow_id": FLOW_ID,
            "uid": "123",
            "parameters": {"AGENT_USER_INPUT": enhanced_prompt},
            "ext": {"bot_id": "paper_recommendation", "caller": "workflow"},
            "stream": False,
        }
        payload = json.dumps(data)
        
        print(f"\n{'='*60}")
        print(f"📝 用户输入: {user_input}")
        print(f"🚀 发送请求到API...")
        
        # 发送请求
        # 使用 certifi 的CA证书，避免在macOS等环境下出现证书链缺失
        conn = http.client.HTTPSConnection(API_HOST, timeout=API_TIMEOUT, context=_SSL_CONTEXT)
        conn.request(
            "POST", API_ENDPOINT, payload, headers, encode_chunked=True
        )
        res = conn.getresponse()
        
        # 读取响应
        response_data = res.read()
        result = json.loads(response_data.decode("utf-8"))
        
        print(f"✅ 收到API响应")
        
        # 检查API错误码
        if isinstance(result, dict) and 'code' in result:
            if result['code'] != 0:
                error_msg = result.get('message', '未知错误')
                print(f"❌ API返回错误码: {result['code']}")
                print(f"❌ 错误信息: {error_msg}")
                return jsonify({
                    "error": f"API错误 ({result['code']}): {error_msg}",
                    "code": result['code'],
                    "details": result
                }), 400
        
        print(f"📦 原始响应: {json.dumps(result, ensure_ascii=False, indent=2)[:500]}...")
        
        conn.close()
        
        # 尝试解析并标准化响应格式
        parsed_result = parse_api_response(result)
        
        print(f"✨ 解析后数据: {json.dumps(parsed_result, ensure_ascii=False, indent=2)[:300]}...")
        print(f"{'='*60}\n")
        
        return jsonify(parsed_result), 200
        
    except Exception as e:
        print(f"❌ 错误: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


def parse_api_response(result):
    """解析API响应，提取论文数据"""
    try:
        print(f"🔍 开始解析响应，数据类型: {type(result)}")
        
        # 格式1: 直接是标准格式 {"papers": [...]}
        if isinstance(result, dict) and 'papers' in result:
            print("✅ 格式1: 直接包含papers字段")
            return result
        
        # 格式2: 嵌套格式 {data: {"papers": [...]}} 或类似
        if isinstance(result, dict):
            # 尝试查找所有可能包含papers的嵌套字段
            for key, value in result.items():
                if isinstance(value, dict) and 'papers' in value:
                    print(f"✅ 格式2: 在 {key} 字段中找到papers")
                    return value
                # 如果value是字符串，尝试解析
                if isinstance(value, str):
                    try:
                        parsed = json.loads(value)
                        if isinstance(parsed, dict) and 'papers' in parsed:
                            print(f"✅ 格式2b: 在 {key} 字段的字符串中解析出papers")
                            return parsed
                    except:
                        pass
        
        # 格式3: OpenAI/ChatGPT格式 {"choices": [{"message/delta": {"content": "..."}}]}
        if isinstance(result, dict) and 'choices' in result:
            print("🔍 检测到choices格式，尝试提取content")
            
            # 尝试从 delta 或 message 中获取 content
            choice = result['choices'][0]
            content = None
            
            if 'delta' in choice and 'content' in choice['delta']:
                content = choice['delta']['content']
                print("✅ 从 delta.content 提取")
            elif 'message' in choice and 'content' in choice['message']:
                content = choice['message']['content']
                print("✅ 从 message.content 提取")
            
            if content:
                # 去除可能的前导空格
                content = content.strip()
                
                # 尝试从content中提取JSON
                import re
                
                # 方法1: 查找JSON代码块
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
                if json_match:
                    content = json_match.group(1)
                    print("✅ 从markdown代码块提取JSON")
                
                # 方法2: 智能提取JSON对象
                else:
                    # 找到第一个 {
                    start = content.find('{')
                    if start != -1:
                        # 从第一个 { 开始，找到匹配的 }
                        brace_count = 0
                        json_end = -1
                        
                        for i in range(start, len(content)):
                            if content[i] == '{':
                                brace_count += 1
                            elif content[i] == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    json_end = i + 1
                                    break
                        
                        if json_end != -1:
                            content = content[start:json_end]
                            print(f"✅ 智能提取JSON对象 (长度: {len(content)})")
                        else:
                            print("⚠️ 未找到匹配的闭合括号，使用原始content")
                    else:
                        print("⚠️ content中没有找到JSON对象")
                
                # 解析JSON
                try:
                    parsed = json.loads(content)
                    if 'papers' in parsed:
                        print(f"✅ 格式3: 成功解析，包含 {len(parsed['papers'])} 篇论文")
                        return parsed
                    else:
                        print("⚠️ 解析成功但未找到papers字段")
                except json.JSONDecodeError as e:
                    print(f"❌ JSON解析失败: {e}")
                    print(f"   内容长度: {len(content)}")
                    print(f"   前200字符: {content[:200]}")
                    print(f"   后100字符: {content[-100:]}")
                    
                    # 尝试修复常见问题
                    try:
                        # 移除可能的尾部逗号
                        content_fixed = re.sub(r',\s*}', '}', content)
                        content_fixed = re.sub(r',\s*]', ']', content_fixed)
                        parsed = json.loads(content_fixed)
                        if 'papers' in parsed:
                            print(f"✅ 修复后解析成功，包含 {len(parsed['papers'])} 篇论文")
                            return parsed
                    except:
                        pass
        
        # 格式4: 直接是字符串
        if isinstance(result, str):
            print("🔍 响应是字符串，尝试解析JSON")
            parsed = json.loads(result)
            if 'papers' in parsed:
                print("✅ 格式4: 字符串解析成功")
                return parsed
        
        # 如果都不是，打印结构帮助调试
        print(f"⚠️ 未识别的格式，响应结构: {list(result.keys()) if isinstance(result, dict) else type(result)}")
        print(f"📦 原始响应前200字符: {str(result)[:200]}")
        
        return result
        
    except Exception as e:
        print(f"❌ 解析响应失败: {e}")
        import traceback
        traceback.print_exc()
        # 解析失败时返回原始结果
        return result


@app.route('/api/save-selection', methods=['POST'])
def save_selection():
    """保存用户选择的论文"""
    try:
        selected_papers = request.json.get('selected_papers', [])
        
        # 这里可以将选择的论文保存到数据库或文件
        # 暂时只返回确认信息
        print(f"用户选择的论文: {selected_papers}")
        
        return jsonify({
            "success": True,
            "message": f"成功保存 {len(selected_papers)} 篇论文",
            "count": len(selected_papers)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/')
def index():
    """根路径提示信息"""
    return """
    <html>
    <head>
        <title>PaperSwipe API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                text-align: center;
                background: rgba(255,255,255,0.1);
                padding: 40px;
                border-radius: 20px;
                backdrop-filter: blur(10px);
            }
            h1 { font-size: 48px; margin: 0 0 20px 0; }
            p { font-size: 18px; margin: 10px 0; }
            .status { color: #4ade80; font-weight: bold; }
            code {
                background: rgba(0,0,0,0.3);
                padding: 5px 10px;
                border-radius: 5px;
                display: inline-block;
                margin: 5px 0;
            }
            ul { text-align: left; display: inline-block; }
            li { margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 PaperSwipe API</h1>
            <p class="status">✅ 后端服务器运行中</p>
            <hr style="margin: 30px 0; border: 1px solid rgba(255,255,255,0.3);">
            <h2>📋 使用说明</h2>
            <p>这是API服务器，不提供网页界面</p>
            <p>请按以下步骤使用：</p>
            <ul>
                <li><strong>方法1：</strong>直接双击打开 <code>index.html</code></li>
                <li><strong>方法2：</strong>在浏览器输入 <code>file:///D:/PROGRAM/2/新建文件夹/index.html</code></li>
                <li><strong>方法3：</strong>新开命令行运行 <code>python -m http.server 8080</code><br>
                    然后访问 <code>http://localhost:8080</code></li>
            </ul>
            <hr style="margin: 30px 0; border: 1px solid rgba(255,255,255,0.3);">
            <h2>🔌 API 端点</h2>
            <ul>
                <li><code>POST /api/get-papers</code> - 获取论文推荐</li>
                <li><code>POST /api/save-selection</code> - 保存论文选择</li>
            </ul>
        </div>
    </body>
    </html>
    """


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    print(f"服务器启动在 http://localhost:{port}")
    print("=" * 50)
    print("⚠️  注意：这是API服务器，不提供网页界面")
    print("📋 请在浏览器中打开 index.html 文件")
    print("   或运行: python -m http.server 8080")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=port)

