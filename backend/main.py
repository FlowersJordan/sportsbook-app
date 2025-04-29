from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from models import User, UserInDB, Token
from auth import hash_password, verify_password, create_access_token, get_current_user
from dotenv import load_dotenv
from models import Bet, BetRecord
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
import requests
import json
import os

load_dotenv()
ODDS_API_KEY = os.getenv("ODDS_API_KEY")
app = FastAPI()
DB_FILE = "database.json"
HOLDING_FILE = "holding.json"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
BET_FILE = "bets.json"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] during dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

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


def load_holding():
    if not os.path.exists(HOLDING_FILE):
        return {"holding_balance": 0.0, "house_balance": 0.0}
    with open(HOLDING_FILE, 'r') as f:
        return json.load(f)

def save_holding(data):
    with open(HOLDING_FILE, 'w') as f:
        json.dump(data, f, indent=4)


@app.post("/register")
def register(user: User):
    users = load_users()
    if any(u["username"] == user.username for u in users):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = {
        "username": user.username,
        "password": hash_password(user.password),
        "balance": 0.0
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
def get_games(sport: str = "basketball_nba", bookmaker: str = "fanduel"):
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds/"
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": "h2h,spreads,totals",
        "oddsFormat": "american",
        "bookmakers": bookmaker
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise HTTPException(status_code=500, detail=f"Odds API error: {response.text}")

    raw_games = response.json()
    games = []

    for g in raw_games:
        book = next((b for b in g.get("bookmakers", []) if b.get("markets")), None)

        if not book:
            continue

        markets = {m["key"]: m["outcomes"] for m in book["markets"]}

        moneyline_outcomes = markets.get("h2h", [])

        teams = [team["name"] for team in moneyline_outcomes] if moneyline_outcomes else []

        games.append({
            "id": g.get("id"),
            "teams": teams,
            "commence_time": g.get("commence_time"),
            "bookmaker": book["title"],
            "moneyline": markets.get("h2h", []),
            "spread": markets.get("spreads", []),
            "totals": markets.get("totals", [])
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

    # Update holding balance
    holding = load_holding()
    holding["holding_balance"] += bet.amount
    save_holding(holding)

    # Calculate potential payout
    if bet.odds > 0:
        potential_payout = (bet.amount * bet.odds / 100) + bet.amount
    else:
        potential_payout = (bet.amount * 100 / abs(bet.odds)) + bet.amount

    # ✅ Lookup matchup from Odds API using game_id
    matchup = "Unknown Matchup"
    try:
        response = requests.get(
            "https://api.the-odds-api.com/v4/sports/basketball_nba/odds/",
            params={
                "apiKey": ODDS_API_KEY,
                "regions": "us",
                "markets": "h2h",
                "bookmakers": "fanduel"
            }
        )
        if response.status_code == 200:
            for game in response.json():
                if game.get("id") == bet.game_id:
                # Extract team names from moneyline outcomes
                    h2h_outcomes = None
                    for b in game.get("bookmakers", []):
                        for market in b.get("markets", []):
                            if market.get("key") == "h2h":
                                h2h_outcomes = market.get("outcomes", [])
                                break
                    if h2h_outcomes and len(h2h_outcomes) == 2:
                        matchup = f"{h2h_outcomes[0]['name']} vs {h2h_outcomes[1]['name']}"
                    break
    except Exception as e:
        print(f"❌ Failed to fetch matchup: {e}")

    # Save bet
    bets = load_bets()
    record = {
        "user": username,
        "game_id": bet.game_id,
        "team": bet.team,
        "bet_type": bet.bet_type,
        "odds": bet.odds,
        "amount": bet.amount,
        "potential_payout": round(potential_payout, 2),
        "spread_value": getattr(bet, "spread_value", None),
        "total_value": getattr(bet, "total_value", None),
        "matchup": matchup,
        "resolved": False,
        "won": None
    }
    bets.append(record)
    save_bets(bets)

    return {"message": "Bet placed", "balance": user["balance"]}




@app.get("/me")
def get_current_user_info(username: str = Depends(get_current_user)):
    users = load_users()
    user = next((u for u in users if u["username"] == username), None)
    if not user:
        raise HTTPException(status_code=404, detail="User Not Found")
    
    return {
        "username": user["username"],
        "balance": user["balance"]

    }


@app.get("/bets/me")
def get_user_bet(username: str = Depends(get_current_user)):
    bets = load_bets()
    my_bets = [b for b in bets if b["user"] == username]
    return my_bets