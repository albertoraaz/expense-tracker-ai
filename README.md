# Expense Tracker AI

An enterprise-grade, intelligent financial management system built with **Next.js 14**, **TypeScript**, and the **Model Context Protocol (MCP)**. This project transforms traditional expense tracking into an AI-augmented experience, leveraging structured context for automated financial analysis.

---

## 🏛️ System Architecture

This project follows a decoupled, agentic architecture. It is designed not just as a standalone web app, but as a host for AI agents to interact with financial data.

### Technical Stack
* **Frontend:** [Next.js 14](https://nextjs.org/) (App Router) with [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/)
* **AI Integration:** [Model Context Protocol (MCP)](https://modelcontextprotocol.io)
* **State Management:** React Hooks & Context API
* **Environment:** Optimized for **Ubuntu 22.04+**

---

## AI Ecosystem Integration (MCP)

This project is built to be "AI-First." It exposes primitives that allow LLMs (Claude, GPT-4) to interact with your data safely and effectively.

| Primitive | Purpose | Implementation |
| :--- | :--- | :--- |
| **Tools** | Active Actions | `add_expense`, `delete_transaction`, `query_monthly_total` |
| **Resources** | Ground Truth | `docs://compliance-rules`, `file://current_budget.json` |
| **Prompts** | Expert Logic | `analyze-spending-habits`, `detect-fraud-patterns` |


![Dashboard Overview](https://github.com/user-attachments/assets/c47cb4cd-90bd-4ab9-92d6-452e04d25cce)

---

## Getting Started

### 1. Prerequisites
Ensure your Ubuntu environment has the following:
* **Node.js:** v20.x (LTS) or later
* **Package Manager:** `npm` or `bun`
* **MCP Inspector:** Required for debugging AI tools (`npx @modelcontextprotocol/inspector`)

### 2. Installation
```bash
# Clone the repository
git clone [https://github.com/albertoraaz/expense-tracker-ai.git](https://github.com/albertoraaz/expense-tracker-ai.git)
cd expense-tracker-ai

# Install dependencies
npm install
