# 90 Day Win Tracker

A premium, addictive motivation tracker that helps you build habits and achieve your goals over 90 days. Features streak tracking, journaling, and progress visualization with a beautiful dark theme.

## Features

- **No Account Required**: Track your progress without signing up
- **Dark Theme**: Four stunning themes to choose from
- **Streak Tracking**: Snapchat-style streaks to keep you motivated
- **Daily Habits**: Track your non-negotiables every day
- **Journaling**: Reflect on your progress with gratitude, summaries, and ratings
- **Progress Visualization**: 90-day calendar showing wins and losses
- **Task Management**: To-do lists and reminders
- **Cross-device Sync**: Data persists across sessions (using localStorage)

## Themes

1. **Cyberpunk Neon**: Electric blues and pinks with vibrant accents
2. **Minimal Black & Gold**: Elegant black and gold aesthetic
3. **Soft Dark**: Calming dark theme inspired by Notion
4. **Hardcore Discipline**: Bold red theme for intense focus

## How It Works

### Getting Started

1. Visit the app and land on the "I WANT" page
2. Write a vivid description of your dream life (minimum 500 words)
3. Save your dream and click "Start My 90 Days" to begin
4. Your 90-day journey begins with Day 1!

### Test Mode

To skip the "I WANT" page and start with sample data immediately:

1. Add `?test=true` to the URL (e.g., `http://localhost:8000?test=true`)
2. The app will automatically load sample data and take you directly to the dashboard
3. You can then test all functionality without needing to write the dream text
4. The test data includes completed Day 1 with sample journal entries and habits

### Daily Routine

Each day, complete these 4 non-negotiables:
1. **Shower** - Maintain personal hygiene
2. **Clean** - Keep your environment tidy
3. **Pushups** - Start at 25 and increase by 1 each day
4. **Daily Journal** - Complete the gratitude, summary, and rating

### Streak System

- **Win Streak**: Consecutive days of completing all tasks
- **Loss Streak**: Consecutive days of failing to complete tasks
- **Warning**: If you have 2 losses in a row, you'll see an intense warning
- **Permanent Loss**: Once a day is marked as a loss, it's locked forever

### Data Persistence

Data is stored locally in your browser using localStorage. You can export/import your data manually:

- **Export**: Copy the JSON from localStorage
- **Import**: Paste JSON into localStorage

## Deployment

### Local Development

1. Install dependencies: `npm install`
2. Run the development server: `npm run serve` (uses http-server) or `npm run dev` (uses nodemon)
3. Visit `http://localhost:8000` in your browser

### Production Deployment

1. Install dependencies: `npm install`
2. Start the server: `npm start`
3. The application will be available on the port specified in the environment (default: 3000)

### Deploy to Heroku (example)

1. Create a Heroku app
2. Set the buildpack to Node.js
3. Deploy the code - Heroku will automatically run `npm start`

## Data Model

The app stores a single JSON object with:

```json
{
  "startDate": "ISO date string",
  "theme": "theme name",
  "soundEnabled": true/false,
  "dreamText": "your dream description",
  "days": [
    {
      "date": "ISO date string",
      "checklist": {
        "shower": true/false,
        "clean": true/false,
        "pushups": true/false,
        "journalDone": true/false
      },
      "pushupTarget": number,
      "journal": {
        "gratitude": ["item1", "item2", "item3"],
        "summary": "journal text",
        "rating": 1-10
      },
      "status": "future|current|win|loss",
      "timestamp": number
    }
  ],
  "todos": [...],
  "reminders": [...],
  "stats": {
    "currentWinStreak": number,
    "longestWinStreak": number,
    "currentLossStreak": number,
    "daysWon": number,
    "daysLost": number
  }
}
```

## Technical Implementation

Built with vanilla HTML, CSS, and JavaScript:
- **HTML5**: Semantic markup for accessibility
- **CSS3**: Flexbox and Grid for responsive layouts
- **JavaScript ES6**: Modern features for clean code
- **localStorage**: Client-side data persistence
- **Express.js**: Server framework for deployment
- **Web APIs**: Date manipulation and DOM interaction

## Responsive Design

- Optimized for desktop/laptop first
- Mobile-responsive with touch-friendly elements
- Adapts to different screen sizes

## Browser Compatibility

- Chrome, Firefox, Safari, Edge (latest versions)
- Requires localStorage support

## Future Enhancements

- Cloud sync with unique link sharing
- Notification system
- Detailed analytics and insights
- Sharing achievements
- Custom habit tracking
- Multi-language support

## Contributing

Feel free to fork this repository and submit pull requests for improvements.

## License

MIT License - feel free to use and modify for your own purposes.