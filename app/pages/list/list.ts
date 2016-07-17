import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';
import { GameCompare } from '../../components/game-compare/game-compare';

/*
  TODO: implement sorting (drag and drop needs event listener)
        cf. http://ionicframework.com/docs/v2/api/components/item/ItemReorder/
 */

@Component({
  templateUrl: 'build/pages/list/list.html',
  directives: [GameCompare]
})
export class ListPage {
  list: List;

  constructor(private nav: NavController, private params: NavParams) {
    this.list = params.get('list')
  }

}
