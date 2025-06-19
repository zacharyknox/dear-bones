# 💀 Dear Bones - Flashcards Application

A minimalist, user-driven flashcards application designed for creating, organizing, and studying personalized flashcard decks. Built with Electron, React, TypeScript, and Tailwind CSS.

## ✨ Features

### 📋 Deck Management
- Create, name, and edit flashcard decks
- Add custom tags and categories
- Custom emoji icons for deck thumbnails
- Search and filter decks by name or tags

### 🃏 Flashcard Management
- Add, edit, and delete cards with front/back content
- Support for rich text formatting
- Tag-based organization
- Bulk operations on cards

### ⏳ Study Modes
- **Standard Review**: Sequential card review
- **Spaced Repetition**: SM2-lite algorithm for optimized learning
- **Shuffle Mode**: Randomized card order
- Confidence rating system (1-5 scale)

### 🔍 Search & Filter
- Full-text search within decks
- Filter by tags and confidence levels
- Recently studied cards tracking

### 🧠 Learning Analytics
- Study statistics per deck and globally
- Track accuracy, time spent, and progress
- Cards studied per day tracking
- Visual progress indicators

### 🎨 Modern UI
- Clean, minimalist design
- Light/Dark theme support
- Responsive layout
- Smooth animations and transitions
- Accessibility-friendly

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd dear-bones
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm start
   ```

### Development

To run the application in development mode with hot reloading:

```bash
npm run start:dev
```

This will:
1. Start the webpack dev server on port 9000
2. Launch the Electron application
3. Enable hot reloading for React components

### Building

To build the application for production:

```bash
npm run build
```

To package the application:

```bash
npm run package
```

To create distributable packages:

```bash
npm run make
```

## 🏗️ Project Structure

```
dear-bones/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── index.ts          # Main process entry
│   │   └── preload.ts        # Preload script for IPC
│   ├── renderer/             # React application
│   │   ├── components/       # React components
│   │   ├── store/           # Zustand state management
│   │   ├── styles/          # CSS and Tailwind styles
│   │   ├── App.tsx          # Main React component
│   │   └── index.tsx        # React entry point
│   ├── types/               # TypeScript type definitions
│   └── database/            # Database schemas and utilities
├── dist/                    # Built application files
├── webpack.config.js        # Webpack configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── forge.config.js         # Electron Forge configuration
```

## 🔧 Technology Stack

- **Frontend**: React 18 + TypeScript
- **Desktop Framework**: Electron
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: SQLite3
- **Build Tools**: Webpack + Babel
- **Icons**: Lucide React
- **Development**: Electron Forge

## 📚 Usage Guide

### Creating Your First Deck

1. Click the "New Deck" button in the top-right corner
2. Fill in the deck information:
   - **Name**: Give your deck a descriptive name
   - **Description**: Optional description of the deck's content
   - **Emoji**: Choose an emoji to represent your deck
   - **Tags**: Add relevant tags for organization

### Adding Cards

1. Navigate to a deck and click "Add Card"
2. Enter the question or prompt in the "Front" field
3. Enter the answer or explanation in the "Back" field
4. Save the card

### Studying

1. Click the "Study" button on any deck
2. Read the question and think of your answer
3. Click the card to reveal the answer
4. Rate your confidence from 1 (hard) to 5 (easy)
5. Continue through all cards in the deck

### Viewing Statistics

Navigate to the "Stats" tab to view:
- Overall study statistics
- Per-deck performance metrics
- Time spent studying
- Accuracy percentages

## 🛠️ Development Notes

### State Management
The application uses Zustand for state management, providing a simple and efficient way to manage application state without the complexity of Redux.

### Database
SQLite is used for local data storage, with tables for:
- Decks and their metadata
- Individual flashcards
- Study sessions and progress
- Application settings

### Theming
The application supports automatic theme switching based on system preferences, with manual override options in settings.

### Security
The application follows Electron security best practices:
- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload scripts

## 🔮 Future Enhancements

- [ ] Media attachments (images, audio)
- [ ] Cloud synchronization
- [ ] Import/Export functionality
- [ ] Advanced spaced repetition algorithms
- [ ] Collaborative deck sharing
- [ ] Mobile companion app
- [ ] Advanced analytics and reporting

## 📄 License

MIT License - feel free to use this project for personal or educational purposes.

## 🙏 Acknowledgments

Built with modern web technologies and inspired by effective learning methodologies. Special thanks to the open-source community for the excellent tools and libraries that made this project possible.

---

**Happy Learning! 🎓** 