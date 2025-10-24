import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { fal } from "@fal-ai/client"

// Configuration schema for FAL AI API key
export const configSchema = z.object({
	FAL_KEY: z.string().min(1).describe("FAL AI API key for authentication"),
})

// Valid image size presets for SeedDream 4.0
const VALID_IMAGE_SIZES = {
	"square_1024": { width: 1024, height: 1024 },
	"square_1280": { width: 1280, height: 1280 },
	"square_1536": { width: 1536, height: 1536 },
	"portrait_1024": { width: 1024, height: 1280 },
	"portrait_1280": { width: 1280, height: 1600 },
	"landscape_1024": { width: 1280, height: 1024 },
	"landscape_1280": { width: 1600, height: 1280 },
	"wide_1024": { width: 1536, height: 1024 },
	"tall_1024": { width: 1024, height: 1536 },
} as const

type ImageSizePreset = keyof typeof VALID_IMAGE_SIZES

// Zod schema for image size (preset or custom dimensions)
const imageSizeSchema = z.union([
	z.enum([
		"square_1024",
		"square_1280",
		"square_1536",
		"portrait_1024",
		"portrait_1280",
		"landscape_1024",
		"landscape_1280",
		"wide_1024",
		"tall_1024",
	]),
	z.object({
		width: z.number().int().min(1024).max(4096).describe("Image width in pixels"),
		height: z.number().int().min(1024).max(4096).describe("Image height in pixels"),
	}),
])

/**
 * Interface for SeedDream 4.0 API response
 */
interface SeedDream4Response {
	images: Array<{
		url: string
		width?: number
		height?: number
	}>
	seed: number
}

/**
 * Resolve image size parameter to width/height object
 */
function resolveImageSize(
	imageSize?: { width: number; height: number } | ImageSizePreset
): { width: number; height: number } {
	if (!imageSize) {
		return { width: 1280, height: 1280 } // Default size
	}

	if (typeof imageSize === "string") {
		const preset = VALID_IMAGE_SIZES[imageSize]
		if (!preset) {
			throw new Error(
				`Invalid image size preset: ${imageSize}. Valid presets: ${Object.keys(VALID_IMAGE_SIZES).join(", ")}`
			)
		}
		return preset
	}

	return imageSize
}

export default function createServer({
	config,
}: {
	config: z.infer<typeof configSchema>
}) {
	// Configure FAL client with API key from config
	fal.config({
		credentials: config.FAL_KEY,
	})

	const server = new McpServer({
		name: "Seedream v4 MCP Server",
		version: "1.0.0",
	})

	// Add generate_image tool
	server.registerTool(
		"generate_image",
		{
			title: "Generate Image with SeedDream 4.0",
			description:
				"Generate images using Bytedance's SeedDream 4.0 model. A new-generation image creation model that integrates image generation and image editing capabilities into a single, unified architecture.",
			inputSchema: {
				prompt: z.string().describe("The text prompt used to generate the image. Be descriptive for best results."),
				image_size: imageSizeSchema
					.optional()
					.describe(
						"The size of the generated image. Can be a preset (e.g., 'square_1280') or custom dimensions (1024-4096px). Default: square_1280"
					),
				num_images: z
					.number()
					.int()
					.min(1)
					.max(6)
					.optional()
					.describe("Number of separate model generations to be run with the prompt. Default: 1"),
				max_images: z
					.number()
					.int()
					.min(1)
					.max(6)
					.optional()
					.describe(
						"Maximum images per generation. Total images will be between num_images and max_images*num_images. Default: 1"
					),
				seed: z
					.number()
					.int()
					.optional()
					.describe("Random seed to control the stochasticity of image generation. Use the same seed for reproducible results."),
				enable_safety_checker: z
					.boolean()
					.optional()
					.describe("Enable safety checker to filter inappropriate content. Default: true"),
			},
		},
		async ({ prompt, image_size, num_images, max_images, seed, enable_safety_checker }) => {
			try {
				// Resolve image size
				const imageSize = resolveImageSize(image_size as any)

				// Prepare the request payload
				const payload: any = {
					prompt,
					image_size: imageSize,
					num_images: num_images || 1,
					max_images: max_images || 1,
					sync_mode: false, // Mandatory: set to false as per requirements
					enable_safety_checker: enable_safety_checker !== false,
				}

				if (seed !== undefined) {
					payload.seed = seed
				}

				// Call the SeedDream 4.0 API
				const result = (await fal.subscribe("fal-ai/bytedance/seedream/v4/text-to-image", {
					input: payload,
					logs: true,
					onQueueUpdate: (update) => {
						if (update.status === "IN_PROGRESS") {
							update.logs?.map((log) => log.message).forEach((msg) => console.error(`[SeedDream 4.0] ${msg}`))
						}
					},
				})) as { data: SeedDream4Response }

				const response = result.data

				if (!response.images || response.images.length === 0) {
					throw new Error("No images were generated")
				}

				// Format the response
				const imageDescriptions = response.images
					.map((img, index) => {
						const dimensions = img.width && img.height ? ` (${img.width}x${img.height})` : ` (${imageSize.width}x${imageSize.height})`
						return `Image ${index + 1}${dimensions}:\n  URL: ${img.url}`
					})
					.join("\n\n")

				return {
					content: [
						{
							type: "text",
							text: `Successfully generated ${response.images.length} image(s) using SeedDream 4.0:\n\nPrompt: "${prompt}"\nImage Size: ${imageSize.width}x${imageSize.height}\nNumber of Images: ${payload.num_images}\nMax Images per Generation: ${payload.max_images}\nSafety Checker: ${payload.enable_safety_checker ? "Enabled" : "Disabled"}\nSeed Used: ${response.seed}\n\nGenerated Images:\n${imageDescriptions}`,
						},
					],
				}
			} catch (error) {
				console.error("Error generating image:", error)
				return {
					content: [
						{
							type: "text",
							text: `Error generating image: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
						},
					],
					isError: true,
				}
			}
		}
	)

	return server.server
}
