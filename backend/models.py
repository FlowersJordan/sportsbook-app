from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    username: str
    password : str


class UserInDB(User):
    balance: float = 0.0


class Token(BaseModel):
    access_token: str
    token_type: str


class Bet(BaseModel):
    game_id:str
    team:str
    odds:float
    amount:float
    bet_type: str
    spread_value : Optional[float] = None
    total_value : Optional[float] = None

class BetRecord(Bet):
    user:str
    resolved: bool=False
    won: Optional[bool]=None