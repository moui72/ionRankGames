import { Game } from './game.class'

export class List{
  name: string = "New List";
  set: Array<Game> = [];
  rankedSet: Array<Game> = [];
  key: string;

  constructor(key: string){
    this.key = key;
  }

}

export class WrappedList{
  _id: string;
  list: List;
  constructor(list: List){
    this._id = 'li_' + list.key;
    this.list = list;
  }
}
