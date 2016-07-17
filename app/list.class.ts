import { Game } from './game.class'

export class List{
  name: string = "New List";
  set: Array<Game> = [];
  rankedSet: Array<Game> = [];
  key: string;

  constructor(key: string){
    this.key = key;
  }

  rankedCount(){
    if(this.rankedSet.length < 1){
      return 0;
    }
    return this.rankedSet.length;
  }
  unrankedCount(){
    if(this.set.length < 1){
      return 0;
    }
    return this.set.length;
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
