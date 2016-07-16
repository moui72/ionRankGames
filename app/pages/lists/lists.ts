import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Game } from '../../game.class';
import { List } from '../../list.class';

/*
  Generated class for the ListsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/lists/lists.html',
})
export class ListsPage {
  lists: Array<List>
  constructor(private nav: NavController) {

  }

}
