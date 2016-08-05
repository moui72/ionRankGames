export class BggOpts{
  // rating >= minrating
  minrating: number;

  // rank >= minkrank
  maxrank: number;

  // numPlays >= minplays
  minplays: number;

  // averageRating >= minAverageRating
  minAverageRating: number;

  // bgg-json isExpansion: bool
  excludeExp: boolean;

  // bgg-json owned: bool
  owned: boolean;

  // false if rating < 0
  rated: boolean;

  // false if numPlays < 1
  played: boolean;

  preOrdered: boolean;
  forTrade: boolean;
  previousOwned: boolean;
  want: boolean;
  wantToPlay: boolean;
  wantToBuy: boolean;
  wishList: boolean;

}
