import { Component } from '@angular/core';
import { NavController, NavParams, reorderArray } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';
import { GameCompare } from '../../components/game-compare/game-compare';
import { UnrankedGame } from '../../components/unranked-game/unranked-game';
import { Listdb } from '../../providers/listdb/listdb';
import * as _ from 'lodash';

/*
  TODO: implement sorting (drag and drop needs event listener)
        cf. http://ionicframework.com/docs/v2/api/components/item/ItemReorder/
 */

@Component({
  templateUrl: 'build/pages/list/list.html',
  directives: [GameCompare, UnrankedGame]
})
export class ListPage {
  list: List;

  constructor(private nav: NavController,
    private params: NavParams, private listdb: Listdb)
  {
    this.list = params.get('list');
    console.log(this.list);
  }

  save(){
    console.log("Saving " + this.list.name);
    this.listdb.update(this.list);
  }

  dragged(indices){
    this.list.rankedSet = reorderArray(this.list.rankedSet, indices);
    this.save();
  }

  append(game){
    this.list.rankedSet.push(game);
    this.save();
  }

  unrankedGames(){
    return _.differenceBy(this.list.set, this.list.rankedSet, 'gameId');
  }

}
