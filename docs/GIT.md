# Git – saving and submitting AgriMarket

## First time (inside the `agrimarket` folder)
```
git init
git add .
git commit -m "Initial commit: AgriMarket project structure"
git branch -M main
```

## Suggested commit history (one commit per step)
```
git add docs/wireframes.drawio docs/wireframes
git commit -m "Add wireframes for all 13 screens"

git add docs/erd.drawio docs/erd.png backend/database
git commit -m "Add ERD and MySQL schema"

git add backend
git commit -m "Add Express API: auth, products, orders, contact, admin"

git add frontend
git commit -m "Add front end pages and styles"

git add README.md docs
git commit -m "Add README, API and database documentation"
```

## Put it on GitHub
1. Create an empty repository on github.com (no README).
2. Run:
```
git remote add origin https://github.com/<your-username>/agrimarket.git
git push -u origin main
```

## Everyday commands
| Command | What it does |
|---|---|
| `git status` | Shows what changed |
| `git log --oneline` | Shows the commit history |
| `git checkout -b feature/name` | Starts a new branch |
| `git merge feature/name` | Joins a branch into the current one |

`.gitignore` already hides `node_modules/` and `.env` so passwords and big folders are not uploaded.
