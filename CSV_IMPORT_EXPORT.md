# CSV Import/Export Functionality

## Overview
Dear Bones now supports importing and exporting flashcard decks in CSV format, making it easy to share and backup your study materials.

## Export Functionality

### Export All Decks
- Go to Settings → Data Management
- Click "Export All Decks"
- Choose save location
- File format: `all-decks.csv`

### Export Single Deck
- Open any deck for editing
- Click "Export CSV" in the header
- Choose save location
- File format: `[deck-name].csv`

## Import Functionality

### Import to New Decks
- Go to Settings → Data Management
- Click "Import from CSV"
- Select your CSV file
- New decks will be created automatically based on the CSV content

### Import to Existing Deck
- Open any deck for editing
- Click "Import CSV" in the header
- Select your CSV file
- Cards will be added to the current deck

## CSV Format

### Single Deck Format
When exporting a single deck or importing to an existing deck:

#### Text Cards
```csv
Type,Front,Front Audio File,Front Audio Name,Back,Tags,Difficulty,Interval,Study Count
text,"Hello","","","Hola","greetings;basic",0,1,0
text,"Thank you","","","Gracias","greetings;polite",0,1,0
```

#### Audio Cards (for musical intervals, pronunciation, etc.)
```csv
Type,Front,Front Audio File,Front Audio Name,Back,Tags,Difficulty,Interval,Study Count
audio,"","perfect-fifth.mp3","Perfect Fifth","P5","intervals",0,1,0
audio,"","major-third.wav","Major Third","M3","intervals",0,1,0
```

#### Mixed Cards (text + audio)
```csv
Type,Front,Front Audio File,Front Audio Name,Back,Tags,Difficulty,Interval,Study Count
mixed,"Perfect Fifth","perfect-fifth.mp3","Perfect Fifth Audio","P5","intervals",0,1,0
mixed,"Major Third","major-third.wav","Major Third Audio","M3","intervals",0,1,0
```

### Multiple Decks Format
When exporting all decks or importing to create new decks:
```csv
Deck Name,Deck Emoji,Type,Front,Front Audio File,Front Audio Name,Back,Tags,Difficulty,Interval,Study Count
"Spanish Basics","🇪🇸",text,"Hello","","","Hola","greetings;basic",0,1,0
"Music Intervals","🎵",audio,"","perfect-fifth.mp3","Perfect Fifth","P5","intervals",0,1,0
```

## Field Descriptions

- **Type**: Card type - `text`, `audio`, or `mixed` (default: text)
- **Front**: The question or prompt text (required for text and mixed cards)
- **Front Audio File**: Path to audio file for the prompt (required for audio and mixed cards)
- **Front Audio Name**: Display name for the audio (optional, defaults to filename)
- **Back**: The answer or explanation (required)  
- **Tags**: Semicolon-separated tags (optional)
- **Difficulty**: Spaced repetition difficulty factor (0-10, default: 0)
- **Interval**: Days until next review (default: 1)
- **Study Count**: Number of times studied (default: 0)
- **Deck Name**: Name of the deck (for multi-deck format)
- **Deck Emoji**: Emoji for the deck (for multi-deck format)

## LaTeX Support

Dear Bones supports LaTeX mathematical notation in card front and back text. LaTeX is rendered automatically when cards are displayed.

### Supported Delimiters

- **Inline math**: `$...$` or `\(...\)`
- **Display math (centered)**: `$$...$$` or `\[...\]`

### CSV Examples with LaTeX

```csv
Type,Front,Front Audio File,Front Audio Name,Back,Tags,Difficulty,Interval,Study Count
text,"What is the quadratic formula?","","","$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$","math;algebra",0,1,0
text,"Evaluate: $\int x^2 dx$","","","$\frac{x^3}{3} + C$","math;calculus",0,1,0
text,"What is Euler's identity?","","","$$e^{i\pi} + 1 = 0$$","math;famous",0,1,0
```

### LaTeX Tips for CSV

1. **No special escaping needed**: LaTeX backslashes (`\frac`, `\sqrt`) work normally in quoted CSV fields
2. **Dollar signs**: Single `$` for inline, double `$$` for display math
3. **Multi-line equations**: Use display mode (`$$...$$`) for complex equations that benefit from centering
4. **Common commands**:
   - Fractions: `\frac{numerator}{denominator}`
   - Square roots: `\sqrt{x}` or `\sqrt[n]{x}`
   - Subscripts/superscripts: `x_i`, `x^2`, `x_i^2`
   - Greek letters: `\alpha`, `\beta`, `\pi`, `\theta`
   - Summation: `\sum_{i=1}^{n} x_i`
   - Integrals: `\int_a^b f(x) dx`

## Tips

1. **Quotes**: Use double quotes around fields containing commas or special characters
2. **Escaping**: Use double quotes (`""`) to escape quotes within fields
3. **Audio Files**: 
   - Place audio files in the same directory as your CSV file for relative paths
   - Supported formats: MP3, WAV, OGG, M4A, AAC
   - Use relative paths like `audio/perfect-fifth.mp3` for better portability
   - Audio files are automatically copied to the app's storage during import
4. **Tags**: Separate multiple tags with semicolons (`;`)
5. **Encoding**: Save CSV files with UTF-8 encoding for proper emoji and special character support
6. **Headers**: The first row must contain column headers (case-insensitive)

## Error Handling

The import process will:
- Continue processing even if some rows have errors
- Show a summary of successful imports and errors
- Create new decks automatically when importing multiple decks
- Skip rows with missing required fields (Front and Back)

## Sample Files

- `sample-cards.csv`: Single deck format example
- `sample-multiple-decks.csv`: Multiple decks format example 