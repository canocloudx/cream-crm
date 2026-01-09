#!/usr/bin/env python3
"""
Process logo-icon.png:
1. Remove black background (make transparent)
2. Preserve the cyan neon glow on the symbols
3. Scale up 400%
"""

from PIL import Image

def process_logo():
    # Load the original logo
    img = Image.open('logo-icon.png').convert('RGBA')
    pixels = img.load()
    width, height = img.size
    
    print(f"Original size: {width}x{height}")
    
    # Process each pixel
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            
            # Calculate brightness (max of RGB)
            brightness = max(r, g, b)
            
            # Very dark pixels become transparent
            if brightness < 15:
                pixels[x, y] = (r, g, b, 0)
            else:
                # Use brightness as alpha
                pixels[x, y] = (r, g, b, brightness)
    
    # Scale up 400%
    new_width = width * 4
    new_height = height * 4
    result_scaled = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    print(f"New size: {new_width}x{new_height}")
    
    # Save as PNG to preserve transparency
    result_scaled.save('logo-icon-new.png', 'PNG')
    print("Saved: logo-icon-new.png")
    
    # Also create versions for wallet pass
    pass_logo = img.resize((320, 320), Image.Resampling.LANCZOS)
    pass_logo.save('logo-pass.png', 'PNG')
    print("Saved: logo-pass.png (320x320 for wallet)")
    
    pass_logo_2x = img.resize((640, 640), Image.Resampling.LANCZOS)
    pass_logo_2x.save('logo-pass@2x.png', 'PNG')
    print("Saved: logo-pass@2x.png (640x640 for wallet @2x)")

if __name__ == '__main__':
    process_logo()
