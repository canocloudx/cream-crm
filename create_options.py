from PIL import Image

# Load original
img = Image.open('logo-icon.png').convert('RGB')
width, height = img.size

# Option 1: Match the sidebar background color (#0a0a0c from CSS --bg-dark)
# Create a new image with the sidebar's dark background
sidebar_bg = (10, 10, 12)  # rgba(10, 10, 12) from CSS
option1 = Image.new('RGB', (width, height), sidebar_bg)

# Copy original pixels but replace pure black with sidebar color
pixels_orig = img.load()
pixels_new = option1.load()

for y in range(height):
    for x in range(width):
        r, g, b = pixels_orig[x, y]
        # If it's very dark (near black), use sidebar color
        if max(r, g, b) < 15:
            pixels_new[x, y] = sidebar_bg
        else:
            pixels_new[x, y] = (r, g, b)

# Scale to 400%
option1_scaled = option1.resize((width * 4, height * 4), Image.Resampling.LANCZOS)
option1_scaled.save('logo-icon-option1.png', 'PNG')
print("Saved: logo-icon-option1.png (matched sidebar background)")

# Option 2: Keep original but scale to 400% (for CSS blend mode solution)
img_scaled = img.resize((width * 4, height * 4), Image.Resampling.LANCZOS)
img_scaled.save('logo-icon-option2.png', 'PNG')
print("Saved: logo-icon-option2.png (original for CSS blend)")
