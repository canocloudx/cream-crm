from PIL import Image, ImageFilter

# Load the original uploaded image
img = Image.open('/Users/canocloudx/.gemini/antigravity/brain/3dacd09d-ef42-40bf-8d9c-abe46e42209b/uploaded_image_1767935371768.png').convert('RGBA')
width, height = img.size
print(f"Original size: {width}x{height}")

# Create output image
output = Image.new('RGBA', (width, height), (0, 0, 0, 0))
pixels_in = img.load()
pixels_out = output.load()

# Cyan color
cyan = (0, 255, 255)

# Process each pixel - detect the logo elements (dark pixels) and make them cyan
for y in range(height):
    for x in range(width):
        r, g, b, a = pixels_in[x, y]
        brightness = (r + g + b) / 3
        
        # Background is white/light - make transparent
        if brightness > 180:
            pixels_out[x, y] = (0, 0, 0, 0)
        else:
            # Logo element - the darker it is, the more opaque cyan we make it
            # Map brightness 0-180 to alpha 255-100
            alpha = int(255 - (brightness * 0.86))
            alpha = max(100, min(255, alpha))
            pixels_out[x, y] = (cyan[0], cyan[1], cyan[2], alpha)

# Create glow effect with multiple blur passes
glow_large = output.copy().filter(ImageFilter.GaussianBlur(radius=20))
glow_medium = output.copy().filter(ImageFilter.GaussianBlur(radius=10))
glow_small = output.copy().filter(ImageFilter.GaussianBlur(radius=5))

# Dim the outer glows
glow_large_data = glow_large.load()
glow_medium_data = glow_medium.load()
for y in range(height):
    for x in range(width):
        r, g, b, a = glow_large_data[x, y]
        glow_large_data[x, y] = (r, g, b, int(a * 0.3))
        r, g, b, a = glow_medium_data[x, y]
        glow_medium_data[x, y] = (r, g, b, int(a * 0.5))

# Composite: large glow -> medium glow -> small glow -> sharp logo
result = Image.new('RGBA', (width, height), (0, 0, 0, 0))
result = Image.alpha_composite(result, glow_large)
result = Image.alpha_composite(result, glow_medium)
result = Image.alpha_composite(result, glow_small)
result = Image.alpha_composite(result, output)

# Save original size
result.save('logo-icon-final.png', 'PNG')
print("Saved: logo-icon-final.png (original size)")

# Scale up 400%
new_width = width * 4
new_height = height * 4
result_4x = result.resize((new_width, new_height), Image.Resampling.LANCZOS)
result_4x.save('logo-icon-4x.png', 'PNG')
print(f"Saved: logo-icon-4x.png ({new_width}x{new_height})")

# Also save a copy as the main logo-icon.png
result.save('logo-icon.png', 'PNG')
print("Updated: logo-icon.png")
