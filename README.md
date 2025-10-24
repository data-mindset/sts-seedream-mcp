# Seedream v4 MCP Server

[![smithery badge](https://smithery.ai/badge/@data-mindset/sts-seedream-mcp)](https://smithery.ai/server/@data-mindset/sts-seedream-mcp)

MCP server for generating images using Bytedance's SeedDream 4.0 model via FAL AI.

Built with [Smithery SDK](https://smithery.ai/docs)

## Features

- Advanced text-to-image generation with SeedDream 4.0
- Flexible image sizing (1024x1024 to 4096x4096)
- Multi-image generation capabilities
- Enhanced safety checking
- Unified architecture for generation and editing

## Prerequisites

- **FAL AI API Key**: Get yours at [fal.ai](https://fal.ai/)
- **Smithery API key**: Get yours at [smithery.ai/account/api-keys](https://smithery.ai/account/api-keys)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```
   You'll be prompted to enter your FAL AI API key.

3. Try the `generate_image` tool with a prompt like:
   ```
   "A futuristic cityscape at sunset with flying cars"
   ```

## Development

Your code is organized as:
- [src/index.ts](src/index.ts) - MCP server with SeedDream 4.0 tool
- [smithery.yaml](smithery.yaml) - Runtime specification

Edit [src/index.ts](src/index.ts) to customize the tool.

## Tool: generate_image

Generate images using SeedDream 4.0 model.

**Parameters:**
- `prompt` (required): Text description of the image
- `image_size` (optional): Preset (e.g., "square_1280") or custom {width, height} (1024-4096px)
- `num_images` (optional): Number of generations (1-6, default: 1)
- `max_images` (optional): Max images per generation (1-6, default: 1)
- `seed` (optional): Random seed for reproducibility
- `enable_safety_checker` (optional): Filter inappropriate content (default: true)

**Image Size Presets:**
- Square: `square_1024`, `square_1280`, `square_1536`
- Portrait: `portrait_1024`, `portrait_1280`
- Landscape: `landscape_1024`, `landscape_1280`
- Special: `wide_1024`, `tall_1024`

## Build

```bash
npm run build
```

Creates bundled server in `.smithery/`

## Deploy

1. Create a new repository at [github.com/new](https://github.com/new)

2. Initialize git and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. Deploy to Smithery at [smithery.ai/new](https://smithery.ai/new)

4. Configure with your FAL AI API key during deployment.

## Learn More

- [Smithery Docs](https://smithery.ai/docs)
- [MCP Protocol](https://modelcontextprotocol.io)
- [FAL AI](https://fal.ai)

## License

MIT
