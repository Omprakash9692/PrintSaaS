# 🖨️ PrintSaaS Print Agent

The PrintSaaS Agent connects your Xerox / Print Shop's physical printer to your **PrintSaaS** online store. Once running, customer print orders uploaded on your website will print automatically on your shop printer without needing manual file downloads or USB drives.

---

## 🚀 Quick Setup for Xerox Shop Owners

### 1. Prerequisites
- A PC running Windows, macOS, or Linux connected to your printer.
- Node.js installed ([Download Node.js](https://nodejs.org/)).

### 2. Configuration
1. Open your PrintSaaS Shop Owner Dashboard on the website.
2. Click **"Connect Print Agent"** to generate your unique **Agent Token**.
3. In the `print-agent` folder, create a `.env` file (or edit `.env`):

```env
# URL of your PrintSaaS Backend Server
API_URL=http://localhost:5000/api

# Paste your Agent Token copied from the Shop Dashboard
AGENT_TOKEN=your_generated_agent_token_here

# Mode: 'real' (for shop physical printer) or 'mock' (for development testing without a printer)
PRINTER_MODE=real

# (Optional) Name of specific printer. Leave blank to use System Default Printer.
PRINTER_NAME=
```

### 3. Running the Agent

#### On Windows:
Double-click **`start-agent.bat`**!

#### Via Command Prompt / Terminal:
```bash
npm install
npm start
```

---

## 🧪 Developer Testing (Without a Printer)

If you are developing or testing on a laptop without a printer connected:
Set `PRINTER_MODE=mock` in `.env`.

When orders arrive:
- The agent simulates paper printing.
- Processed PDFs are saved to the `printed_jobs/` folder for visual verification.
- Order status automatically updates to `COMPLETED` on the dashboard.
