import { Component, Input } from '@angular/core';
import { NavController } from 'ionic-angular';
import { Game } from '../../game.class';

/*
  Generated class for the ListsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/list/list.html',
})
export class ListPage {
  @Input() set: Array<Game>;
  @Input() name: string;
  rankedSet: Array<Game>;

  constructor(private nav: NavController) {

  }

}
