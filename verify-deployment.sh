#!/bin/bash

echo "🚀 部署验证脚本"
echo "=================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查Railway后端
echo -e "\n${YELLOW}检查Railway后端...${NC}"
RAILWAY_HEALTH=$(curl -s https://dbtknight-production.up.railway.app/health)
if [[ $RAILWAY_HEALTH == *"healthy"* ]]; then
    echo -e "${GREEN}✅ Railway后端健康检查通过${NC}"
else
    echo -e "${RED}❌ Railway后端健康检查失败${NC}"
fi

# 检查Railway API
echo -e "\n${YELLOW}检查Railway API...${NC}"
RAILWAY_API=$(curl -s https://dbtknight-production.up.railway.app/api/generate-contract)
if [[ $RAILWAY_API == *"Contract API is running"* ]]; then
    echo -e "${GREEN}✅ Railway API测试通过${NC}"
else
    echo -e "${RED}❌ Railway API测试失败${NC}"
fi

# 检查Netlify前端（通过GitHub Pages或直接访问）
echo -e "\n${YELLOW}检查Netlify前端...${NC}"
NETLIFY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://dbtknight.netlify.app)
if [[ $NETLIFY_STATUS == "200" ]]; then
    echo -e "${GREEN}✅ Netlify前端可访问${NC}"
else
    echo -e "${YELLOW}⚠️  Netlify前端可能还在部署中 (HTTP $NETLIFY_STATUS)${NC}"
fi

# 检查GitHub状态
echo -e "\n${YELLOW}检查GitHub仓库状态...${NC}"
GITHUB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://github.com/DTBknight/Car-Quote)
if [[ $GITHUB_STATUS == "200" ]]; then
    echo -e "${GREEN}✅ GitHub仓库可访问${NC}"
else
    echo -e "${RED}❌ GitHub仓库访问失败${NC}"
fi

echo -e "\n${GREEN}🎉 部署验证完成！${NC}"
echo -e "\n📋 部署信息："
echo -e "  后端: ${GREEN}https://dbtknight-production.up.railway.app${NC}"
echo -e "  前端: ${GREEN}https://dbtknight.netlify.app${NC}"
echo -e "  仓库: ${GREEN}https://github.com/DTBknight/Car-Quote${NC}" 