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
```csv
Front,Back,Tags,Difficulty,Interval,Study Count
"Hello","Hola","greetings;basic",0,1,0
"Thank you","Gracias","greetings;polite",0,1,0
```

### Multiple Decks Format
When exporting all decks or importing to create new decks:
```csv
Deck Name,Deck Emoji,Front,Back,Tags,Difficulty,Interval,Study Count
"Spanish Basics","🇪🇸","Hello","Hola","greetings;basic",0,1,0
"French Basics","🇫🇷","Hello","Salut","greetings;basic",0,1,0
```

## Field Descriptions

- **Front**: The question or prompt (required)
- **Back**: The answer or explanation (required)  
- **Tags**: Semicolon-separated tags (optional)
- **Difficulty**: Spaced repetition difficulty factor (0-10, default: 0)
- **Interval**: Days until next review (default: 1)
- **Study Count**: Number of times studied (default: 0)
- **Deck Name**: Name of the deck (for multi-deck format)
- **Deck Emoji**: Emoji for the deck (for multi-deck format)

## Tips

1. **Quotes**: Use double quotes around fields containing commas or special characters
2. **Escaping**: Use double quotes (`""`) to escape quotes within fields
3. **Tags**: Separate multiple tags with semicolons (`;`)
4. **Encoding**: Save CSV files with UTF-8 encoding for proper emoji and special character support
5. **Headers**: The first row must contain column headers (case-insensitive)

## Error Handling

The import process will:
- Continue processing even if some rows have errors
- Show a summary of successful imports and errors
- Create new decks automatically when importing multiple decks
- Skip rows with missing required fields (Front and Back)

## Sample Files

- `sample-cards.csv`: Single deck format example
- `sample-multiple-decks.csv`: Multiple decks format example 