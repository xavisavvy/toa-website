# Chaos Goblin Mode - Audio Setup

## 🎵 Background Music

The Chaos Goblin Mode easter egg plays a background track during the 60-second activation.

## 📥 Audio File Setup

### Required File
- **Location**: `client/public/goblin-mode.mp3`
- **Source**: https://www.youtube.com/watch?v=tB-opEiK16o
- **Duration**: ~60 seconds (or less, will not loop)
- **Volume**: 50% (0.5)

### Option 1: Download Using yt-dlp (Recommended)

```bash
# Install yt-dlp (if not already installed)
npm install -g yt-dlp

# Download the audio
yt-dlp -x --audio-format mp3 \
  -o "client/public/goblin-mode.%(ext)s" \
  https://www.youtube.com/watch?v=tB-opEiK16o
```

### Option 2: Manual Download

1. Visit: https://www.youtube.com/watch?v=tB-opEiK16o
2. Use a YouTube to MP3 converter (e.g., y2mate, mp3download)
3. Save as `client/public/goblin-mode.mp3`

### Option 3: Use Royalty-Free Alternative

If you prefer to avoid potential copyright issues, use a royalty-free goblin/rave song:

**Suggested alternatives:**
- [Incompetech - Pixel Peeker Polka](https://incompetech.com/music/royalty-free/music.html)
- [Kevin MacLeod - Pinball Spring](https://incompetech.com/music/royalty-free/music.html)
- Any Creative Commons goblin/silly music

## ⚠️ Important Notes

### Copyright Considerations
- The YouTube source may be copyrighted
- For production, use royalty-free music or obtain proper licensing
- This is for personal/development use only

### File Requirements
- **Format**: MP3 (browser compatible)
- **Size**: < 5MB recommended
- **Quality**: 128kbps is sufficient
- **Mono/Stereo**: Either is fine

### Fallback Behavior
If the audio file is missing:
- The easter egg still works (visual only)
- Console warning logged
- No error thrown to users

## 🎮 Testing

```bash
# Test that audio loads (check browser console)
npm run dev

# Activate easter egg: ↑↑↓↓←→←→BA
# Should hear music playing at 50% volume
```

## 📝 Code Implementation

```typescript
// Audio is created once per component instance
const [audio] = useState(() => {
  const audioElement = new Audio('/goblin-mode.mp3');
  audioElement.volume = 0.5;  // 50% volume
  audioElement.loop = false;  // Play once
  return audioElement;
});

// Plays when active
audio.play().catch((err) => {
  console.warn('Failed to play Chaos Goblin audio:', err);
});

// Stops when done
audio.pause();
audio.currentTime = 0;
```

## 🔧 Troubleshooting

### Audio not playing?

1. **Check file exists**: `client/public/goblin-mode.mp3`
2. **Check browser console** for errors
3. **Verify autoplay policy**: Some browsers block audio without user interaction
4. **Test file**: Open http://localhost:5173/goblin-mode.mp3 directly

### Browser autoplay blocked?

- First user interaction (Konami code input) should allow playback
- If still blocked, user may need to interact with page first
- Mobile browsers may require additional user gesture

## 📂 File Structure

```
client/public/
  ├── chaos-goblin.svg     # Dancing goblin animation
  └── goblin-mode.mp3      # Background music (YOU NEED TO ADD THIS)
```

## 🎯 Quality Checklist

- [ ] Audio file exists in `client/public/`
- [ ] File is named exactly `goblin-mode.mp3`
- [ ] File size < 5MB
- [ ] File plays in browser
- [ ] Volume is appropriate (not too loud)
- [ ] Duration is ~60 seconds or less
- [ ] Copyright/licensing is addressed

---

**Remember**: The audio file is NOT committed to the repository. You must add it manually in your local environment or deployment pipeline.
