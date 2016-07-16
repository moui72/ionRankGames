import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';
import { ListPage } from '../list/list'
/*
  Generated class for the ListsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/lists/lists.html',
})
/* TODO: figure out how to pass pool, newName to list */
export class ListsPage {
  @Input() pool: Array<Game>;
  lists: Array<List>;
  newName: string = 'New list';

  constructor(private nav: NavController) {
    this.lists = [];
  }

  create(){
    let list = new List;
    list.name = this.newName;
    list.set = this.pool;
    this.lists.push(list);
  }

  edit(list){
    this.nav.push(ListPage, list)
  }

}
