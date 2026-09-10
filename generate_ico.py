import struct

# ICO header: 1 entry
data = b'\x00\x00'  # reserved
data += b'\x01\x00'  # type: 1 = icon
data += b'\x01\x00'  # count: 1 image

# Image dir entry
data += b'\x10\x10'  # width = 16
data += b'\x10\x10'  # height = 16
data += b'\x00'      # color count = 0 (256+)
data += b'\x00'      # reserved
data += b'\x00\x00'  # planes = 0
data += b'\x01\x00'  # bit count = 1
data += b'\x00\x00\x00\x00'  # bytes in resource = 0 (will patch)
data += b'\x00\x00\x00\x00'  # image offset = 0 (will patch)

# Now append minimal XOR mask (16x16, 1-bit = 32 bytes)
xor_mask = bytes([0xFF] * 32)  # solid black

# Patch sizes
data = data[:6] + struct.pack('<H', 1) + data[8:]  # type = 1
data = data[:22] + struct.pack('<I', len(xor_mask)) + struct.pack('<I', 22 + 16) + data[30:]

# Full ICO = header + dir + xor_mask
ico_bytes = data + xor_mask

with open('icons/icon.ico', 'wb') as f:
    f.write(ico_bytes)
