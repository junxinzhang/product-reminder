# 使用Node.js官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 设置时区
RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

# 复制package.json文件
COPY package*.json ./

# 安装后端依赖
RUN npm install --production

# 复制后端代码
COPY server/ ./server/

# 复制客户端package.json
COPY client/package*.json ./client/

# 安装前端依赖并构建
WORKDIR /app/client
RUN npm install
COPY client/ ./
RUN npm run build

# 回到根目录
WORKDIR /app

# 创建数据目录
RUN mkdir -p /app/data

# 复制环境配置文件
COPY .env.example .env

# 暴露端口
EXPOSE 3000

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# 启动应用
CMD ["npm", "start"]