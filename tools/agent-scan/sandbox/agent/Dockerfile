# 以 digest 鎖定 base image：tag 會被重新指向，digest 不會
ARG NODE_IMAGE=node:22-bookworm-slim@sha256:4b150b48b4116e2a22f2c39cc27025fbf4f153e2078fd3b14d159fdb5c7279da
FROM ${NODE_IMAGE}

# 在這裡安裝 agent CLI，而且一定要鎖「確切版本」，例如：
#   RUN npm install -g @openai/codex@<x.y.z>
#   RUN npm install -g @anthropic-ai/claude-code@<x.y.z>
# 不帶版本的 npm install -g，正是第 3、4 篇談的供應鏈風險。

# node image 內建 uid 1000 的 node 使用者，不用 root 跑 agent
USER node
WORKDIR /workspace
CMD ["sleep", "infinity"]
