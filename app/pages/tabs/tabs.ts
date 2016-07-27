import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { HomePage } from '../home/home';
import { ListsPage } from '../lists/lists';
import { HelpPage } from '../help/help';
import { Data } from '../../providers/data/data';

/*
  Generated class for the TabsPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/tabs/tabs.html',
})
export class TabsPage {

  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root = HomePage;
  tab2Root = ListsPage;
  tab3Root = HelpPage;
  logging: boolean = false;
  initialized: boolean = false;

  constructor(private data: Data) {
  }

  log(text){
    if (this.logging) {
      console.log(text);
    }
  }
}
