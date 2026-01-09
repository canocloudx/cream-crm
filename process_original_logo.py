from PIL import Image, ImageFilter, ImageEnhance

# Load the original uploaded image
img = Image.open('/Users/canocloudx/.gemini/antigravity/brain/3dacd09d-ef42-40bf-8d9c-abe46e42209b/uploaded_image_1767935371768.png').convert('RGBA')
width, height = img.size
print(f"Original size: {width}x{height}")

pixels = img.load()

# Cyan color for neon effect
cyan = (0, 255, 255)

# Process each pixel
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels[x, y]
        
        # Calculate brightness (how white the pixel is)
        brightness = (r + g + b) / 3
        
        # If pixel is light (white/near-white background), make transparent
        if brightness > 200:
            pixels[x, y] = (0, 0, 0, 0)
        else:
            # For dark pixels (the logo elements), convert to cyan
            # Use inverse brightness as alpha/intensity
            intensity = 255 - int(brightness)
            # Apply cyan color with intensity based on how dark the original was
            alpha = min(255, intensity + 50)  # Ensure visible
            pixels[x, y] = (cyan[0], cyan[1], cyan[2], alpha)

# Create glow effect by making multiple blurred copies
# First, create the base image
base = img.copy()

# Create glow layers
glow1 = img.copy().filter(ImageFilter.GaussianBlur(radius=3))
glow2 = img.copy().filter(ImageFilter.GaussianBlur(radius=8))
glow3 = img.copy().filter(ImageFilter.GaussianBlur(radius=15))

# Composite glow layers (larger, fainter glows first)
result = Image.new('RGBA', (width, height), (0, 0, 0, 0))

# Layer the glows
result = Image.alpha_composite(result, glow3)
result = Image.alpha_composite(result, glow2)
result = Image.alpha_composite(result, glow1)
result = Image.alpha_composite(result, base)

# Scale up 400%
new_width = width * 4
new_height = height * 4
result_scaled = result.resize((new_width, new_height), Image.Resampling.LANCZOS)
print(f"New size: {new_width}x{new_height}")

# Save
result_scaled.save('logo-icon-cyan-glow.png', 'PNG')
print("Saved: logo-icon-cyan-glow.png")

# Also save a smaller version for web use
result_web = result.resize((width, height), Image.Resampling.LANCZOS)
result_web.save('logo-icon-final.png', 'PNG')
print("Saved: logo-icon-final.png (original size with effects)")
