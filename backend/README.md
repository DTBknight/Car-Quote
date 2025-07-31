# 合同管理后端服务

## 功能说明

这是一个基于Flask的合同管理后端服务，主要功能包括：

1. 接收前端表单数据
2. 加载Excel模板文件
3. 填充数据到指定单元格
4. 生成并返回可下载的Excel文件

## 安装依赖

```bash
pip install -r requirements.txt
```

## 运行服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动

## API接口

### 1. 健康检查
- **GET** `/health`
- 返回服务状态信息

### 2. 生成合同
- **POST** `/generate-contract`
- 接收合同数据并生成Excel文件
- 请求体格式：
```json
{
  "buyerName": "买方名称",
  "buyerPhone": "买方电话", 
  "buyerAddress": "买方地址",
  "contractNumber": "合同编号",
  "contractDate": "合同日期",
  "contractLocation": "合同地点"
}
```

### 3. 获取模板信息
- **GET** `/template-info`
- 返回模板文件的基本信息

## 文件结构

```
backend/
├── app.py              # 主应用文件
├── requirements.txt    # Python依赖
├── template.xlsx       # Excel模板文件
├── outputs/           # 生成的输出文件目录
└── README.md          # 说明文档
```

## 注意事项

- 确保 `template.xlsx` 文件存在于项目根目录
- 生成的Excel文件会保存在 `outputs/` 目录中
- 服务支持跨域请求（CORS） 