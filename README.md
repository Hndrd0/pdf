# 📅 Smart Timetable Display

A fast, clean, and simple timetable display designed for smartboards and classroom use.  
No login, no backend, no complexity — just a reliable schedule viewer.

---

## 🚀 Features

- ⚡ Super fast and lightweight  
- 🧩 Clean and minimal UI  
- 📺 Optimized for smartboard / full-screen display  
- 🔄 Highlights current day and period  
- ⏰ Shows current active period  
- 📱 Responsive for different screen sizes  
- 🧱 Fully static (no backend required)

---

## 🗂️ Project Structure


/index.html → Main display (smartboard view)
/admin.html → (Optional) admin/edit page
/timetable.json → Schedule data
/style.css → Styling
/script.js → Logic


---

## 📊 How It Works

- The timetable is stored in `timetable.json`
- The site reads this file and renders the schedule
- The current period is automatically detected and highlighted
- Works completely offline once loaded

---

## ✏️ Editing the Timetable

1. Open `timetable.json`
2. Update days, periods, or subjects
3. Save the file
4. Reload the website

That’s it.

---

## 🧠 Data Format

```json
{
  "days": ["Monday", "Tuesday"],
  "periods": [
    { "name": "P1", "time": "8:00 - 8:40" },
    { "name": "Break", "time": "10:00 - 10:20" }
  ],
  "schedule": {
    "Monday": ["Math", "Physics", "", "English"],
    "Tuesday": ["Chemistry", "Biology", "", "History"]
  }
}
```

## 📺 Smartboard Usage
Open the site in fullscreen mode
Keep it running on the display
It automatically shows:
current period
current day

## ⚠️ Notes
This is a static project — no database or backend
No authentication is implemented
Editing is done manually via the repository
Designed for controlled environments (e.g., classroom smartboards)

## 🛠️ Tech Stack
HTML
CSS
JavaScript
GitHub Pages (for hosting)
## 📌 Goal

To provide a simple, fast, and reliable timetable display without unnecessary complexity.
