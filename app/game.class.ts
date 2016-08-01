export class Game{
  gameId: number = 0;
  name: string = '';
  image: string = '';
  thumbnail: string = '';
  minPlayers: number = 0;
  maxPlayers: number = 0;
  playingTime: number = 0;
  isExpansion: boolean = false;
  yearPublished: number = 0;
  averageRating: number = 0;
  rank: number = 0;
  numPlays: number = 0;
  rating: number = 0;
  owned: boolean = false;
  preOrdered: boolean = false;
  forTrade: boolean = false;
  previousOwned: boolean = false;
  want: boolean = false;
  wantToPlay: boolean = false;
  wantToBuy: boolean = false;
  wishList: boolean = false;

  // internal
  trash: boolean = false;
  filtered: boolean = false;
}

export class WrappedGame{
  _id: string;
  game: Game;
}
