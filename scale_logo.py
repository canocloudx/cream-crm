from PIL import Image

# Load original and scale 400%
img = Image.open('logo-icon.png')
width, height = img.size
print(f"Original: {width}x{height}")

new_width = width * 4
new_height = height * 4
scaled = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
scaled.save('logo-icon-4x.png', 'PNG')
print(f"Saved logo-icon-4x.png: {new_width}x{new_height}")
