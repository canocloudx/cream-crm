#!/usr/bin/env python3
"""
Logo Processor for C.R.E.A.M. Coffee
Creates a cyan glowing logo with TRUE transparency
"""

from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import numpy as np

def process_logo(input_path, output_path, scale_factor=4.0):
    """
    Process the logo:
    1. Remove white/light background (true transparency)
    2. Color the elements cyan
    3. Add glow effect
    4. Scale up
    5. Crop to content
    """
    
    # Load image
    img = Image.open(input_path).convert('RGBA')
    print(f"Original size: {img.size}")
    
    # Convert to numpy array for processing
    data = np.array(img)
    
    # Get RGB and Alpha channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Calculate luminance to identify dark (logo) vs light (background) areas
    luminance = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Create mask: dark pixels are the logo (luminance < threshold)
    threshold = 180
    is_logo = luminance < threshold
    
    # Create new RGBA image
    new_data = np.zeros_like(data)
    
    # Cyan color: RGB(0, 255, 255)
    cyan_r, cyan_g, cyan_b = 0, 255, 255
    
    # For logo pixels, set to cyan with opacity based on how dark they are
    opacity = np.clip((threshold - luminance) / threshold * 255, 0, 255).astype(np.uint8)
    
    # Set cyan color for logo areas
    new_data[:,:,0] = np.where(is_logo, cyan_r, 0)
    new_data[:,:,1] = np.where(is_logo, cyan_g, 0)
    new_data[:,:,2] = np.where(is_logo, cyan_b, 0)
    new_data[:,:,3] = np.where(is_logo, opacity, 0)
    
    # Create image from processed data
    processed = Image.fromarray(new_data, 'RGBA')
    
    # Crop to content
    bbox = processed.getbbox()
    if bbox:
        padding = 20
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(processed.width, bbox[2] + padding)
        bottom = min(processed.height, bbox[3] + padding)
        processed = processed.crop((left, top, right, bottom))
    
    print(f"Cropped size: {processed.size}")
    
    # Scale up to high resolution (400% = 4x)
    new_width = int(processed.width * scale_factor)
    new_height = int(processed.height * scale_factor)
    processed = processed.resize((new_width, new_height), Image.Resampling.LANCZOS)
    print(f"Scaled size: {processed.size}")
    
    # Create glow effect
    glow_layer = processed.copy()
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=15))
    
    # Enhance the glow brightness
    enhancer = ImageEnhance.Brightness(glow_layer)
    glow_layer = enhancer.enhance(1.5)
    
    # Create final image with glow
    final_width = processed.width + 100
    final_height = processed.height + 100
    
    final = Image.new('RGBA', (final_width, final_height), (0, 0, 0, 0))
    
    # Paste glow (centered)
    glow_pos = ((final_width - glow_layer.width) // 2, (final_height - glow_layer.height) // 2)
    final.paste(glow_layer, glow_pos, glow_layer)
    
    # Paste sharp logo on top (centered)
    logo_pos = ((final_width - processed.width) // 2, (final_height - processed.height) // 2)
    final.paste(processed, logo_pos, processed)
    
    # Final crop to remove excess transparent space
    bbox = final.getbbox()
    if bbox:
        padding = 10
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(final.width, bbox[2] + padding)
        bottom = min(final.height, bbox[3] + padding)
        final = final.crop((left, top, right, bottom))
    
    print(f"Final size: {final.size}")
    
    # Save with maximum quality
    final.save(output_path, 'PNG', optimize=False)
    print(f"Saved to: {output_path}")
    
    return final


def create_wallet_logos(source_img, output_dir):
    """Create properly sized logos for Apple Wallet"""
    import os
    
    aspect = source_img.width / source_img.height
    
    sizes = {
        'logo.png': (320, 100),
        'logo@2x.png': (640, 200),
        'logo@3x.png': (960, 300),
    }
    
    for filename, (max_w, max_h) in sizes.items():
        if aspect > max_w / max_h:
            new_width = max_w
            new_height = int(max_w / aspect)
        else:
            new_height = max_h
            new_width = int(max_h * aspect)
        
        resized = source_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        output_path = os.path.join(output_dir, filename)
        resized.save(output_path, 'PNG', optimize=False)
        print(f"Created {filename}: {resized.size}")


if __name__ == '__main__':
    import os
    
    input_image = '/Users/canocloudx/.gemini/antigravity/brain/fc910f54-54fb-49e5-a9e3-0ae93e068e14/uploaded_image_1767936682413.png'
    output_image = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/logo-icon-transparent.png'
    
    processed = process_logo(input_image, output_image, scale_factor=4.0)
    
    web_logo_path = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/logo-icon.png'
    processed.save(web_logo_path, 'PNG', optimize=False)
    print(f"\nWeb logo saved to: {web_logo_path}")
    
    pass_template_dir = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/pass-template.pass'
    create_wallet_logos(processed, pass_template_dir)
    
    pass_template_backup = '/Users/canocloudx/.gemini/antigravity/brain/0b57c9b2-5280-4dfb-9c6a-31577dafacfb/cream-crm/pass-template'
    if os.path.exists(pass_template_backup):
        create_wallet_logos(processed, pass_template_backup)
    
    print("\n✅ All logos processed with TRUE transparency!")
