from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from models import User, UserInDB, Token
from auth import hash_password, verify_password, create_access_token, get_current_user
from dotenv import load_dotenv
from models import Bet, BetRecord
from jose import JWTError, jwt
import requests
import json
import os

load_dotenv()
ODDS_API_KEY = os.getenv("ODDS_API_KEY")
app = FastAPI()
DB_FILE = "database.json"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
BET_FILE = "bets.json"

def load_users():
    if not os.path.exists(DB_FILE):
        return []
    
    with open(DB_FILE, 'r') as f:
        return json.load(f)

def save_users(users):
    with open(DB_FILE, 'w') as f:
        json.dump(users, f, indent=4)


def load_bets():
    if not os.path.exists(BET_FILE):
        return []
    with open(BET_FILE, 'r') as f:
        return json.load(f)
    

def save_bets(bets):
    with open(BET_FILE, 'w') as f:
        json.dump(bets, f, indent=4)


@app.post("/register")
def register(user: User):
    users = load_users()
    if any(u["username"] == user.username for u in users):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = {
        "username": user.username,
        "password": hash_password(user.password),
        "balance": 1000.0
    }

    users.append(new_user)
    save_users(users)
    return {"message": "User Registered Successfully"}


@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users = load_users()
    user = next((u for u in users if u["username"] == form_data.username), None)
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    
    token = create_access_token(data={"sub": user["username"]})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/games")
def get_games(sport: str = "basketball_nba", bookmaker:str = "fanduel"):
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds/"
    params = {

        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h,spreads",
        "oddsFormat": "american",
        "bookmakers": bookmaker
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Error fetching games")

    # Optional: Clean response for frontend
    raw_games = response.json()
    games = []

    for g in raw_games:
        games.append({
            "id": g.get("id"),
            "teams": g.get("teams", []),
            "commence_time": g.get("commence_time"),
            "odds": g.get("bookmakers", [])[0]["markets"][0]["outcomes"]
                if g.get("bookmakers") and g["bookmakers"][0].get("markets") else []
        })

    return games


@app.post("/bets")
def place_bet(bet: Bet, username: str = Depends(get_current_user)):
    users = load_users()
    user = next((u for u in users if u["username"] == username), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user["balance"] < bet.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")

    # Subtract balance
    user["balance"] -= bet.amount
    save_users(users)

    # Save bet
    bets = load_bets()
    record = {
        "user": username,
        "game_id": bet.game_id,
        "team": bet.team,
        "odds": bet.odds,
        "amount": bet.amount,
        "resolved": False,
        "won": None
    }
    bets.append(record)
    save_bets(bets)

    return {"message": "Bet placed", "balance": user["balance"]}



