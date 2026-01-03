# Sui Transaction Explainer

A professional, feature-rich web application designed to decode complex Sui blockchain transactions into clear, human-readable summaries. Built for the Sui RFP Program.

## 🚀 Live Demo
[Link to your hosted MVP]

## ✨ Features
- **Plain Language Summaries**: Translates hex codes and raw data into sentences like "Alice transferred NFT #1234 to Bob."
- **SUI Denomination**: Automatically converts gas costs and balance changes from MIST to SUI.
- **Transaction Flow Visualization**: Visual representation of the Sender → Action → Result flow.
- **Smart Contract Insights**: Extracts and labels Move calls, modules, and functions.
- **Premium Aesthetics**: High-performance UI designed with Glassmorphism and modern typography.
- **Social Sharing**: Dynamic OpenGraph metadata for sharing specific transaction digests.

## 🏗️ Architecture
- **Framework**: Next.js (App Router) for a robust full-stack foundation.
- **Engine**: Client-side fetching using `@mysten/sui` to ensure requests are distributed across users (avoiding shared rate limits).
- **Styles**: Vanilla CSS for maximum performance and design flexibility.
- **Parsing Logic**: Custom utility layer that interprets `ProgrammableTransaction` commands and `ObjectChanges`.

## 📊 Data Source
- **Sui RPC**: Interacts directly with the Sui Mainnet RPC via the official `@mysten/sui` SDK.
- **Network**: Defaults to `mainnet` (configurable via environment variables).

## 🛠️ Installation & Usage

1. **Clone and Install**:
```bash
git clone <repository-url>
cd frontend
npm install
```

2. **Run Development Server**:
```bash
nvm use 20
npm run dev
```

3. **Build for Production**:
```bash
npm run build
npm run start
```

## 📝 License
MIT
